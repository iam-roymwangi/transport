'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Layers, Sparkles, CalendarDays, CheckCircle2 } from 'lucide-react';
import { createCampaignAction, updateCampaignAction } from '../../campaign-actions';

// Sunday (0) to Saturday (6)
const DAYS = [
  { index: 0, short: 'Sun', full: 'Sunday' },
  { index: 1, short: 'Mon', full: 'Monday' },
  { index: 2, short: 'Tue', full: 'Tuesday' },
  { index: 3, short: 'Wed', full: 'Wednesday' },
  { index: 4, short: 'Thu', full: 'Thursday' },
  { index: 5, short: 'Fri', full: 'Friday' },
  { index: 6, short: 'Sat', full: 'Saturday' },
];

const PRESET_REST_COMBOS = [
  { label: 'Friday & Saturday', days: [5, 6] },
  { label: 'Saturday & Sunday', days: [6, 0] },
  { label: 'Sunday & Monday', days: [0, 1] },
  { label: 'Friday & Monday (Caption Call)', days: [5, 1], highlight: true },
];

interface CampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignToEdit?: any | null;
  onSuccess: () => void;
}

export function CampaignModal({
  open,
  onOpenChange,
  campaignToEdit,
  onSuccess,
}: CampaignModalProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [workingDaysCount, setWorkingDaysCount] = useState(5);
  const [restDaysCount, setRestDaysCount] = useState(2);
  const [defaultRestDays, setDefaultRestDays] = useState<number[]>([5, 6]);
  const [allowedRestDays, setAllowedRestDays] = useState<number[]>([5, 6, 0, 1]);
  const [notes, setNotes] = useState('');

  // Sync state when editing
  useEffect(() => {
    if (campaignToEdit) {
      setName(campaignToEdit.name || '');
      setCode(campaignToEdit.code || '');
      setStatus(campaignToEdit.status || 'ACTIVE');
      setWorkingDaysCount(campaignToEdit.workingDaysCount || 5);
      setRestDaysCount(campaignToEdit.restDaysCount || 2);
      setDefaultRestDays(campaignToEdit.defaultRestDays || [5, 6]);
      setAllowedRestDays(campaignToEdit.allowedRestDays || [5, 6, 0, 1]);
      setNotes(campaignToEdit.notes || '');
    } else {
      setName('');
      setCode('');
      setStatus('ACTIVE');
      setWorkingDaysCount(5);
      setRestDaysCount(2);
      setDefaultRestDays([5, 6]);
      setAllowedRestDays([5, 6, 0, 1]);
      setNotes('');
    }
  }, [campaignToEdit, open]);

  // Toggle day in allowed array
  const toggleAllowedDay = (dayIndex: number) => {
    if (allowedRestDays.includes(dayIndex)) {
      if (allowedRestDays.length <= 2) {
        toast.error('At least 2 rest days must remain allowed');
        return;
      }
      setAllowedRestDays(allowedRestDays.filter((d) => d !== dayIndex));
      // Also remove from default if removed from allowed
      if (defaultRestDays.includes(dayIndex)) {
        setDefaultRestDays(defaultRestDays.filter((d) => d !== dayIndex));
      }
    } else {
      setAllowedRestDays([...allowedRestDays, dayIndex].sort((a, b) => a - b));
    }
  };

  // Toggle default rest day
  const toggleDefaultRestDay = (dayIndex: number) => {
    if (defaultRestDays.includes(dayIndex)) {
      if (defaultRestDays.length <= 1) {
        toast.error('Select at least 1 default rest day');
        return;
      }
      setDefaultRestDays(defaultRestDays.filter((d) => d !== dayIndex));
    } else {
      if (defaultRestDays.length >= restDaysCount) {
        // Replace first
        setDefaultRestDays([...defaultRestDays.slice(1), dayIndex]);
      } else {
        setDefaultRestDays([...defaultRestDays, dayIndex]);
      }
      // Ensure it is allowed
      if (!allowedRestDays.includes(dayIndex)) {
        setAllowedRestDays([...allowedRestDays, dayIndex].sort((a, b) => a - b));
      }
    }
  };

  // Preset quick apply
  const applyPreset = (presetDays: number[]) => {
    setDefaultRestDays(presetDays);
    // Ensure all preset days are included in allowedRestDays
    const newAllowed = Array.from(new Set([...allowedRestDays, ...presetDays])).sort((a, b) => a - b);
    setAllowedRestDays(newAllowed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (defaultRestDays.length === 0) {
      toast.error('Please select default rest days');
      return;
    }

    startTransition(async () => {
      try {
        if (campaignToEdit) {
          const res = await updateCampaignAction(campaignToEdit.id, {
            name,
            code,
            status,
            workingDaysCount,
            restDaysCount,
            defaultRestDays,
            allowedRestDays,
            notes,
            previousName: campaignToEdit.name,
          });
          if (res.success) {
            toast.success(`Campaign "${name}" updated successfully`);
            onSuccess();
            onOpenChange(false);
          }
        } else {
          const res = await createCampaignAction({
            name,
            code,
            status,
            workingDaysCount,
            restDaysCount,
            defaultRestDays,
            allowedRestDays,
            notes,
          });
          if (res.success) {
            toast.success(`Campaign "${name}" created successfully`);
            onSuccess();
            onOpenChange(false);
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to save campaign');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Layers className="w-5 h-5 text-primary" />
              {campaignToEdit ? 'Edit Campaign Configuration' : 'Create New Campaign'}
            </DialogTitle>
            <DialogDescription>
              Configure campaign rest day rules, working schedule policy, and operational guidelines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            {/* Row 1: Name and Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="campaignName" className="font-semibold text-slate-800">
                  Campaign Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="campaignName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Caption Call, Vinted, BT, wynZ"
                  required
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="campaignCode" className="font-semibold text-slate-800">
                  Code / Short Tag
                </Label>
                <Input
                  id="campaignCode"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CCALL"
                  className="h-9 font-mono uppercase"
                />
              </div>
            </div>

            {/* Row 2: Status & Days Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-800">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-800">Working Days / Week</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={workingDaysCount}
                  onChange={(e) => setWorkingDaysCount(parseInt(e.target.value) || 5)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-800">Rest Days / Week</Label>
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={restDaysCount}
                  onChange={(e) => setRestDaysCount(parseInt(e.target.value) || 2)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Default Rest Days Presets */}
            <div className="space-y-2 p-3 rounded-lg bg-slate-50 border">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-primary" />
                  Default Rest Days (Week: Sunday – Saturday)
                </Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {defaultRestDays.length} selected of {restDaysCount} required
                </span>
              </div>

              {/* Day selection buttons */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {DAYS.map((d) => {
                  const isSelected = defaultRestDays.includes(d.index);
                  const isAllowed = allowedRestDays.includes(d.index);

                  return (
                    <button
                      type="button"
                      key={d.index}
                      onClick={() => toggleDefaultRestDay(d.index)}
                      className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm font-bold'
                          : isAllowed
                          ? 'bg-white hover:bg-slate-100 text-slate-700'
                          : 'bg-slate-100 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold">{d.short}</span>
                      <span className="text-[9px] font-mono">{d.index}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                  Quick Rest Day Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REST_COMBOS.map((p) => {
                    const isCurrent =
                      JSON.stringify(defaultRestDays.sort()) === JSON.stringify(p.days.sort());
                    return (
                      <button
                        type="button"
                        key={p.label}
                        onClick={() => applyPreset(p.days)}
                        className={`text-[11px] px-2 py-1 rounded-md border transition-all ${
                          isCurrent
                            ? 'bg-primary/10 border-primary text-primary font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-700'
                        } ${p.highlight ? 'border-amber-300' : ''}`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Allowed Rest Days Window */}
            <div className="space-y-2 p-3 rounded-lg bg-amber-50/60 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Allowed Rest Days Window
                  </Label>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    For <strong>Caption Call</strong>, rest days range from <strong>Friday to Monday</strong> ([5, 6, 0, 1]).
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-800">
                  {allowedRestDays.length} Days Allowed
                </Badge>
              </div>

              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {DAYS.map((d) => {
                  const isAllowed = allowedRestDays.includes(d.index);
                  const isCaptionWindow = [5, 6, 0, 1].includes(d.index);

                  return (
                    <button
                      type="button"
                      key={d.index}
                      onClick={() => toggleAllowedDay(d.index)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        isAllowed
                          ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm'
                          : 'bg-white hover:bg-amber-100/50 text-slate-600 border-dashed'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold">{d.short}</span>
                      {isCaptionWindow && (
                        <span className="text-[8px] block opacity-80">Fri-Mon</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="campaignNotes" className="font-semibold text-slate-800">
                Operational Notes &amp; Rostering Guidelines
              </Label>
              <Textarea
                id="campaignNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special transport policies, client requirements, or campaign handover notes..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 bg-gradient-to-r from-primary to-secondary"
            >
              {isPending && <Spinner className="w-4 h-4" />}
              {campaignToEdit ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
