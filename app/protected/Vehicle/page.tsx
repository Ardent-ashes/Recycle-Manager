'use client';
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from 'react';
import PendingGarbageRequests from './pendinggarbagereq';

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
    Loader2,
    Trash2 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ColumnOption {
    id: string;
    label: string;
    required?: boolean;
    sortable?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function VehicleRequestTable() {
    // Column definitions
    const columnOptions: ColumnOption[] = [
        { id: 'vehicle_req_id', label: 'Vehicle Request ID', required: true, sortable: true },
        { id: 'garbage_req_id', label: 'Garbage Request ID', sortable: true },
        { id: 'vehicle_id', label: 'Vehicle ID', sortable: true },
        { id: 'vehicle_capacity', label: 'Vehicle Capacity', sortable: true },
        { id: 'amount_of_garbage', label: 'Amount of Garbage', sortable: true }, // Changed this line
        { id: 'factory_id', label: 'Factory ID', sortable: true },
        { id: 'factory_name', label: 'Factory Name', sortable: true },
        { id: 'factory_location', label: 'Factory Location', sortable: true },
        { id: 'garbage_type', label: 'Garbage Type', sortable: true },
        { id: 'vehicle_request_date', label: 'Request Date', sortable: true },
        { id: 'vehicle_req_status', label: 'Vehicle Request Status', sortable: true },
        { id: 'actions', label: 'Actions', required: true, sortable: false },
    ];

    // States
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['vehicle_req_id', 'actions']);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'vehicle_req_id',
        direction: 'asc'
    });

    // Load saved column preferences from localStorage
    useEffect(() => {
        const savedColumns = localStorage.getItem('selectedVehicleColumns');
        if (savedColumns) {
            const parsed = JSON.parse(savedColumns);
            if (!parsed.includes('vehicle_req_id')) {
                parsed.push('vehicle_req_id');
            }
            if (!parsed.includes('actions')) {
                parsed.push('actions');
            }
            setSelectedColumns(parsed);
        }
    }, []);

    const handleDelete = async (vehicleRequestId: string, vehicleId: string, garbageReqId: string) => {
        try {
            const supabase = await createClient();
    
            // Start transaction
            // 1. Delete vehicle request
            const { error: deleteError } = await supabase
                .from('vehicle_request')
                .delete()
                .eq('vehicle_req_id', vehicleRequestId);
    
            if (deleteError) throw deleteError;
    
            // 2. Update vehicle status to true (available)
            const { error: vehicleError } = await supabase
                .from('vehicle')
                .update({ vehicle_status: true })
                .eq('vehicle_id', vehicleId);
    
            if (vehicleError) throw vehicleError;
    
            // 3. Update garbage request status to true (pending)
            const { error: garbageError } = await supabase
                .from('factory_garbage_request')
                .update({ garbage_req_status: true })
                .eq('garbage_req_id', garbageReqId);
    
            if (garbageError) throw garbageError;
    
            // Refresh data
            fetchData();
            setError(null);
        } catch (err: any) {
            setError('Error deleting request: ' + err.message);
        }
    };

    // Fetch data
    useEffect(() => {
        fetchData();
    }, [sortConfig]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const supabase = await createClient();
            let query = supabase
                .from('vehicle_request')
                .select(`
                     vehicle_req_id,
                vehicle_id,
                garbage_req_id,
                vehicle_req_status,
                vehicle_request_date,
                amount_of_garbage,
                vehicle:vehicle_id (
                    vehicle_capacity,
                    vehicle_type
                ),
                factory_garbage_request!garbage_req_id (
                    garbage_type,
                    factory_id,
                    factory:factory_id (
                        factory_name,
                        factory_location
                        )
                    )
                `);

            // Handle sorting
            if (sortConfig.key === 'factory_name') {
                query = query.order('factory_garbage_request.factory.factory_name', { ascending: sortConfig.direction === 'asc' });
            } else if (sortConfig.key === 'factory_location') {
                query = query.order('factory_garbage_request.factory.factory_location', { ascending: sortConfig.direction === 'asc' });
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
        if (columnId === 'vehicle_req_id' || columnId === 'actions') return;
        const newSelection = selectedColumns.includes(columnId)
            ? selectedColumns.filter(id => id !== columnId)
            : [...selectedColumns, columnId];
        
        setSelectedColumns(newSelection);
        localStorage.setItem('selectedVehicleColumns', JSON.stringify(newSelection));
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
        <div className="bg-white shadow">
        <div className="max-w-7xl  px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Routing Management</h1>
          </div>
        </div>
      </div>
             <PendingGarbageRequests />
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
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Table */}
                <Table>
                    <TableCaption>Vehicle Request Information</TableCaption>
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
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this request? This will make the vehicle available and the garbage request pending again.')) {
                                                                handleDelete(row.vehicle_req_id, row.vehicle_id, row.garbage_req_id);
                                                            }
                                                        }}
                                                        disabled={!row.vehicle_req_status}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        {!row.vehicle_req_status ? 'Completed' : 'Delete'}
                                                    </Button>
                                                ) : column.id === 'factory_name' 
                                                    ? row.factory_garbage_request?.factory?.factory_name 
                                                    : column.id === 'factory_location'
                                                    ? row.factory_garbage_request?.factory?.factory_location
                                                    : column.id === 'vehicle_capacity'
                                                    ? `${row.vehicle?.vehicle_capacity} tons`
                                                    : column.id === 'garbage_type'
                                                    ? row.factory_garbage_request?.garbage_type
                                                    : column.id === 'amount_of_garbage'  // Changed this line
                                                    ? `${row.amount_of_garbage} tons` 
                                                    : column.id === 'factory_id'
                                                    ? row.factory_garbage_request?.factory_id
                                                    : column.id === 'vehicle_req_status'
                                                    ? (
                                                        <span className={`px-2 py-1 rounded-full text-sm ${
                                                            row[column.id] 
                                                                ? 'bg-blue-100 text-blue-800'  // On Road
                                                                : 'bg-green-100 text-green-800' // Completed
                                                        }`}>
                                                            {row[column.id] ? 'On the Way' : 'Completed'}
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
           
        </div>
    );
}