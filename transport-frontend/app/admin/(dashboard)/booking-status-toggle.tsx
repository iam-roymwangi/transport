'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toggleBookingsOpenAction } from '../settings-actions';

interface BookingStatusToggleProps {
  initialStatus: boolean;
}

export function BookingStatusToggle({ initialStatus }: BookingStatusToggleProps) {
  const [isOpen, setIsOpen] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    setIsOpen(checked);
    startTransition(async () => {
      const result = await toggleBookingsOpenAction();
      if (!result.success) {
        setIsOpen(!checked); // revert on failure
        alert(result.error);
      }
    });
  };

  return (
    <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-full border">
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className={`h-2 w-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
      )}
      <Label htmlFor="booking-status" className="text-sm font-medium cursor-pointer">
        {isOpen ? 'Bookings Open' : 'Bookings Closed'}
      </Label>
      <Switch
        id="booking-status"
        checked={isOpen}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="ml-2 data-[state=checked]:bg-emerald-500"
      />
    </div>
  );
}
