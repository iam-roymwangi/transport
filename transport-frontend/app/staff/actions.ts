'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function staffLoginAction(prevState: any, formData: FormData) {
  const staffNumber = formData.get('staffNumber') as string;

  if (!staffNumber) {
    return { error: 'Staff Number is required' };
  }

  try {
    const staff = await prisma.staff.findUnique({
      where: { staffNumber },
    });

    if (!staff) {
      return { error: 'Invalid Staff Number. Employee not found.' };
    }

    // Since this is MVP, we just use the staffNumber as the token value.
    // In a real app, you would issue a signed JWT.
    (await cookies()).set('staff_token', staff.staffNumber, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  // Redirect after setting cookie (must be outside try-catch to work in Next.js)
  redirect('/staff');
}

export async function staffLogoutAction() {
  (await cookies()).delete('staff_token');
  redirect('/staff/login');
}

export async function submitEditRequestAction(bookingId: string, requestedChanges: any) {
  const authCookie = (await cookies()).get('staff_token')?.value;
  if (!authCookie) {
    throw new Error('Unauthorized');
  }

  try {
    const { getSystemStatus } = await import('../admin/settings-actions');
    const isOpen = await getSystemStatus();
    if (!isOpen) {
      return { success: false, error: 'Bookings are currently closed by the administrator.' };
    }

    // Make sure we format date correctly if provided
    let parsedData = { ...requestedChanges };
    if (parsedData.date) {
      parsedData.date = new Date(parsedData.date).toISOString();
    }

    await prisma.bookingEditRequest.create({
      data: {
        bookingId,
        staffNumber: authCookie, // staffNumber is the token value
        requestedChanges: parsedData,
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error submitting edit request:', error);
    return { success: false, error: 'Failed to submit edit request.' };
  }
}
