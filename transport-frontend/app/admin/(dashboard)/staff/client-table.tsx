'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Route, User, Download, Search, ChevronLeft, ChevronRight, Phone, Navigation } from 'lucide-react';
import type { Staff } from '@prisma/client';

interface StaffClientTableProps {
  initialStaff: Staff[];
}

export function StaffClientTable({ initialStaff }: StaffClientTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter staff based on search term
  const filteredStaff = useMemo(() => {
    return initialStaff.filter((s) => {
      const lowerSearch = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        s.name.toLowerCase().includes(lowerSearch) ||
        s.staffNumber.toLowerCase().includes(lowerSearch)
      );
    });
  }, [initialStaff, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const currentStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to Excel function
  const handleExport = () => {
    const exportData = filteredStaff.map((s) => ({
      'Employee Name': s.name,
      'Staff Number': s.staffNumber,
      'Phone Number': s.phoneNumber || 'N/A',
      'Location': s.location || 'N/A',
      'Current Shift': s.currentShift || 'N/A',
      'Process': s.process || 'N/A',
      'Route': s.route || 'N/A',
      'Address': s.address || 'N/A',
      'Pin Location': s.pinLocation || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Directory');
    
    const wscols = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, 
      { wch: 20 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Staff_Directory.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          {/* Search Filter */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or staff id..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
          <Button variant="outline" className="w-full lg:w-auto" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location & Shift</TableHead>
              <TableHead>Route & Process</TableHead>
              <TableHead>Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              currentStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{staff.name}</div>
                        <div className="text-xs text-muted-foreground">{staff.staffNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      {staff.phoneNumber ? (
                        <>
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {staff.phoneNumber}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        {staff.location ? (
                          <>
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {staff.location}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                      <Badge variant="secondary" className="w-fit font-normal text-xs">{staff.currentShift || 'No Shift'}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        {staff.route ? (
                          <>
                            <Route className="h-3 w-3 text-muted-foreground" />
                            {staff.route}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Process: {staff.process || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col gap-1 text-sm">
                        <div className="truncate max-w-[200px]" title={staff.address || ''}>
                          {staff.address || '-'}
                        </div>
                        {staff.pinLocation && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Navigation className="h-3 w-3" />
                            {staff.pinLocation}
                          </div>
                        )}
                     </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
