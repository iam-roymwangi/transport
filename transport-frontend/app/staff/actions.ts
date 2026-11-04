'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { extractCoordinates, buildGoogleMapsUrl } from '@/lib/googleMaps';
import { revalidatePath } from 'next/cache';

export async function staffLoginAction(prevState: any, formData: FormData) {
  const bmsInput = ((formData.get('bmsNumber') as string) || (formData.get('staffNumber') as string) || '').trim();
  const passwordInput = ((formData.get('password') as string) || '').trim();

  if (!bmsInput) {
    return { error: 'Please enter your 7-digit BMS Number' };
  }

  if (!passwordInput) {
    return { error: 'Please enter your password' };
  }

  try {
    const cleanInput = bmsInput;
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          { bmsNumber: cleanInput },
          { staffNumber: cleanInput },
          { staffNumber: cleanInput.toUpperCase() },
        ],
      },
    });

    if (!staff) {
      return { error: 'Invalid BMS Number. Employee not found in system.' };
    }

    const expectedPassword = staff.password || staff.bmsNumber;
    if (!expectedPassword || passwordInput !== expectedPassword) {
      return { error: 'Invalid password. Your default password is your 7-digit BMS number.' };
    }

    // Set token with the staff number (used across portal queries)
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

    // Lookup agent to find their supervisor
    const staff = await prisma.staff.findUnique({
      where: { staffNumber: authCookie },
    });

    let supervisorId = staff?.supervisorId;
    let supervisorName = staff?.supervisorName;

    // Ensure every agent has a supervisor
    if (!supervisorName) {
      const defaultSupervisor = await prisma.staff.findFirst({
        where: { role: 'Supervisor' },
      });
      if (defaultSupervisor) {
        supervisorId = defaultSupervisor.id;
        supervisorName = defaultSupervisor.name;
        // Update staff record so they have this supervisor permanently
        await prisma.staff.update({
          where: { staffNumber: authCookie },
          data: {
            supervisorId: defaultSupervisor.id,
            supervisorName: defaultSupervisor.name,
          },
        });
      }
    }

    await prisma.bookingEditRequest.create({
      data: {
        bookingId,
        staffNumber: authCookie,
        requestedChanges: parsedData,
        supervisorId: supervisorId || null,
        supervisorName: supervisorName || null,
        reason: requestedChanges.reason || null,
      },
    });
    return { success: true, supervisorName };
  } catch (error) {
    console.error('Error submitting edit request:', error);
    return { success: false, error: 'Failed to submit edit request.' };
  }
}

export async function updateMyTransportDetailsAction(data: {
  phoneNumber?: string;
  location?: string;
  route?: string;
  address?: string;
  googleMapsUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  pinLocation?: string;
}) {
  const authCookie = (await cookies()).get('staff_token')?.value;
  if (!authCookie) {
    throw new Error('Unauthorized');
  }

  try {
    let lat = data.latitude;
    let lng = data.longitude;
    let pinLocation = data.pinLocation?.trim() || null;
    let googleMapsUrl = data.googleMapsUrl?.trim() || null;

    // If coordinates missing, attempt extraction from googleMapsUrl or pinLocation
    if ((lat === undefined || lat === null) && googleMapsUrl) {
      const extracted = extractCoordinates(googleMapsUrl);
      if (extracted) {
        lat = extracted.latitude;
        lng = extracted.longitude;
      }
    }

    if ((lat === undefined || lat === null) && pinLocation) {
      const extracted = extractCoordinates(pinLocation);
      if (extracted) {
        lat = extracted.latitude;
        lng = extracted.longitude;
      }
    }

    // Standardize URL and pin string
    if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
      if (!googleMapsUrl) {
        googleMapsUrl = buildGoogleMapsUrl(lat, lng);
      }
      if (!pinLocation) {
        pinLocation = `${lat}, ${lng}`;
      }
    }

    const updated = await prisma.staff.update({
      where: { staffNumber: authCookie },
      data: {
        phoneNumber: data.phoneNumber,
        location: data.location,
        route: data.route,
        address: data.address,
        googleMapsUrl,
        pinLocation,
        latitude: lat ?? null,
        longitude: lng ?? null,
      },
    });

    revalidatePath('/staff');
    revalidatePath('/staff/profile');

    return { success: true, staff: updated };
  } catch (error) {
    console.error('Error updating transport details:', error);
    return { success: false, error: 'Failed to update transport details.' };
  }
}
