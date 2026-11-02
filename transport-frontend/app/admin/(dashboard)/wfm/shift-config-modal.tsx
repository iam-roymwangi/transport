'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { STAFF_ROLES, StaffRole, ROLE_INFO } from '@/lib/booking-options';
import { saveShiftConfigAction } from '../../wfm-actions';

interface ShiftConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftToEdit?: any | null;
  onSaved: () => void;
  defaultRole?: string;
}

export function ShiftConfigModal({
  open,
  onOpenChange,
  shiftToEdit,
  onSaved,
  defaultRole = 'Agent',
}: ShiftConfigModalProps) {
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState<string>(shiftToEdit?.role || defaultRole);
  const [name, setName] = useState<string>(shiftToEdit?.name || '');
  const [startTime, setStartTime] = useState<string>(shiftToEdit?.startTime || '17:00');
  const [endTime, setEndTime] = useState<string>(shiftToEdit?.endTime || '02:00');
  const [isOvernight, setIsOvernight] = useState<boolean>(
    shiftToEdit ? shiftToEdit.isOvernight : true
  );

  // Auto-suggest overnight based on start/end time
  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    if (start && end) {
      const [sH] = start.split(':').map(Number);
      const [eH] = end.split(':').map(Number);
      if (sH > eH) {
        setIsOvernight(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a shift title');
      return;
    }

    setLoading(true);
    try {
      const shiftLabel = `${startTime} - ${endTime}${isOvernight ? ' (Overnight)' : ''}`;
      const res = await saveShiftConfigAction({
        id: shiftToEdit?.id,
        role,
        name: name.trim(),
        startTime,
        endTime,
        shiftLabel,
        isOvernight,
        isActive: true,
      });

      if (res.success) {
        toast.success(`Shift "${name}" saved for ${role}!`);
        onSaved();
        onOpenChange(false);
      } else {
        toast.error('Failed to save shift');
      }
    } catch {
      toast.error('An error occurred while saving the shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {shiftToEdit ? 'Edit Role Shift' : 'Add New Flexible Shift'}
            </DialogTitle>
            <DialogDescription>
              Configure adjustable shifts for staff roles. Flexible shifts (such as 5pm to 2am) span across midnight.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shift-role">Target Role</Label>
              <Select value={role} onValueChange={setRole} disabled={loading}>
                <SelectTrigger id="shift-role">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r} &mdash; {ROLE_INFO[r]?.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift-name">Shift Name / Description</Label>
              <Input
                id="shift-name"
                placeholder="e.g. Evening Agent Shift (5pm - 2am)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => handleTimeChange(e.target.value, endTime)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => handleTimeChange(startTime, e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Overnight Shift (Next Day)</Label>
                <p className="text-xs text-muted-foreground">
                  E.g., starts at 17:00 (5 PM) and concludes at 02:00 (2 AM next morning)
                </p>
              </div>
              <Switch checked={isOvernight} onCheckedChange={setIsOvernight} />
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
              Formatted Label: <strong>{startTime} - {endTime}</strong> {isOvernight && '🌙 (Overnight)'}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Spinner className="w-4 h-4" />}
              {shiftToEdit ? 'Update Shift' : 'Create Shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
