'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get('password');
  // Use a simple mock password for now if no env var is set
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === correctPassword) {
    (await cookies()).set('admin_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    redirect('/admin');
  }

  return { error: 'Invalid password' };
}

export async function logoutAction() {
  (await cookies()).delete('admin_token');
  redirect('/admin/login');
}

export async function deleteBookingsAction(ids: string[]) {
  const authCookie = (await cookies()).get('admin_token')?.value;
  if (!authCookie || authCookie !== 'authenticated') {
    throw new Error('Unauthorized');
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.booking.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting bookings:', error);
    return { success: false, error: 'Failed to delete bookings' };
  } finally {
    await prisma.$disconnect();
  }
}

export async function updateBookingAction(id: string, data: any) {
  const authCookie = (await cookies()).get('admin_token')?.value;
  if (!authCookie || authCookie !== 'authenticated') {
    throw new Error('Unauthorized');
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Validate date format and ensure it's a valid ISO string if provided
    let parsedData = { ...data };
    if (parsedData.date) {
      parsedData.date = new Date(parsedData.date).toISOString();
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: parsedData,
    });
    return { success: true, booking: updated };
  } catch (error) {
    console.error('Error updating booking:', error);
    return { success: false, error: 'Failed to update booking' };
  } finally {
    await prisma.$disconnect();
  }
}

export async function approveEditRequestAction(requestId: string) {
  const authCookie = (await cookies()).get('admin_token')?.value;
  if (!authCookie || authCookie !== 'authenticated') {
    throw new Error('Unauthorized');
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const request = await prisma.bookingEditRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error('Request not found');

    // 1. Update the Booking
    await prisma.booking.update({
      where: { id: request.bookingId },
      data: request.requestedChanges as any,
    });

    // 2. Mark request as APPROVED
    await prisma.bookingEditRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving request:', error);
    return { success: false, error: 'Failed to approve request' };
  } finally {
    await prisma.$disconnect();
  }
}

export async function rejectEditRequestAction(requestId: string) {
  const authCookie = (await cookies()).get('admin_token')?.value;
  if (!authCookie || authCookie !== 'authenticated') {
    throw new Error('Unauthorized');
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.bookingEditRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
    return { success: true };
  } catch (error) {
    console.error('Error rejecting request:', error);
    return { success: false, error: 'Failed to reject request' };
  } finally {
    await prisma.$disconnect();
  }
}
