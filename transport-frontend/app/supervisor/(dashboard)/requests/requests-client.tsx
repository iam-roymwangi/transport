'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ArrowRight,
  User,
  CalendarDays,
  MapPin,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  approveSupervisorEditRequestAction,
  rejectSupervisorEditRequestAction,
} from '../../actions';

interface RequestItem {
  id: string;
  bookingId: string;
  staffNumber: string;
  requestedChanges: any;
  status: string;
  supervisorId?: string | null;
  supervisorName?: string | null;
  reason?: string | null;
  reviewedAt?: Date | string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  createdAt: Date | string;
  originalBooking?: any;
  agent?: {
    id: string;
    name: string;
    bmsNumber?: string | null;
    staffNumber: string;
    phoneNumber?: string | null;
    location?: string | null;
    route?: string | null;
  } | null;
}

interface SupervisorRequestsClientProps {
  initialRequests: RequestItem[];
  supervisorName: string;
}

export function SupervisorRequestsClient({
  initialRequests,
  supervisorName,
}: SupervisorRequestsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Reject modal state
  const [rejectingRequest, setRejectingRequest] = useState<RequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Counts
  const pendingCount = initialRequests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = initialRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = initialRequests.filter((r) => r.status === 'REJECTED').length;

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return initialRequests.filter((req) => {
      // Status filter
      if (activeTab !== 'ALL' && req.status !== activeTab) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const agentName = req.agent?.name?.toLowerCase() || '';
        const bms = (req.agent?.bmsNumber || '').toLowerCase();
        const staffNum = req.staffNumber.toLowerCase();
        const reason = (req.reason || '').toLowerCase();
        const newShift = (req.requestedChanges?.shift || '').toLowerCase();

        if (
          !agentName.includes(lower) &&
          !bms.includes(lower) &&
          !staffNum.includes(lower) &&
          !reason.includes(lower) &&
          !newShift.includes(lower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [initialRequests, activeTab, searchTerm]);

  // Handler: Approve request
  const handleApprove = async (requestId: string) => {
    setActioningId(requestId);
    startTransition(async () => {
      try {
        const res = await approveSupervisorEditRequestAction(requestId);
        if (res.success) {
          toast.success('Shift edit request approved successfully!');
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to approve request');
        }
      } catch {
        toast.error('An error occurred during approval');
      } finally {
        setActioningId(null);
      }
    });
  };

  // Handler: Open reject modal
  const openRejectDialog = (req: RequestItem) => {
    setRejectingRequest(req);
    setRejectReason('');
  };

  // Handler: Submit reject
  const handleRejectSubmit = async () => {
    if (!rejectingRequest) return;
    setActioningId(rejectingRequest.id);
    startTransition(async () => {
      try {
        const res = await rejectSupervisorEditRequestAction(
          rejectingRequest.id,
          rejectReason.trim() || undefined
        );
        if (res.success) {
          toast.success('Shift edit request rejected.');
          setRejectingRequest(null);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to reject request');
        }
      } catch {
        toast.error('An error occurred');
      } finally {
        setActioningId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Agent Shift Edit Requests
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review and approve shift adjustments requested by your assigned agents for specific dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs py-1 px-2.5">
            Supervisor: {supervisorName}
          </Badge>
        </div>
      </div>

      {/* Main Card with Tabs */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
                <TabsTrigger value="PENDING" className="gap-1.5 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Pending ({pendingCount})
                </TabsTrigger>
                <TabsTrigger value="APPROVED" className="gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Approved ({approvedCount})
                </TabsTrigger>
                <TabsTrigger value="REJECTED" className="gap-1.5 text-xs">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  Rejected ({rejectedCount})
                </TabsTrigger>
                <TabsTrigger value="ALL" className="gap-1.5 text-xs">
                  All ({initialRequests.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search agent, BMS, shift, reason..."
                className="pl-8 h-8 text-xs w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
              <FileCheck2 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                No requests found
              </p>
              <p>There are no shift edit requests matching the selected view or search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => {
                const original = req.originalBooking;
                const changes = req.requestedChanges as any;
                const origShift = original?.shift || 'N/A';
                const newShift = changes?.shift || origShift;
                const isOvernight =
                  newShift.includes('02:00') ||
                  newShift.includes('01:00') ||
                  newShift.includes('03:00') ||
                  newShift.includes('05:00');
                const isActioning = actioningId === req.id;

                const targetDate = original?.date
                  ? format(new Date(original.date), 'EEEE, MMMM dd, yyyy')
                  : changes?.date
                  ? format(new Date(changes.date), 'EEEE, MMMM dd, yyyy')
                  : 'Specific Date';

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border bg-card hover:border-purple-300/80 transition-all shadow-xs space-y-3"
                  >
                    {/* Top Row: Agent & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {req.agent?.name || changes?.name || req.staffNumber}
                        </span>
                        <span className="text-xs font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                          BMS: {req.agent?.bmsNumber || 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          ({req.staffNumber})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === 'PENDING' && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </Badge>
                        )}
                        {req.status === 'APPROVED' && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </Badge>
                        )}
                        {req.status === 'REJECTED' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs gap-1">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          Submitted {format(new Date(req.createdAt), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Date & Shift Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      {/* Target Date */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-primary" />
                          Target Work Date
                        </span>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          {targetDate}
                        </div>
                      </div>

                      {/* Shift Change Comparison */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                          Requested Shift Change
                        </span>
                        <div className="flex items-center gap-2 flex-wrap font-mono">
                          <span className="line-through text-red-500 font-medium">
                            {origShift}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-bold text-purple-700 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200">
                            {newShift}
                            {isOvernight && ' 🌙'}
                          </span>
                        </div>
                      </div>

                      {/* Transport Pickup Landmark */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          Transport Route
                        </span>
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {changes?.location || original?.location || req.agent?.location || 'Westend'} &bull;{' '}
                          {changes?.route || original?.route || req.agent?.route || 'Route pending'}
                        </div>
                      </div>
                    </div>

                    {/* Agent Reason */}
                    {req.reason && (
                      <div className="p-3 rounded-lg bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 text-xs space-y-1">
                        <div className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 text-[11px]">
                          <MessageSquare className="w-3 h-3 text-purple-600" />
                          Reason Provided by Agent:
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic">
                          &quot;{req.reason}&quot;
                        </p>
                      </div>
                    )}

                    {/* Reviewer Note (if resolved) */}
                    {req.reviewNotes && req.status !== 'PENDING' && (
                      <div className="text-[11px] text-muted-foreground border-t pt-2 flex items-center justify-between">
                        <span>
                          Resolution note: <strong>{req.reviewNotes}</strong>
                        </span>
                        {req.reviewedBy && (
                          <span>
                            Reviewed by {req.reviewedBy} on{' '}
                            {req.reviewedAt ? format(new Date(req.reviewedAt), 'MMM dd, HH:mm') : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons for Pending Requests */}
                    {req.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRejectDialog(req)}
                          disabled={isActioning || isPending}
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject Request
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleApprove(req.id)}
                          disabled={isActioning || isPending}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1"
                        >
                          {isActioning ? (
                            <Spinner className="w-3.5 h-3.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approve Shift Change
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Confirmation Dialog */}
      <Dialog open={!!rejectingRequest} onOpenChange={(open) => !open && setRejectingRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Shift Change Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to decline this shift adjustment for{' '}
              <strong>{rejectingRequest?.agent?.name || rejectingRequest?.staffNumber}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border space-y-1">
              <div>Requested: <strong>{rejectingRequest?.requestedChanges?.shift}</strong></div>
              <div>Reason: &quot;{rejectingRequest?.reason || 'No reason provided'}&quot;</div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Feedback / Rejection Reason (Optional):
              </label>
              <Textarea
                placeholder="e.g. Insufficient coverage for this shift slot..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingRequest(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectSubmit}
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending && <Spinner className="w-3.5 h-3.5" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
