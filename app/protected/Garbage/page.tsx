//import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
'use client';
import { createClient } from "@/utils/supabase/client";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import CreateRequestForm from '@/app/protected/Garbage/garbage_req_form';
import { Pencil, Trash2 } from "lucide-react";
import EditGarbageRequestForm from './EditGarbageRequestForm';



import { useEffect, useState } from 'react';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    ArrowUpDown, 
    Search, 
    Loader2 
} from "lucide-react";

interface ColumnOption {
  id: string;
  label: string;
  required?: boolean;
  sortable?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function GarbageRequestTable() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Column definitions
  const columnOptions: ColumnOption[] = [
      { id: 'garbage_req_id', label: 'Request ID', required: true, sortable: true },
      { id: 'factory_id', label: 'Factory ID', sortable: true },
      { id: 'garbage_type', label: 'Garbage Type', sortable: true },
      { id: 'garbage_quantity', label: 'Quantity', sortable: true },
      { id: 'remaining_garbage', label: 'Remaining Quantity', sortable: true }, 
      { id: 'garbage_request_date', label: 'Request Date', sortable: true },
      { id: 'garbage_req_status', label: 'Status', sortable: true },
      { id: 'factory_name', label: 'Factory Name', sortable: true },  // Added
      { id: 'factory_location', label: 'Factory Location', sortable: true },  // Added
      { id: 'actions', label: 'Actions', required: true, sortable: false },
  ];

  // States
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['garbage_req_id', 'actions']);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
      key: 'garbage_req_id',
      direction: 'asc'
  });

  // Load saved column preferences from localStorage
  useEffect(() => {
    const savedColumns = localStorage.getItem('selectedColumns');
    if (savedColumns) {
        const parsed = JSON.parse(savedColumns);
        if (!parsed.includes('garbage_req_id')) {
            parsed.push('garbage_req_id');
        }
        if (!parsed.includes('actions')) {
            parsed.push('actions');
        }
        setSelectedColumns(parsed);
    } else {
        // If no saved columns, set default columns
        setSelectedColumns(['garbage_req_id', 'actions']);
    }
}, []);
  // Fetch data
  useEffect(() => {
      fetchData();
  }, [sortConfig]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const supabase = await createClient();
        let query = supabase
            .from('factory_garbage_request')
            .select(`
                garbage_req_id,
                garbage_type,
                garbage_quantity,
                remaining_garbage,
                garbage_req_status,
                factory_id,
                garbage_request_date,
                factory:factory_id (
                    factory_name,
                    factory_location,
                    factory_latitude,
                    factory_longitude
                )
            `);

        // Handle sorting
        if (sortConfig.key === 'factory_name') {
            query = query.order('factory(factory_name)', { ascending: sortConfig.direction === 'asc' });
        } else if (sortConfig.key === 'factory_location') {
            query = query.order('factory(factory_location)', { ascending: sortConfig.direction === 'asc' });
        } else {
            query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });
        }

        const { data: responseData, error: responseError } = await query;

        if (responseError) throw new Error(responseError.message);
        setData(responseData);
        setError(null);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};
  // Column selection handler
  const toggleColumn = (columnId: string) => {
    if (columnId === 'garbage_req_id' || columnId === 'actions') return; // Prevent toggling of required columns
    const newSelection = selectedColumns.includes(columnId)
        ? selectedColumns.filter(id => id !== columnId)
        : [...selectedColumns, columnId];
    
    setSelectedColumns(newSelection);
    localStorage.setItem('selectedColumns', JSON.stringify(newSelection));
};

  // Sorting handler
  const handleSort = (columnId: string) => {
      setSortConfig({
          key: columnId,
          direction: sortConfig.key === columnId && sortConfig.direction === 'asc' 
              ? 'desc' 
              : 'asc'
      });
  };

  const handleDelete = async (garbageReqId: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    try {
        const supabase = await createClient();
        
        // Check if request is already assigned to a vehicle
        const { data: vehicleRequest } = await supabase
            .from('vehicle_request')
            .select('*')
            .eq('garbage_req_id', garbageReqId)
            .single();

        if (vehicleRequest) {
            throw new Error('Cannot delete: This request is already assigned to a vehicle');
        }

        const { error: deleteError } = await supabase
            .from('factory_garbage_request')
            .delete()
            .eq('garbage_req_id', garbageReqId);

        if (deleteError) throw deleteError;

        fetchData();
    } catch (err: any) {
        setError(err.message);
    }
};

  // Filter data based on search term
  const filteredData = data.filter(item => 
      Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4 p-4">
    {/* Form Section */}
    <div className="mb-6">
        <Button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="mb-4"
        >
            {isFormOpen ? 'Cancel' : 'Create New Request'}
        </Button>

        {isFormOpen && (
            <CreateRequestForm
                onRequestCreated={() => {
                    setIsFormOpen(false);
                    fetchData(); // Refresh table data
                }}
                onCancel={() => setIsFormOpen(false)}
            />
        )}
    </div>







      <div className="space-y-4 p-4">
          {/* Column Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Select Columns:</h3>
              <div className="flex flex-wrap gap-4">
                  {columnOptions.map((column) => (
                      <label key={column.id} className="flex items-center space-x-2">
                          <Checkbox
                              checked={selectedColumns.includes(column.id)}
                              onCheckedChange={() => toggleColumn(column.id)}
                              disabled={column.required}
                          />
                          <span>{column.label}</span>
                      </label>
                  ))}
              </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
              <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  //prefix={<Search className="w-4 h-4" />}
              />
          </div>

          {/* Error Message */}
          {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded">
                  Error: {error}
              </div>
          )}

          {/* Table */}
          <Table>
              <TableCaption>Garbage Request Information</TableCaption>
              <TableHeader>
                  <TableRow>
                      {columnOptions
                          .filter(col => selectedColumns.includes(col.id))
                          .map(column => (
                              <TableHead key={column.id}>
                                  <div className="flex items-center space-x-2">
                                      <span>{column.label}</span>
                                      {column.sortable && (
                                          <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleSort(column.id)}
                                          >
                                              <ArrowUpDown className="h-4 w-4" />
                                          </Button>
                                      )}
                                  </div>
                              </TableHead>
                          ))}
                  </TableRow>
              </TableHeader>
              <TableBody>
    {loading ? (
        <TableRow>
            <TableCell colSpan={selectedColumns.length} className="text-center">
                <Loader2 className="h-6 w-6 animate-spin inline" />
                <span className="ml-2">Loading...</span>
            </TableCell>
        </TableRow>
    ) : paginatedData.length === 0 ? (
        <TableRow>
            <TableCell colSpan={selectedColumns.length} className="text-center">
                No data found
            </TableCell>
        </TableRow>
    ) : (
        paginatedData.map((row, index) => (
            <TableRow key={index}>
                {columnOptions
                    .filter(col => selectedColumns.includes(col.id))
                    .map(column => (
                        <TableCell key={column.id}>
                            {column.id === 'actions' ? (
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingRequest(row)}
                                        disabled={!row.garbage_req_status} // Disable edit for completed requests
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(row.garbage_req_id)}
                                        disabled={!row.garbage_req_status} // Disable delete for completed requests
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : column.id === 'factory_name' 
                                ? row.factory?.factory_name 
                                : column.id === 'factory_location'
                                ? row.factory?.factory_location
                                : column.id === 'garbage_quantity'
                                ? `${row[column.id]} tons`
                                : column.id === 'remaining_garbage'
                                ? `${row[column.id]} tons`
                                : column.id === 'garbage_req_status'
                                ? (
                                    <span className={`px-2 py-1 rounded-full text-sm ${
                                        row[column.id] 
                                            ? 'bg-yellow-100 text-yellow-800' // Pending style
                                            : 'bg-green-100 text-green-800'   // Completed style
                                    }`}>
                                        {row[column.id] ? 'Pending' : 'Completed'}
                                    </span>
                                )
                                : row[column.id]}
                        </TableCell>

                    ))}
            </TableRow>
        ))
    )}
          </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center">
              <div>
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} entries
              </div>
              <div className="flex gap-2">
                  <Button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                  >
                      Previous
                  </Button>
                  <Button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                  >
                      Next
                  </Button>
              </div>
          </div>
      </div>
      {editingRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">Edit Garbage Request</h2>
                    </div>
                    <EditGarbageRequestForm
                        request={editingRequest}
                        onRequestUpdated={() => {
                            setEditingRequest(null);
                            fetchData();
                        }}
                        onCancel={() => setEditingRequest(null)}
                    />
                </div>
            </div>
        )}
      </div>
  );
}


