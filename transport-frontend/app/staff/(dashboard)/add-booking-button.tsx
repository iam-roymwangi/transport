'use client';

import { useRouter } from 'next/navigation';
import { AddBookingForm } from '@/components/add-booking-form';

export function StaffAddBookingButton({ initialData }: { initialData: any }) {
  const router = useRouter();
  
  return (
    <AddBookingForm 
      initialData={initialData} 
      onBookingAdded={() => {
        router.refresh();
      }} 
    />
  );
}
