'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { extractCoordinates, buildGoogleMapsUrl } from '@/lib/googleMaps';
import { revalidatePath } from 'next/cache';
import { startOfDay } from 'date-fns';

export async function supervisorLoginAction(prevState: any, formData: FormData) {
  const bmsInput = ((formData.get('bmsNumber') as string) || (formData.get('staffNumber') as string) || '').trim();
  const passwordInput = ((formData.get('password') as string) || '').trim();

  if (!bmsInput) {
    return { error: 'Please enter your BMS Number or Staff ID' };
  }

  if (!passwordInput) {
    return { error: 'Please enter your password' };
  }

  try {
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          { bmsNumber: bmsInput },
          { staffNumber: bmsInput },
          { staffNumber: bmsInput.toUpperCase() },
        ],
      },
    });

    if (!staff) {
      return { error: 'Employee not found in system.' };
    }

    // Role check: must be a Supervisor
    if (staff.role !== 'Supervisor') {
      return { error: `Access restricted. Your assigned role is "${staff.role}". This portal is only accessible to Supervisors.` };
    }

    const expectedPassword = staff.password || staff.bmsNumber;
    if (!expectedPassword || passwordInput !== expectedPassword) {
      return { error: 'Invalid password. Your default password is your 7-digit BMS number.' };
    }

    // Set supervisor token cookie
    (await cookies()).set('supervisor_token', staff.staffNumber, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
  } catch (error) {
    console.error('Supervisor login error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  redirect('/supervisor');
}

export async function supervisorLogoutAction() {
  (await cookies()).delete('supervisor_token');
  redirect('/supervisor/login');
}

export async function getLoggedInSupervisor() {
  const token = (await cookies()).get('supervisor_token')?.value;
  if (!token) return null;

  return await prisma.staff.findUnique({
    where: { staffNumber: token },
  });
}

export async function approveSupervisorEditRequestAction(requestId: string, reviewNotes?: string) {
  const supervisor = await getLoggedInSupervisor();
  if (!supervisor || supervisor.role !== 'Supervisor') {
    throw new Error('Unauthorized supervisor session');
  }

  try {
    const request = await prisma.bookingEditRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'Shift edit request not found.' };
    }

    // 1. Update the Booking with requested changes
    const requestedData = request.requestedChanges as any;
    const parsedData: any = {};
    if (requestedData.shift) parsedData.shift = requestedData.shift;
    if (requestedData.location) parsedData.location = requestedData.location;
    if (requestedData.route) parsedData.route = requestedData.route;
    if (requestedData.address) parsedData.address = requestedData.address;
    if (requestedData.process) parsedData.process = requestedData.process;
    if (requestedData.date) parsedData.date = new Date(requestedData.date);

    await prisma.booking.update({
      where: { id: request.bookingId },
      data: parsedData,
    });

    // 2. Mark request as APPROVED
    await prisma.bookingEditRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: supervisor.name,
        reviewNotes: reviewNotes || 'Approved by Supervisor',
      },
    });

    revalidatePath('/supervisor/requests');
    revalidatePath('/supervisor');
    revalidatePath('/staff');
    revalidatePath('/admin/requests');
    return { success: true };
  } catch (error) {
    console.error('Error approving request:', error);
    return { success: false, error: 'Failed to approve shift edit request.' };
  }
}

export async function rejectSupervisorEditRequestAction(requestId: string, reason?: string) {
  const supervisor = await getLoggedInSupervisor();
  if (!supervisor || supervisor.role !== 'Supervisor') {
    throw new Error('Unauthorized supervisor session');
  }

  try {
    await prisma.bookingEditRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: supervisor.name,
        reviewNotes: reason || 'Rejected by Supervisor',
      },
    });

    revalidatePath('/supervisor/requests');
    revalidatePath('/supervisor');
    revalidatePath('/staff');
    revalidatePath('/admin/requests');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting request:', error);
    return { success: false, error: 'Failed to reject shift edit request.' };
  }
}

export async function updateAgentTransportBySupervisorAction(data: {
  staffId: string;
  phoneNumber?: string;
  location: string;
  route: string;
  address?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
}) {
  const supervisor = await getLoggedInSupervisor();
  if (!supervisor || supervisor.role !== 'Supervisor') {
    throw new Error('Unauthorized supervisor session');
  }

  try {
    const agent = await prisma.staff.findUnique({
      where: { id: data.staffId },
    });

    if (!agent) {
      return { success: false, error: 'Agent record not found.' };
    }

    // Verify agent belongs to this supervisor (or supervisor match)
    if (agent.supervisorId !== supervisor.id && agent.supervisorName !== supervisor.name) {
      return { success: false, error: 'You are only authorized to manage transport details for your assigned agents.' };
    }

    let lat = data.latitude;
    let lng = data.longitude;
    let mapsUrl = data.googleMapsUrl?.trim();

    if (mapsUrl && (!lat || !lng)) {
      const extracted = extractCoordinates(mapsUrl);
      if (extracted) {
        lat = extracted.latitude;
        lng = extracted.longitude;
      }
    }

    if (lat && lng && !mapsUrl) {
      mapsUrl = buildGoogleMapsUrl(lat, lng);
    }

    // Update Staff record
    const updatedStaff = await prisma.staff.update({
      where: { id: data.staffId },
      data: {
        phoneNumber: data.phoneNumber || agent.phoneNumber,
        location: data.location,
        route: data.route,
        address: data.address || agent.address,
        googleMapsUrl: mapsUrl || agent.googleMapsUrl,
        latitude: lat !== undefined ? lat : agent.latitude,
        longitude: lng !== undefined ? lng : agent.longitude,
      },
    });

    // Update future active bookings for this agent so transport is synced immediately
    await prisma.booking.updateMany({
      where: {
        staffNumber: agent.staffNumber,
        date: { gte: startOfDay(new Date()) },
      },
      data: {
        location: data.location,
        route: data.route,
        address: data.address || agent.address,
        googleMapsUrl: mapsUrl || agent.googleMapsUrl,
        latitude: lat !== undefined ? lat : agent.latitude,
        longitude: lng !== undefined ? lng : agent.longitude,
      },
    });

    revalidatePath('/supervisor/agents');
    revalidatePath('/supervisor');
    revalidatePath('/admin/staff');

    return {
      success: true,
      message: `Transport details updated for ${agent.name}. Future bookings updated successfully.`,
      staff: updatedStaff,
    };
  } catch (error) {
    console.error('Error updating agent transport:', error);
    return { success: false, error: 'Failed to update transport details.' };
  }
}
