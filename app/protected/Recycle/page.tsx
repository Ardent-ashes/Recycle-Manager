'use client';
import { createClient } from "@/utils/supabase/client";
import { Loader2, ArrowUpDown } from "lucide-react";
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

// Define column structure
const columnDefinitions = [
    { id: 'recycle_process_id', label: 'Process ID', required: true, sortable: true },
    { id: 'plant_id', label: 'Plant ID', sortable: true },
    { id: 'vehicle_req_id', label: 'Vehicle Request ID', sortable: true },
    { id: 'garbage_req_id', label: 'Garbage Request ID', sortable: true },
    { id: 'plant_name', label: 'Plant Name', sortable: true },
    { id: 'plant_location', label: 'Plant Location', sortable: true },
    { id: 'vehicle_id', label: 'Vehicle ID', sortable: true },
    { id: 'total_capacity', label: 'Total Capacity', sortable: true },
    { id: 'remaining_capacity', label: 'Remaining Capacity', sortable: true },
    //{ id: 'processed_garbage_quantity', label: 'Processed Quantity', sortable: true },
    { id: 'garbage_type', label: 'Garbage Type', sortable: true },
    { id: 'factory_location', label: 'Factory Location', sortable: true },
    { id: 'plant_process_status', label: 'Process Status', sortable: true },
    { id: 'process_date', label: 'Process Date', sortable: true },
    { id: 'actions', label: 'Actions', required: true, sortable: false } ,// New Actions Column
    { id: 'garbage_quantity', label: 'Garbage Quantity', sortable: true }, // New Garbage Quantity Column

];

const ITEMS_PER_PAGE = 10;

// ActionButtons Component
function ActionButtons({ status, processId, onStatusChange }) {
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    const toggleStatus = async () => {
        setUpdating(true);
        setError(null);
        const newStatus = !status;

        try {
            await onStatusChange(processId, newStatus);
        } catch (err) {
            setError(err.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <Button 
                size="sm" 
                onClick={toggleStatus} 
                disabled={updating}
                variant={status ? 'success' : 'secondary'}
            >
                {updating ? 'Updating...' : status ? 'Complete' : 'In Process'}
            </Button>
            {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
    );
}

export default function RecycleProcessTable() {
    // States
    const [selectedColumns, setSelectedColumns] = useState([
        'recycle_process_id',
        'plant_id',
        'plant_name',
        'plant_location',
         //'processed_garbage_quantity',
         'garbage_quantity',
        'garbage_type',
        'plant_process_status',
        'actions' // Ensure 'actions' is always selected
    ]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'recycle_process_id',
        direction: 'asc'
    });

    // Load saved column preferences and ensure 'actions' is included
    useEffect(() => {
        const savedColumns = localStorage.getItem('recycleProcessColumns');
        if (savedColumns) {
            const parsed = JSON.parse(savedColumns);
            if (!parsed.includes('recycle_process_id')) {
                parsed.push('recycle_process_id');
            }
            if (!parsed.includes('actions')) {
                parsed.push('actions');
            }
            setSelectedColumns(parsed);
        } else {
            // Save default columns if none are saved
            localStorage.setItem('recycleProcessColumns', JSON.stringify(selectedColumns));
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: recycleProcesses, error: recycleError } = await supabase
                .from('recycle_process')
                .select(`
                    *,
                    recycle_plant:plant_id (
                        plant_name,
                        plant_location,
                        plant_total_capacity,
                        plant_remaining_capacity
                    ),
                    vehicle_request:vehicle_req_id (
                        vehicle_id,
                        garbage_req_id,
                        garbage_request:garbage_req_id (
                            garbage_type,
                            garbage_quantity,
                            factory:factory_id (
                                factory_location
                            )
                        )
                    )
                `);
                // Removed .order() for client-side sorting

            if (recycleError) throw recycleError;

            const transformedData = recycleProcesses.map(process => ({
                recycle_process_id: process.recycle_process_id,
                plant_id: process.plant_id,
                vehicle_req_id: process.vehicle_req_id,
                garbage_req_id: process.vehicle_request?.garbage_req_id,
                plant_name: process.recycle_plant?.plant_name || '',
                plant_location: process.recycle_plant?.plant_location || '',
                vehicle_id: process.vehicle_request?.vehicle_id || '',
                total_capacity: process.recycle_plant?.plant_total_capacity || 0,
                remaining_capacity: process.recycle_plant?.plant_remaining_capacity || 0,
                //processed_garbage_quantity: process.processed_garbage_quantity || 0,
                garbage_quantity: process.vehicle_request?.garbage_request?.garbage_quantity || 0, // New Garbage Quantity

                garbage_type: process.vehicle_request?.garbage_request?.garbage_type || '',
                factory_location: process.vehicle_request?.garbage_request?.factory?.factory_location || '',
                plant_process_status: process.plant_process_status,
                process_date: process.process_date
            }));

            // Client-side sorting
            let sortedData = transformedData;
            if (sortConfig.key) {
                sortedData = [...transformedData].sort((a, b) => {
                    const aValue = a[sortConfig.key];
                    const bValue = b[sortConfig.key];

                    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            setData(sortedData);
            setError(null);
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [sortConfig]);

    const toggleColumn = (columnId) => {
        // Prevent toggling of required columns
        if (columnId === 'recycle_process_id' || columnId === 'actions') return;
        
        const newSelection = selectedColumns.includes(columnId)
            ? selectedColumns.filter(id => id !== columnId)
            : [...selectedColumns, columnId];
        
        setSelectedColumns(newSelection);
        localStorage.setItem('recycleProcessColumns', JSON.stringify(newSelection));
    };

    const handleSort = (columnId) => {
        setSortConfig({
            key: columnId,
            direction: sortConfig.key === columnId && sortConfig.direction === 'asc' 
                ? 'desc' 
                : 'asc'
        });
    };

    // Handle status change from ActionButtons
    const handleStatusChange = async (processId, newStatus) => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('recycle_process')
                .update({ plant_process_status: newStatus })
                .eq('recycle_process_id', processId);

            if (error) throw error;

            // Update local state
            setData(prevData => prevData.map(item => 
                item.recycle_process_id === processId 
                    ? { ...item, plant_process_status: newStatus } 
                    : item
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            throw err; // Let the ActionButtons component handle the error display
        }
    };

    // Debounced Search
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    // Filter data based on debounced search term
    const filteredData = data.filter(item => 
        Object.values(item).some(value => 
            String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
    );

    // Pagination
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Get visible columns in correct order
    const visibleColumns = columnDefinitions.filter(col => 
        selectedColumns.includes(col.id)
    );

    return (
        <div className="space-y-4 p-4">
            {/* Column Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Select Columns:</h3>
                <div className="flex flex-wrap gap-4">
                    {columnDefinitions.map((column) => (
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
                <div className="bg-red-100 text-red-700 p-3 rounded">
                    Error: {error}
                </div>
            )}

            {/* Table */}
            <Table>
                <TableCaption>Recycle Process Information</TableCaption>
                <TableHeader>
                    <TableRow>
                        {visibleColumns.map(column => (
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
                            <TableCell colSpan={visibleColumns.length} className="text-center">
                                <Loader2 className="h-6 w-6 animate-spin inline" />
                                <span className="ml-2">Loading...</span>
                            </TableCell>
                        </TableRow>
                    ) : paginatedData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={visibleColumns.length} className="text-center">
                                No data found
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedData.map((row) => (
                            <TableRow key={row.recycle_process_id}>
                                {visibleColumns.map(column => (
                                    <TableCell key={column.id}>
                                        {column.id === 'actions' ? (
                                            <ActionButtons 
                                                status={row.plant_process_status}
                                                processId={row.recycle_process_id}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ) : column.id === 'plant_process_status' ? (
                                            <span className={`px-2 py-1 rounded-full text-sm ${
                                                row[column.id] 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {row[column.id] ? 'In Process' : 'Completed'}
                                            </span>
                                        ) : column.id.includes('capacity') || column.id.includes('quantity') ? (
                                            `${row[column.id]} tons`
                                        ) : column.id === 'process_date' ? (
                                            row[column.id] ? new Date(row[column.id]).toLocaleDateString() : ''
                                        ) : (
                                            row[column.id] || ''
                                        )}
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
    );
}
