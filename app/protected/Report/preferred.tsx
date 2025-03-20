// components/PlantProcessingComparison.tsx
'use client';

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Dynamically import the chart components with ssr disabled
const Charts = dynamic(
    () => import('./ProcessingCharts'),
    { ssr: false }
);

export default function PlantProcessingComparison() {
    const [mounted, setMounted] = useState(false);
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
    const [processedData, setProcessedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // plantProcessingComparison.tsx
    // Update the fetchData function:
const fetchData = async () => {
    if (!dateRange.from || !dateRange.to) {
        setError('Please select a date range');
        return;
    }

    setLoading(true);
    setError(null);

    try {
        const supabase = createClient();

        // Updated query to use amount_of_garbage from vehicle_request
        const { data, error } = await supabase
            .from('recycle_process')
            .select(`
                recycle_process_id,
                plant_process_status,
                process_date,
                recycle_plant (
                    plant_id,
                    plant_name
                ),
                vehicle_request (
                    vehicle_req_id,
                    amount_of_garbage
                )
            `)
            .gte('process_date', dateRange.from.toISOString())
            .lte('process_date', dateRange.to.toISOString());

        if (error) throw error;

        console.log("Fetched Data from Supabase:", data); // Debugging

        const plantTotals = {};

        // Process each record using amount_of_garbage
        data.forEach(record => {
            const plantName = record.recycle_plant.plant_name;
            
            // Get amount_of_garbage directly from vehicle_request
            const garbageAmount = record.vehicle_request?.amount_of_garbage
                ? parseFloat(record.vehicle_request.amount_of_garbage)
                : 0;

            const isCompleted = record.plant_process_status === 'Completed' || record.plant_process_status === true;

            if (!plantTotals[plantName]) {
                plantTotals[plantName] = {
                    plantName,
                    completedQuantity: 0,
                    pendingQuantity: 0,
                    completedProcesses: 0,
                    pendingProcesses: 0
                };
            }

            if (isCompleted) {
                plantTotals[plantName].completedQuantity += garbageAmount;
                plantTotals[plantName].completedProcesses += 1;
            } else {
                plantTotals[plantName].pendingQuantity += garbageAmount;
                plantTotals[plantName].pendingProcesses += 1;
            }
        });

        // Calculate total completed and pending
        const processedData = {
            plantTotals: Object.values(plantTotals),
            totalCompleted: Object.values(plantTotals).reduce((sum, plant) => sum + plant.completedQuantity, 0),
            totalPending: Object.values(plantTotals).reduce((sum, plant) => sum + plant.pendingQuantity, 0)
        };

        setProcessedData(processedData);

    } catch (err) {
        console.error('Error:', err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
};
    
    

    if (!mounted) return null;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Plant Processing Comparison</CardTitle>
                <CardDescription>
                    Compare processing volumes across recycling plants
                </CardDescription>
            </CardHeader>

            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <h3 className="font-medium mb-2 text-sm">Date Range</h3>
                        <DatePickerWithRange 
                            date={dateRange}
                            setDate={setDateRange}
                        />
                    </div>

                    <div className="flex items-end">
                        <Button 
                            onClick={fetchData}
                            className="w-full"
                            disabled={loading || !dateRange.from || !dateRange.to}
                        >
                            {loading ? 'Loading...' : 'Generate Report'}
                        </Button>
                    </div>
                </div>

                {processedData && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Completed
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {processedData.totalCompleted.toFixed(2)} tons
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Pending
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {processedData.totalPending.toFixed(2)} tons
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Charts data={processedData.plantTotals} />

                        <Card>
                            <CardHeader>
                                <CardTitle>Processing Details by Plant</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Plant Name</TableHead>
                                            <TableHead className="text-right">Completed (tons)</TableHead>
                                            <TableHead className="text-right">Pending (tons)</TableHead>
                                            <TableHead className="text-right">Completed Processes</TableHead>
                                            <TableHead className="text-right">Pending Processes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processedData.plantTotals.map((plant, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{plant.plantName}</TableCell>
                                                <TableCell className="text-right">
                                                    {plant.completedQuantity.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {plant.pendingQuantity.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {plant.completedProcesses}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {plant.pendingProcesses}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}