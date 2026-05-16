'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save } from 'lucide-react';
import { saveAutomationRulesAction } from '../../settings-actions';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function SettingsFilters({ initialRules }: { initialRules: any }) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialRules?.enabled || false);
  const [selectedDays, setSelectedDays] = useState<string[]>(initialRules?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [startTime, setStartTime] = useState(initialRules?.startTime || '08:00');
  const [endTime, setEndTime] = useState(initialRules?.endTime || '17:00');

  const handleSave = () => {
    startTransition(async () => {
      const rules = {
        enabled,
        days: selectedDays,
        startTime,
        endTime,
      };
      const result = await saveAutomationRulesAction(rules);
      if (result.success) {
        toast.success('Automation settings saved successfully!');
      } else {
        toast.error('Failed to save settings.');
      }
    });
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="space-y-0.5">
          <Label className="text-base">Enable Schedule Automation</Label>
          <p className="text-sm text-muted-foreground">
            Automatically open and close bookings based on the schedule below.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className={`space-y-6 ${!enabled && 'opacity-50 pointer-events-none'}`}>
        <div className="space-y-3">
          <Label>Active Days</Label>
          <div className="flex flex-wrap gap-4">
            {DAYS.map(day => (
              <label key={day} className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  checked={selectedDays.includes(day)}
                  onCheckedChange={() => toggleDay(day)}
                />
                <span className="text-sm">{day}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 max-w-md">
          <div className="space-y-2">
            <Label>Opening Time</Label>
            <Input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Closing Time</Label>
            <Input 
              type="time" 
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isPending} className="gap-2">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </Button>
    </div>
  );
}
