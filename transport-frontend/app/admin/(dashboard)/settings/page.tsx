import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsFilters } from './settings-filters';
import { Settings as SettingsIcon } from 'lucide-react';

export const revalidate = 0;

export default async function SettingsPage() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'singleton' },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <CardTitle>Automation Rules</CardTitle>
          </div>
          <CardDescription>
            Configure filters for when the transport booking form should be open automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsFilters initialRules={settings?.automationRules} />
        </CardContent>
      </Card>
    </div>
  );
}
