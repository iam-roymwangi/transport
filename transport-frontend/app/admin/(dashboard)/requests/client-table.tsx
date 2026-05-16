'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
import type { Booking, BookingEditRequest } from '@prisma/client';
import { approveEditRequestAction, rejectEditRequestAction } from '../../actions';

type RequestWithContext = BookingEditRequest & { originalBooking?: Booking };

interface RequestsClientTableProps {
  requests: RequestWithContext[];
}

export function RequestsClientTable({ requests }: RequestsClientTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveEditRequestAction(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to approve request');
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      const result = await rejectEditRequestAction(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to reject request');
      }
    });
  };

  const renderChange = (original: string | null | undefined, requested: string | null | undefined, isDate = false) => {
    const origStr = isDate && original ? format(new Date(original), 'MMM d, yyyy') : original || '-';
    const reqStr = isDate && requested ? format(new Date(requested), 'MMM d, yyyy') : requested || '-';

    if (origStr === reqStr) {
      return <span className="text-muted-foreground">{origStr}</span>;
    }

    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="line-through text-red-500 opacity-70">{origStr}</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <span className="text-emerald-600 font-medium">{reqStr}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff & Requested On</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No pending edit requests.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => {
                const requestedData = req.requestedChanges as any;
                const originalData = req.originalBooking;

                return (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{req.staffNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(req.createdAt), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderChange(originalData?.shift, requestedData?.shift)}
                    </TableCell>
                    <TableCell>
                      {renderChange(originalData?.date?.toString(), requestedData?.date, true)}
                    </TableCell>
                    <TableCell>
                      {renderChange(originalData?.location, requestedData?.location)}
                    </TableCell>
                    <TableCell>
                      {renderChange(originalData?.route, requestedData?.route)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        disabled={isPending}
                        onClick={() => handleApprove(req.id)}
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isPending}
                        onClick={() => handleReject(req.id)}
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
