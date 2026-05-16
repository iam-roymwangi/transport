'use server';

import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Helper to ensure settings exist
async function getSettings() {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: 'singleton' },
  });
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: 'singleton', bookingsOpen: true },
    });
  }
  return settings;
}

export async function toggleBookingsOpenAction() {
  const authCookie = (await cookies()).get('admin_token')?.value;
  if (!authCookie || authCookie !== 'authenticated') {
    throw new Error('Unauthorized');
  }

  try {
    const settings = await getSettings();
    await prisma.systemSettings.update({
      where: { id: 'singleton' },
      data: { bookingsOpen: !settings.bookingsOpen },
    });
    
    // Revalidate paths so UI updates
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/staff');
    
    return { success: true };
  } catch (error) {
    console.error('Error toggling bookings:', error);
    return { success: false, error: 'Failed to toggle bookings' };
  }
}

export async function saveAutomationRulesAction(rules: any) {
  const authCookie = (await cookies()).get('admin_token')?.value;
  if (!authCookie || authCookie !== 'authenticated') {
    throw new Error('Unauthorized');
  }

  try {
    await getSettings();
    await prisma.systemSettings.update({
      where: { id: 'singleton' },
      data: { automationRules: rules },
    });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error saving rules:', error);
    return { success: false, error: 'Failed to save automation rules' };
  }
}

export async function getSystemStatus() {
  try {
    const settings = await getSettings();
    return settings.bookingsOpen;
  } catch (error) {
    return true; // Default open if error
  }
}
