'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  Layers,
  Plus,
  Search,
  Users,
  CalendarDays,
  Sparkles,
  Edit,
  Trash2,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { CampaignModal } from './campaign-modal';
import {
  deleteCampaignAction,
  reassignStaffCampaignAction,
} from '../../campaign-actions';

interface CampaignsDashboardProps {
  initialCampaigns: any[];
  initialUnassignedStaff: any[];
  totalStaffCount: number;
}

const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CampaignsDashboard({
  initialCampaigns,
  initialUnassignedStaff,
  totalStaffCount,
}: CampaignsDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<any | null>(null);

  // View Staff Dialog state
  const [selectedCampaignForStaff, setSelectedCampaignForStaff] = useState<any | null>(null);
  const [selectedStaffNumbers, setSelectedStaffNumbers] = useState<string[]>([]);
  const [targetCampaignForMove, setTargetCampaignForMove] = useState<string>('');

  // Delete Confirm Dialog state
  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return initialCampaigns.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(lower);
        const matchesCode = (c.code || '').toLowerCase().includes(lower);
        const matchesNotes = (c.notes || '').toLowerCase().includes(lower);
        if (!matchesName && !matchesCode && !matchesNotes) return false;
      }
      return true;
    });
  }, [initialCampaigns, statusFilter, searchTerm]);

  // Caption Call campaign stats
  const captionCall = useMemo(() => {
    return initialCampaigns.find((c) => c.name.toLowerCase().includes('caption'));
  }, [initialCampaigns]);

  // Total assigned staff
  const totalAssignedStaff = useMemo(() => {
    return initialCampaigns.reduce((acc, c) => acc + (c.staffCount || 0), 0);
  }, [initialCampaigns]);

  // Handle Campaign Delete
  const handleDeleteCampaign = () => {
    if (!campaignToDelete) return;
    startTransition(async () => {
      try {
        await deleteCampaignAction(campaignToDelete.id);
        toast.success(`Campaign "${campaignToDelete.name}" deleted.`);
        setCampaignToDelete(null);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete campaign');
      }
    });
  };

  // Handle Reassign Selected Staff
  const handleReassignStaff = () => {
    if (selectedStaffNumbers.length === 0) {
      toast.error('Select at least one staff member to reassign');
      return;
    }
    if (!targetCampaignForMove) {
      toast.error('Select target campaign');
      return;
    }

    startTransition(async () => {
      try {
        const res = await reassignStaffCampaignAction({
          staffNumbers: selectedStaffNumbers,
          newCampaignName: targetCampaignForMove,
        });
        if (res.success) {
          toast.success(`Moved ${res.updatedCount} staff member(s) to "${targetCampaignForMove}".`);
          setSelectedStaffNumbers([]);
          setSelectedCampaignForStaff(null);
          router.refresh();
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to reassign staff');
      }
    });
  };

  const toggleSelectAll = (staffList: any[]) => {
    if (selectedStaffNumbers.length === staffList.length) {
      setSelectedStaffNumbers([]);
    } else {
      setSelectedStaffNumbers(staffList.map((s) => s.staffNumber));
    }
  };

  const toggleStaffSelect = (staffNum: string) => {
    if (selectedStaffNumbers.includes(staffNum)) {
      setSelectedStaffNumbers(selectedStaffNumbers.filter((n) => n !== staffNum));
    } else {
      setSelectedStaffNumbers([...selectedStaffNumbers, staffNum]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Campaign Management
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              {initialCampaigns.length} Active Campaigns
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setCampaignToEdit(null);
              setIsCampaignModalOpen(true);
            }}
            className="gap-1.5 text-xs bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Campaign
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{initialCampaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              Configured operational campaigns
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAssignedStaff} / {totalStaffCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Employees assigned to campaigns
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-200 bg-emerald-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">
              Rest Days Policy
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">2 Days / Wk</div>
            <p className="text-xs text-emerald-800">
              Sunday – Saturday week cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-card border shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search campaign, code, notes..."
              className="pl-8 h-8 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {initialUnassignedStaff.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
              {initialUnassignedStaff.length} Unassigned Staff
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCampaignForStaff({
                  name: 'Unassigned Staff',
                  staff: initialUnassignedStaff,
                  staffCount: initialUnassignedStaff.length,
                });
                setSelectedStaffNumbers([]);
              }}
              className="h-8 text-xs gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Assign to Campaign
            </Button>
          </div>
        )}
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCampaigns.map((camp) => {
          const isCaption = camp.isCaptionCall;

          return (
            <Card
              key={camp.id}
              className={`flex flex-col justify-between shadow-sm transition-all hover:shadow-md ${
                isCaption ? 'border-amber-300 bg-amber-50/15' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold text-slate-900">
                        {camp.name}
                      </CardTitle>
                      {camp.code && (
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {camp.code}
                        </Badge>
                      )}
                    </div>
                    {isCaption && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] gap-1">
                        <Sparkles className="w-3 h-3" /> Special Caption Call Window
                      </Badge>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      camp.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : camp.status === 'PAUSED'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {camp.status || 'ACTIVE'}
                  </Badge>
                </div>

                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {camp.notes || 'Standard operational campaign rotation schedule.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {/* Staff Headcount */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Team Headcount:
                  </span>
                  <span className="font-bold text-slate-800">
                    {camp.staffCount} Staff Members
                  </span>
                </div>

                {/* Default Rest Days */}
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-[11px] block">
                    Default Rest Days:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(camp.defaultRestDays || []).map((d: number) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-primary/10 text-primary border border-primary/20"
                      >
                        {DAY_SHORT_NAMES[d]} (day {d})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Allowed Rest Window */}
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-[11px] block">
                    Allowed Rest Window:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(camp.allowedRestDays || []).map((d: number) => {
                      const isSpecial = isCaption && [5, 6, 0, 1].includes(d);
                      return (
                        <span
                          key={d}
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                            isSpecial
                              ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {DAY_SHORT_NAMES[d]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Policy Specs */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span>Policy: {camp.workingDaysCount || 5} Work / {camp.restDaysCount || 2} Rest</span>
                  <span>Cycle: Sun &rarr; Sat</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCampaignForStaff(camp);
                    setSelectedStaffNumbers([]);
                    setTargetCampaignForMove('');
                  }}
                  className="h-8 text-xs gap-1.5 flex-1"
                >
                  <Users className="w-3.5 h-3.5 text-primary" />
                  View Team ({camp.staffCount})
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCampaignToEdit(camp);
                    setIsCampaignModalOpen(true);
                  }}
                  className="h-8 w-8 p-0 text-slate-600 hover:text-primary"
                  title="Edit Campaign"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCampaignToDelete(camp)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                  title="Delete Campaign"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <h3 className="font-semibold text-slate-700">No campaigns found</h3>
          <p className="text-xs mt-1">Try adjusting your search or create a new campaign.</p>
        </Card>
      )}

      {/* View Staff Team & Reassignment Dialog */}
      <Dialog
        open={!!selectedCampaignForStaff}
        onOpenChange={(open) => !open && setSelectedCampaignForStaff(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Staff Assigned to {selectedCampaignForStaff?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedCampaignForStaff?.staff?.length || 0} employees currently assigned to this campaign. Select staff to reassign to another campaign.
            </DialogDescription>
          </DialogHeader>

          {/* Reassignment Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                {selectedStaffNumbers.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSelectAll(selectedCampaignForStaff?.staff || [])}
                className="h-7 text-xs px-2"
              >
                {selectedStaffNumbers.length === (selectedCampaignForStaff?.staff?.length || 0)
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Move to:</span>
              <Select value={targetCampaignForMove} onValueChange={setTargetCampaignForMove}>
                <SelectTrigger className="w-48 h-8 text-xs bg-white">
                  <SelectValue placeholder="Select Campaign" />
                </SelectTrigger>
                <SelectContent>
                  {initialCampaigns
                    .filter((c) => c.name !== selectedCampaignForStaff?.name)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name} ({c.staffCount} staff)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={handleReassignStaff}
                disabled={isPending || selectedStaffNumbers.length === 0 || !targetCampaignForMove}
                className="h-8 text-xs gap-1.5 bg-primary"
              >
                {isPending ? <Spinner className="w-3.5 h-3.5" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                Reassign
              </Button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 sticky top-0">
                <tr>
                  <th className="p-2.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedStaffNumbers.length > 0 &&
                        selectedStaffNumbers.length === (selectedCampaignForStaff?.staff?.length || 0)
                      }
                      onChange={() => toggleSelectAll(selectedCampaignForStaff?.staff || [])}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="p-2.5 text-left font-bold">Staff Name</th>
                  <th className="p-2.5 text-left font-bold">BMS Number</th>
                  <th className="p-2.5 text-left font-bold">Role</th>
                  <th className="p-2.5 text-left font-bold">Supervisor</th>
                  <th className="p-2.5 text-left font-bold">Office / Route</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedCampaignForStaff?.staff?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No staff members assigned to this campaign yet.
                    </td>
                  </tr>
                ) : (
                  selectedCampaignForStaff?.staff?.map((s: any) => {
                    const isSelected = selectedStaffNumbers.includes(s.staffNumber);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => toggleStaffSelect(s.staffNumber)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/5' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStaffSelect(s.staffNumber)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900">{s.name}</td>
                        <td className="p-2.5 font-mono font-bold text-primary">
                          {s.bmsNumber || s.staffNumber}
                        </td>
                        <td className="p-2.5">
                          <Badge variant="outline" className="text-[10px]">
                            {s.role || 'Agent'}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {s.supervisorName || <span className="text-muted-foreground italic">None</span>}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {s.location || '-'} &bull; {s.route || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setSelectedCampaignForStaff(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Confirmation */}
      <Dialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Campaign
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete campaign <strong>&quot;{campaignToDelete?.name}&quot;</strong>?
              {campaignToDelete?.staffCount > 0 && (
                <span className="block mt-2 text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ Note: {campaignToDelete.staffCount} staff member(s) will be unassigned from this campaign.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCampaignToDelete(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCampaign}
              disabled={isPending}
              className="gap-2"
            >
              {isPending && <Spinner className="w-4 h-4" />}
              Delete Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Create/Edit Modal */}
      <CampaignModal
        open={isCampaignModalOpen}
        onOpenChange={setIsCampaignModalOpen}
        campaignToEdit={campaignToEdit}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
