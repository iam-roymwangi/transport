'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function checkAdminAuth() {
  const authCookie = (await cookies()).get('admin_token')?.value;
  if (!authCookie || authCookie !== 'authenticated') {
    throw new Error('Unauthorized');
  }
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function getCampaignsWithStaffAction() {
  await checkAdminAuth();

  // 1. Fetch all campaigns
  const campaigns = await prisma.campaignConfig.findMany({
    orderBy: { name: 'asc' },
  });

  // 2. Fetch all staff to map counts and members
  const allStaff = await prisma.staff.findMany({
    select: {
      id: true,
      name: true,
      bmsNumber: true,
      staffNumber: true,
      role: true,
      location: true,
      route: true,
      address: true,
      supervisorName: true,
      currentShift: true,
      process: true,
    },
    orderBy: { name: 'asc' },
  });

  // Group staff by campaign name
  const staffByCampaign: Record<string, typeof allStaff> = {};
  const unassignedStaff: typeof allStaff = [];

  for (const s of allStaff) {
    const cName = s.process?.trim();
    if (cName) {
      if (!staffByCampaign[cName]) {
        staffByCampaign[cName] = [];
      }
      staffByCampaign[cName].push(s);
    } else {
      unassignedStaff.push(s);
    }
  }

  // Enrich campaigns with staff list and stats
  const enrichedCampaigns = campaigns.map((c) => {
    const staff = staffByCampaign[c.name] || [];
    return {
      ...c,
      staffCount: staff.length,
      staff,
      defaultRestDayNames: (c.defaultRestDays || []).map((d) => DAY_SHORT_NAMES[d] || String(d)),
      allowedRestDayNames: (c.allowedRestDays || []).map((d) => DAY_SHORT_NAMES[d] || String(d)),
      isCaptionCall: c.name.toLowerCase().includes('caption'),
    };
  });

  return {
    campaigns: enrichedCampaigns,
    unassignedStaff,
    totalStaffCount: allStaff.length,
    dayNames: DAY_NAMES,
    dayShortNames: DAY_SHORT_NAMES,
  };
}

export async function createCampaignAction(data: {
  name: string;
  code?: string;
  status?: string;
  defaultRestDays: number[];
  allowedRestDays: number[];
  workingDaysCount?: number;
  restDaysCount?: number;
  notes?: string;
}) {
  await checkAdminAuth();

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error('Campaign name is required');
  }

  // Check uniqueness
  const existing = await prisma.campaignConfig.findUnique({
    where: { name: trimmedName },
  });

  if (existing) {
    throw new Error(`Campaign "${trimmedName}" already exists`);
  }

  const campaign = await prisma.campaignConfig.create({
    data: {
      name: trimmedName,
      code: data.code?.trim() || null,
      status: data.status || 'ACTIVE',
      defaultRestDays: data.defaultRestDays.length ? data.defaultRestDays : [5, 6],
      allowedRestDays: data.allowedRestDays.length ? data.allowedRestDays : [5, 6, 0, 1],
      workingDaysCount: data.workingDaysCount || 5,
      restDaysCount: data.restDaysCount || 2,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath('/admin/campaigns');
  revalidatePath('/admin/wfm');
  return { success: true, campaign };
}

export async function updateCampaignAction(
  id: string,
  data: {
    name: string;
    code?: string;
    status?: string;
    defaultRestDays: number[];
    allowedRestDays: number[];
    workingDaysCount?: number;
    restDaysCount?: number;
    notes?: string;
    previousName?: string;
  }
) {
  await checkAdminAuth();

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error('Campaign name is required');
  }

  const updated = await prisma.campaignConfig.update({
    where: { id },
    data: {
      name: trimmedName,
      code: data.code?.trim() || null,
      status: data.status || 'ACTIVE',
      defaultRestDays: data.defaultRestDays,
      allowedRestDays: data.allowedRestDays,
      workingDaysCount: data.workingDaysCount || 5,
      restDaysCount: data.restDaysCount || 2,
      notes: data.notes?.trim() || null,
    },
  });

  // If campaign name was renamed, sync staff.process and booking.process
  if (data.previousName && data.previousName !== trimmedName) {
    await prisma.staff.updateMany({
      where: { process: data.previousName },
      data: { process: trimmedName },
    });

    await prisma.booking.updateMany({
      where: { process: data.previousName },
      data: { process: trimmedName },
    });
  }

  revalidatePath('/admin/campaigns');
  revalidatePath('/admin/wfm');
  return { success: true, campaign: updated };
}

export async function deleteCampaignAction(id: string) {
  await checkAdminAuth();

  const campaign = await prisma.campaignConfig.findUnique({
    where: { id },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Unassign staff attached to this campaign
  await prisma.staff.updateMany({
    where: { process: campaign.name },
    data: { process: null },
  });

  await prisma.campaignConfig.delete({
    where: { id },
  });

  revalidatePath('/admin/campaigns');
  revalidatePath('/admin/wfm');
  return { success: true };
}

export async function reassignStaffCampaignAction(data: {
  staffNumbers: string[];
  newCampaignName: string;
}) {
  await checkAdminAuth();

  if (!data.staffNumbers || data.staffNumbers.length === 0) {
    throw new Error('No staff members selected');
  }

  const updatedCount = await prisma.staff.updateMany({
    where: { staffNumber: { in: data.staffNumbers } },
    data: { process: data.newCampaignName || null },
  });

  revalidatePath('/admin/campaigns');
  revalidatePath('/admin/wfm');
  revalidatePath('/admin/staff');

  return { success: true, updatedCount: updatedCount.count };
}
