// financialReports.tsx
'use client';
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF99CC'];

export default function FinancialReports() {
    const [isExpanded, setIsExpanded] = useState(true);
    const [reportType, setReportType] = useState('revenue');
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const reportTypes = [
        { 
            id: 'revenue', 
            label: 'Revenue Report',
            description: 'Total revenue generated from recycling by plant and region'
        },
        { 
            id: 'cost', 
            label: 'Cost Analysis Report',
            description: 'Detailed breakdown of collection and transportation costs'
        },
        { 
            id: 'profit', 
            label: 'Profit/Loss Report',
            description: 'Comprehensive profit/loss analysis'
        },
        { 
            id: 'vehicle', 
            label: 'Vehicle Operation Cost Report',
            description: 'Fuel and maintenance costs per vehicle'
        }
    ];

    const fetchReportData = async () => {
        if (!dateRange.from || !dateRange.to) {
            setError('Please select a date range');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            switch (reportType) {
                case 'revenue': {
                    // Fetch revenue data with actual processed amounts
                    const { data, error } = await supabase
                        .from('recycle_process')
                        .select(`
                            recycle_process_id,
                            process_date,
                            recycle_plant:plant_id (
                                plant_name,
                                plant_location,
                                revenue_per_unit
                            ),
                            vehicle_request:vehicle_req_id (
                                amount_of_garbage
                            )
                        `)
                        .gte('process_date', dateRange.from.toISOString())
                        .lte('process_date', dateRange.to.toISOString());
                
                    if (error) throw error;
                
                    const revenueByPlant = data.reduce((acc, process) => {
                        const plantName = process.recycle_plant.plant_name;
                        const processedAmount = process.vehicle_request.amount_of_garbage;
                        const revenuePerUnit = process.recycle_plant.revenue_per_unit;
                        const revenue = processedAmount * revenuePerUnit;
                
                        if (!acc[plantName]) {
                            acc[plantName] = {
                                plantName,
                                location: process.recycle_plant.plant_location,
                                totalProcessedAmount: 0,
                                totalRevenue: 0,
                                processCount: 0,
                                averageRevenuePerTon: 0
                            };
                        }
                
                        acc[plantName].totalProcessedAmount += processedAmount;
                        acc[plantName].totalRevenue += revenue;
                        acc[plantName].processCount += 1;
                        acc[plantName].averageRevenuePerTon = acc[plantName].totalRevenue / acc[plantName].totalProcessedAmount;
                
                        return acc;
                    }, {});
                
                    setReportData({
                        summary: {
                            totalRevenueInBdt: Object.values(revenueByPlant).reduce(
                                (sum, plant) => sum + plant.totalRevenue, 0
                            ),
                            totalProcessedAmount: Object.values(revenueByPlant).reduce(
                                (sum, plant) => sum + plant.totalProcessedAmount, 0
                            ),
                            totalProcesses: Object.values(revenueByPlant).reduce(
                                (sum, plant) => sum + plant.processCount, 0
                            ),
                            averageRevenuePerTonInBdt: Object.values(revenueByPlant).reduce(
                                (sum, plant) => sum + plant.totalRevenue, 0
                            ) / Object.values(revenueByPlant).reduce(
                                (sum, plant) => sum + plant.totalProcessedAmount, 0
                            )
                        },
                        details: Object.values(revenueByPlant)
                    });
                    break;
                }

                case 'cost': {
                    // Fetch transportation and collection costs with location data
                    const { data, error } = await supabase
                        .from('vehicle_request')
                        .select(`
                            vehicle_req_id,
                            vehicle_request_date,
                            amount_of_garbage,
                            vehicle:vehicle_id (
                                vehicle_type,
                                cost_per_km
                            ),
                            factory_garbage_request:garbage_req_id (
                                factory:factory_id (
                                    factory_name,
                                    factory_location,
                                    factory_latitude,
                                    factory_longitude
                                )
                            ),
                            recycle_process!vehicle_req_id (
                                recycle_plant:plant_id (
                                    plant_name,
                                    plant_location,
                                    plant_latitude,
                                    plant_longitude
                                )
                            )
                        `)
                        .gte('vehicle_request_date', dateRange.from.toISOString())
                        .lte('vehicle_request_date', dateRange.to.toISOString());
                
                    if (error) throw error;
                
                    console.log("Fetched Data:", data); // For debugging
                
                    // Helper function to calculate distance using Haversine formula
                    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
                        
                        const R = 6371; // Earth's radius in kilometers
                        const dLat = (lat2 - lat1) * Math.PI / 180;
                        const dLon = (lon2 - lon1) * Math.PI / 180;
                        const a = 
                            Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                            Math.sin(dLon/2) * Math.sin(dLon/2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                        return R * c; // Distance in kilometers
                    };
                
                    // Calculate costs with actual distances
                    const costsByFactory = data.reduce((acc, request) => {
                        // Skip if essential data is missing
                        if (!request.factory_garbage_request?.factory || !request.recycle_process?.[0]?.recycle_plant) {
                            console.warn("Missing location data for request:", request.vehicle_req_id);
                            return acc;
                        }
                
                        const factory = request.factory_garbage_request.factory;
                        const plant = request.recycle_process[0].recycle_plant;
                        const factoryName = factory.factory_name;
                        const quantity = request.amount_of_garbage || 0;
                        const costPerKm = request.vehicle.cost_per_km || 0;
                        
                        // Calculate actual distance
                        const distance = calculateDistance(
                            parseFloat(factory.factory_latitude),
                            parseFloat(factory.factory_longitude),
                            parseFloat(plant.plant_latitude),
                            parseFloat(plant.plant_longitude)
                        );
                
                        // Calculate round trip distance (multiply by 2)
                        const roundTripDistance = distance * 2;
                        const transportCost = roundTripDistance * costPerKm;
                
                        if (!acc[factoryName]) {
                            acc[factoryName] = {
                                factoryName,
                                location: factory.factory_location,
                                totalQuantity: 0,
                                totalDistance: 0,
                                transportationCost: 0,
                                tripCount: 0,
                                averageDistance: 0,
                                // costPerKm: costPerKm,
                               
                            };
                        }
                
                        acc[factoryName].totalQuantity += quantity;
                        acc[factoryName].totalDistance += roundTripDistance;
                        acc[factoryName].transportationCost += transportCost;
                        acc[factoryName].tripCount += 1;
                        acc[factoryName].averageDistance = acc[factoryName].totalDistance / acc[factoryName].tripCount;
                
                        return acc;
                    }, {});
                
                    setReportData({
                        summary: {
                            totalCostBdt: Object.values(costsByFactory).reduce(
                                (sum, factory) => sum + factory.transportationCost, 0
                            ),
                            totalDistanceInKm: Object.values(costsByFactory).reduce(
                                (sum, factory) => sum + factory.totalDistance, 0
                            ),
                            totalTrips: Object.values(costsByFactory).reduce(
                                (sum, factory) => sum + factory.tripCount, 0
                            ),
                            averageCostPerKmInBdt: (Object.values(costsByFactory).reduce(
                                (sum, factory) => sum + factory.transportationCost, 0
                            ) / Object.values(costsByFactory).reduce(
                                (sum, factory) => sum + factory.totalDistance, 0
                            )) || 0
                        },
                        details: Object.values(costsByFactory)
                    });
                    break;
                }
                case 'profit': {
                    // Fetch both revenue and cost data
                    const [revenueData, costData] = await Promise.all([
                        supabase
                            .from('recycle_process')
                            .select(`
                                recycle_process_id,
                                process_date,
                                recycle_plant:plant_id (
                                    plant_name,
                                    plant_location,
                                    revenue_per_unit,
                                    plant_latitude,
                                    plant_longitude
                                ),
                                vehicle_request:vehicle_req_id (
                                    amount_of_garbage,
                                    vehicle:vehicle_id (
                                        vehicle_type,
                                        cost_per_km
                                    ),
                                    factory_garbage_request:garbage_req_id (
                                        factory:factory_id (
                                            factory_name,
                                            factory_location,
                                            factory_latitude,
                                            factory_longitude
                                        )
                                    )
                                )
                            `)
                            .gte('process_date', dateRange.from.toISOString())
                            .lte('process_date', dateRange.to.toISOString())
                    ]);
                
                    if (revenueData.error) throw revenueData.error;
                
                    // Helper function to calculate distance
                    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
                        
                        const R = 6371; // Earth's radius in kilometers
                        const dLat = (lat2 - lat1) * Math.PI / 180;
                        const dLon = (lon2 - lon1) * Math.PI / 180;
                        const a = 
                            Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                            Math.sin(dLon/2) * Math.sin(dLon/2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                        return R * c; // Distance in kilometers
                    };
                
                    // Process data by plant
                    const profitByPlant = revenueData.data.reduce((acc, process) => {
                        const plantName = process.recycle_plant.plant_name;
                        const quantity = process.vehicle_request.amount_of_garbage || 0;
                        const revenuePerUnit = process.recycle_plant.revenue_per_unit || 0;
                        const costPerKm = process.vehicle_request.vehicle.cost_per_km || 0;
                
                        // Calculate distance
                        const distance = calculateDistance(
                            parseFloat(process.vehicle_request.factory_garbage_request.factory.factory_latitude),
                            parseFloat(process.vehicle_request.factory_garbage_request.factory.factory_longitude),
                            parseFloat(process.recycle_plant.plant_latitude),
                            parseFloat(process.recycle_plant.plant_longitude)
                        );
                
                        // Calculate round trip distance and transportation cost
                        const roundTripDistance = distance * 2;
                        const transportCost = roundTripDistance * costPerKm;
                        const revenue = quantity * revenuePerUnit;
                
                        if (!acc[plantName]) {
                            acc[plantName] = {
                                plantName,
                                location: process.recycle_plant.plant_location,
                                totalRevenue: 0,
                                totalCost: 0,
                                totalQuantity: 0,
                                totalDistance: 0,
                                processCount: 0,
                                netProfit: 0,
                                profitMargin: 0
                            };
                        }
                
                        acc[plantName].totalRevenue += revenue;
                        acc[plantName].totalCost += transportCost;
                        acc[plantName].totalQuantity += quantity;
                        acc[plantName].totalDistance += roundTripDistance;
                        acc[plantName].processCount += 1;
                        acc[plantName].netProfit = acc[plantName].totalRevenue - acc[plantName].totalCost;
                        acc[plantName].profitMargin = (acc[plantName].netProfit / acc[plantName].totalRevenue * 100) || 0;
                
                        return acc;
                    }, {});
                
                    // Calculate totals
                    const totalRevenue = Object.values(profitByPlant).reduce((sum, plant) => sum + plant.totalRevenue, 0);
                    const totalCost = Object.values(profitByPlant).reduce((sum, plant) => sum + plant.totalCost, 0);
                    const netProfit = totalRevenue - totalCost;
                
                    setReportData({
                        summary: {
                            totalRevenue,
                            totalCost,
                            netProfit,
                            profitMargin: ((netProfit / totalRevenue) * 100).toFixed(2),
                            totalProcesses: Object.values(profitByPlant).reduce((sum, plant) => sum + plant.processCount, 0),
                            totalQuantity: Object.values(profitByPlant).reduce((sum, plant) => sum + plant.totalQuantity, 0),
                            totalDistance: Object.values(profitByPlant).reduce((sum, plant) => sum + plant.totalDistance, 0)
                        },
                        details: Object.values(profitByPlant).map(plant => ({
                            ...plant,
                            profitMargin: plant.profitMargin.toFixed(2),
                            revenuePerTon: (plant.totalRevenue / plant.totalQuantity).toFixed(2),
                            costPerTon: (plant.totalCost / plant.totalQuantity).toFixed(2),
                            profitPerTon: (plant.netProfit / plant.totalQuantity).toFixed(2)
                        }))
                    });
                
                    // Add detailed breakdown for charts
                    setReportData(prev => ({
                        ...prev,
                        chartData: [
                            { category: 'Revenue', amount: totalRevenue },
                            { category: 'Transportation Cost', amount: totalCost },
                            { category: 'Net Profit', amount: netProfit }
                        ],
                        plantComparison: Object.values(profitByPlant).map(plant => ({
                            name: plant.plantName,
                            revenue: plant.totalRevenue,
                            cost: plant.totalCost,
                            profit: plant.netProfit,
                            margin: parseFloat(plant.profitMargin)
                        }))
                    }));
                    break;
                }

                case 'vehicle': {
                    // Fetch vehicle operational costs with location data
                    const { data, error } = await supabase
                        .from('vehicle_request')
                        .select(`
                            vehicle_req_id,
                            vehicle_request_date,
                            amount_of_garbage,
                            vehicle:vehicle_id (
                                vehicle_id,
                                vehicle_type,
                                cost_per_km,
                                vehicle_capacity
                            ),
                            factory_garbage_request:garbage_req_id (
                                factory:factory_id (
                                    factory_name,
                                    factory_latitude,
                                    factory_longitude
                                )
                            ),
                            recycle_process!vehicle_req_id (
                                recycle_plant:plant_id (
                                    plant_name,
                                    plant_latitude,
                                    plant_longitude
                                )
                            )
                        `)
                        .gte('vehicle_request_date', dateRange.from.toISOString())
                        .lte('vehicle_request_date', dateRange.to.toISOString());
                
                    if (error) throw error;
                
                    // Helper function to calculate distance
                    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
                        
                        const R = 6371; // Earth's radius in kilometers
                        const dLat = (lat2 - lat1) * Math.PI / 180;
                        const dLon = (lon2 - lon1) * Math.PI / 180;
                        const a = 
                            Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                            Math.sin(dLon/2) * Math.sin(dLon/2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                        return R * c; // Distance in kilometers
                    };
                
                    // Calculate vehicle-wise costs with actual distances
                    const vehicleCosts = data.reduce((acc, request) => {
                        // Skip if missing essential data
                        if (!request.factory_garbage_request?.factory || !request.recycle_process?.[0]?.recycle_plant) {
                            console.warn("Missing location data for request:", request.vehicle_req_id);
                            return acc;
                        }
                
                        const vehicleId = request.vehicle.vehicle_id;
                        const costPerKm = request.vehicle.cost_per_km;
                        
                        // Calculate actual distance
                        const distance = calculateDistance(
                            parseFloat(request.factory_garbage_request.factory.factory_latitude),
                            parseFloat(request.factory_garbage_request.factory.factory_longitude),
                            parseFloat(request.recycle_process[0].recycle_plant.plant_latitude),
                            parseFloat(request.recycle_process[0].recycle_plant.plant_longitude)
                        );
                
                        // Calculate round trip distance and costs
                        const roundTripDistance = distance * 2;
                        const tripCost = roundTripDistance * costPerKm;
                        const garbageAmount = request.amount_of_garbage || 0;
                
                        if (!acc[vehicleId]) {
                            acc[vehicleId] = {
                                vehicleId,
                                vehicleType: request.vehicle.vehicle_type,
                                capacity: request.vehicle.vehicle_capacity,
                                costPerKm: request.vehicle.cost_per_km,
                                totalTrips: 0,
                                totalDistance: 0,
                                totalCost: 0,
                                totalGarbageCollected: 0,
                                averageLoadPerTrip: 0,
                                costPerTon: 0,
                                utilizationRate: 0
                            };
                        }
                
                        acc[vehicleId].totalTrips += 1;
                        acc[vehicleId].totalDistance += roundTripDistance;
                        acc[vehicleId].totalCost += tripCost;
                        acc[vehicleId].totalGarbageCollected += garbageAmount;
                
                        // Calculate averages and rates
                        acc[vehicleId].averageLoadPerTrip = acc[vehicleId].totalGarbageCollected / acc[vehicleId].totalTrips;
                        acc[vehicleId].costPerTon = acc[vehicleId].totalCost / acc[vehicleId].totalGarbageCollected;
                        acc[vehicleId].utilizationRate = (acc[vehicleId].averageLoadPerTrip / acc[vehicleId].capacity) * 100;
                
                        return acc;
                    }, {});
                
                    // Calculate fleet-wide statistics
                    const fleetStats = Object.values(vehicleCosts).reduce((stats, vehicle) => {
                        stats.totalDistance += vehicle.totalDistance;
                        stats.totalCost += vehicle.totalCost;
                        stats.totalGarbageCollected += vehicle.totalGarbageCollected;
                        stats.totalTrips += vehicle.totalTrips;
                        return stats;
                    }, {
                        totalDistance: 0,
                        totalCost: 0,
                        totalGarbageCollected: 0,
                        totalTrips: 0
                    });
                
                    setReportData({
                        summary: {
                            totalVehicles: Object.keys(vehicleCosts).length,
                            totalTrips: fleetStats.totalTrips,
                            totalDistanceInKm: fleetStats.totalDistance.toFixed(2),
                            totalCostInBdt: fleetStats.totalCost.toFixed(2),
                            averageCostPerKmInBdt: (fleetStats.totalCost / fleetStats.totalDistance).toFixed(2),
                            averageCostPerTonInBdt: (fleetStats.totalCost / fleetStats.totalGarbageCollected).toFixed(2),
                            totalGarbageCollected: fleetStats.totalGarbageCollected.toFixed(2)
                        },
                        details: Object.values(vehicleCosts).map(vehicle => ({
                            ...vehicle,
                            totalDistance: vehicle.totalDistance.toFixed(2),
                            totalCost: vehicle.totalCost.toFixed(2),
                            averageLoadPerTrip: vehicle.averageLoadPerTrip.toFixed(2),
                            costPerTon: vehicle.costPerTon.toFixed(2),
                            utilizationRate: vehicle.utilizationRate.toFixed(2)
                        })),
                        chartData: {
                            costAnalysis: Object.values(vehicleCosts).map(vehicle => ({
                                vehicleId: vehicle.vehicleId,
                                totalCost: vehicle.totalCost,
                                totalDistance: vehicle.totalDistance,
                                costPerKm: vehicle.costPerKm
                            })),
                            utilizationRates: Object.values(vehicleCosts).map(vehicle => ({
                                vehicleId: vehicle.vehicleId,
                                utilizationRate: vehicle.utilizationRate,
                                totalGarbageCollected: vehicle.totalGarbageCollected
                            }))
                        }
                    });
                    break;
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderCharts = () => {
        if (!reportData || !reportData.details || reportData.details.length === 0) return null;

        switch (reportType) {
            case 'revenue':
                return (
                    <>
                        {/* Revenue Distribution Pie Chart */}
                        <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle>Revenue Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-6">
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={reportData.details}
                                            dataKey="totalRevenue"
                                            nameKey="plantName"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={110}
                                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {reportData.details.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `BDT ${value.toFixed(2)}`} />
                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '16px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Quantity vs Revenue Bar Chart 
                       /* <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle>Quantity vs Revenue</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-6">
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={reportData.details} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="plantName" tick={{ fontSize: 12 }} />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ paddingTop: '16px' }} />
                                        <Bar yAxisId="left" dataKey="totalQuantity" fill="#8884d8" name="Quantity (tons)" barSize={40} />
                                        <Bar yAxisId="right" dataKey="totalRevenue" fill="#82ca9d" name="Revenue ($)" barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>*/}
                    </>
                );

            case 'cost':
                return (
                    <>
                        {/* Cost Distribution Pie Chart */}
                        <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle>Transportation Cost Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-6">
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={reportData.details}
                                            dataKey="transportationCost"
                                            nameKey="factoryName"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={110}
                                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {reportData.details.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `BDT ${value.toFixed(2)}`} />
                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '16px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Trip Count vs Cost Bar Chart */}
                        <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle>Trip Count vs Transportation Cost</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-6">
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={reportData.details} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="factoryName" tick={{ fontSize: 12 }} />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ paddingTop: '16px' }} />
                                        <Bar yAxisId="left" dataKey="tripCount" fill="#8884d8" name="Trip Count" barSize={40} />
                                        <Bar yAxisId="right" dataKey="transportationCost" fill="#82ca9d" name="Transportation Cost (BDT)" barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </>
                );

                case 'profit':
                    return (
                        <>
                            {/* Overall Revenue vs Cost vs Profit Bar Chart */}
                            <Card className="w-full">
                                <CardHeader className="pb-4">
                                    <CardTitle>Overall Financial Performance</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2 pb-6">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={reportData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `BDT ${value.toFixed(2)}`} />
                                            <Legend wrapperStyle={{ paddingTop: '16px' }} />
                                            <Bar dataKey="amount" fill={(data) => {
                                                if (data.category === 'Revenue') return '#00C49F';
                                                if (data.category === 'Transportation Cost') return '#FF8042';
                                                return '#0088FE'; // Net Profit
                                            }} barSize={60} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                
                            {/* Plant-wise Profit Analysis */}
                            <Card className="w-full">
                                <CardHeader className="pb-4">
                                    <CardTitle>Plant-wise Profit Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2 pb-6">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart 
                                            data={reportData.plantComparison} 
                                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                            <Tooltip formatter={(value, name) => [
                                                name === 'margin' ? `${value.toFixed(2)}%` : `BDT ${value.toFixed(2)}`,
                                                name
                                            ]} />
                                            <Legend wrapperStyle={{ paddingTop: '16px' }} />
                                            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#00C49F" barSize={30} />
                                            <Bar yAxisId="left" dataKey="cost" name="Cost" fill="#FF8042" barSize={30} />
                                            <Bar yAxisId="left" dataKey="profit" name="Profit" fill="#0088FE" barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                
                            {/* Profit Metrics Dashboard */}
                            <Card className="w-full">
                                <CardHeader className="pb-4">
                                    <CardTitle>Profit Metrics</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2 pb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Profit Margin Gauge */}
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="text-2xl font-bold mb-4">
                                                Overall Profit Margin
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-8">
                                                <div
                                                    className="bg-green-600 h-8 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min(Math.max(parseFloat(reportData.summary.profitMargin), 0), 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="text-3xl font-bold mt-4">
                                                {reportData.summary.profitMargin}%
                                            </div>
                                        </div>
                
                                        {/* Key Metrics */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span>Total Processed Quantity:</span>
                                                <span className="font-bold">{reportData.summary.totalQuantity} tons</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Total Distance:</span>
                                                <span className="font-bold">{reportData.summary.totalDistance} km</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Average Revenue per Ton:</span>
                                                <span className="font-bold">BDT {(reportData.summary.totalRevenue / reportData.summary.totalQuantity).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Average Cost per Ton:</span>
                                                <span className="font-bold">BDT {(reportData.summary.totalCost / reportData.summary.totalQuantity).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    );

                case 'vehicle':
                    return (
                        <>
                            
                
                            {/* Distance and Cost Analysis */}
                            <Card className="w-full">
                                <CardHeader className="pb-4">
                                    <CardTitle>Distance and Cost Analysis by Vehicle</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2 pb-6">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={reportData.details} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="vehicleType" tick={{ fontSize: 12 }} />
                                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                            <Tooltip formatter={(value, name) => [
                                                `${name.includes('Distance') ? value + ' km' : 'BDT' + value}`,
                                                name
                                            ]} />
                                            <Legend wrapperStyle={{ paddingTop: '16px' }} />
                                            <Bar 
                                                yAxisId="left" 
                                                dataKey="totalDistance" 
                                                name="Total Distance (km)" 
                                                fill="#8884d8" 
                                                barSize={40} 
                                            />
                                            <Bar 
                                                yAxisId="right" 
                                                dataKey="totalCost" 
                                                name="Total Cost (BDT)" 
                                                fill="#82ca9d" 
                                                barSize={40} 
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                
                            {/* Vehicle Utilization Chart */}
                            <Card className="w-full">
                                <CardHeader className="pb-4">
                                    <CardTitle>Vehicle Utilization and Efficiency</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2 pb-6">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={reportData.details} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="vehicleType" tick={{ fontSize: 12 }} />
                                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                            <Tooltip formatter={(value, name) => [
                                                `${name.includes('Rate') ? value + '%' : value + ' tons'}`,
                                                name
                                            ]} />
                                            <Legend wrapperStyle={{ paddingTop: '16px' }} />
                                            <Bar 
                                                yAxisId="left" 
                                                dataKey="utilizationRate" 
                                                name="Utilization Rate (%)" 
                                                fill="#8884d8" 
                                                barSize={40} 
                                            />
                                            <Bar 
                                                yAxisId="right" 
                                                dataKey="totalGarbageCollected" 
                                                name="Total Garbage Collected (tons)" 
                                                fill="#82ca9d" 
                                                barSize={40} 
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </>
                    );

            default:
                return null;
        }
    };

   const renderReport = () => {
    if (!reportData) return null;

    return (
        <div className="w-full p-2">
            {/* Summary Cards */}
            {/* Summary Cards */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
    {Object.entries(reportData.summary).map(([key, value]) => (
        <Card key={key} className="w-full">
            <CardHeader className="pb-3 pt-5">
                <CardTitle className="text-sm font-medium">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </CardTitle>
            </CardHeader>
            <CardContent className="py-3">
                <div className="text-2xl font-bold">
                    {key.includes('totalCost') || key.includes('averageCost') ? 
                        `BDT ${Number(value).toFixed(2)}` :
                     key.includes('totalDistance') || key.includes('distance') ? 
                        `${Number(value).toFixed(2)} KM` :
                     key.includes('utilizationRate') || key.includes('margin') ? 
                        `${Number(value).toFixed(2)}%` :
                    key.includes('netProfit') || key.includes('margin') ? 
                        `BDT${Number(value).toFixed(2)}` :
                        key.includes('profitMargin') || key.includes('margin') ? 
                        `${Number(value).toFixed(2)}%` :
                        key.includes('totalQ') || key.includes('margin') ? 
                        `${Number(value).toFixed(2)} tons` :
                    key.includes('totalRevenue') || key.includes('margin') ? 
                        `BDT ${Number(value).toFixed(2)}` :
                     key.includes('totalGarbageCollected') || key.includes('capacity') || key.includes('averageLoad') ? 
                        `${Number(value).toFixed(2)} ton` :
                     
                     value}
                </div>
            </CardContent>
        </Card>
    ))}
</div>

            {/* Main content with table and charts side by side */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left side - Table */}
                <div className="w-full">
                    <Card className="h-full">
                        <CardHeader className="pb-4">
                            <CardTitle>Detailed {reportTypes.find(t => t.id === reportType)?.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[700px] overflow-auto pr-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            {Object.keys(reportData.details[0]).map(header => (
                                                <TableHead key={header} className="font-semibold py-4">
                                                    {header.replace(/([A-Z])/g, ' $1')
                                                        .replace(/^./, str => str.toUpperCase())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
    {reportData.details.map((row, index) => (
        <TableRow key={index} className="hover:bg-muted/20">
            {Object.entries(row).map(([key, value]) => (
                <TableCell key={key} className="py-3">
                    {key === 'totalDistance' ? `${value} KM` :
                     key === 'costPerKm' ? `BDT ${value}` :
                     key === 'totalCost' ? `BDT ${value}` :
                     key === 'costPerTon' ? `BDT ${value}` :
                     key === 'utilizationRate' ? `${value}%` :
                     key === 'capacity' ? `${value} ton` :
                     key === 'averageLoadPerTrip' ? `${value} ton` :
                     key === 'totalGarbageCollected' ? `${value} ton` :
                     key === 'netProfit' ?`BDT ${value}` :
                     key === 'totalQuantity' ?`${value} tons` :
                     key === 'totalRevenue' ?`BDT ${value}` :
                     key === 'profitMargin' ?`${value}%` :
                     key === 'revenuePerTon' ?`${value} BDT` :
                     key === 'profitPerTon' ?`BDT ${value}` :
                     key === 'transportationCost' ?`BDT ${value}` :
                     key === 'totalProcessedAmount' ?`${value} tons` :
                     key === 'averageDistance' ?`${value} Km` :
                     key === 'averageRevenuePerTon' ?`BDT ${value}` :
                     value}
                </TableCell>
            ))}
        </TableRow>
    ))}
</TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                
            </div>
            {/* Right side - Charts */}
                <div className="w-full ">
                    <div className="grid grid-cols-1 gap-8">
                        {renderCharts()}
                    </div>
                </div>
        </div>
    );
};

return (
    <Card className={`w-full transition-all duration-300 ${isExpanded ? 'h-auto' : 'h-[80px]'}`}>
    <CardHeader className={`flex flex-row items-center justify-between ${isExpanded ? 'pb-6' : 'py-4'}`}>
        <div className="flex items-center gap-6 flex-grow">
            <div>
                <CardTitle className={`transition-all ${isExpanded ? 'text-2xl' : 'text-xl'}`}>
                    Financial Reports
                </CardTitle>
                <CardDescription className={`text-sm mt-1 transition-all ${isExpanded ? 'text-base' : 'text-xs'}`}>
                    Generate detailed financial reports and analysis
                </CardDescription>
            </div>
            {!isExpanded && (
                <div className="flex items-center gap-6 border-l pl-6">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Report Type</span>
                        <span className="text-muted-foreground text-sm">
                            {reportType ? reportTypes.find(t => t.id === reportType)?.label : 'Not selected'}
                        </span>
                    </div>
                    {dateRange.from && dateRange.to && (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Date Range</span>
                            <span className="text-muted-foreground text-sm">
                                {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
        <div className="flex items-center gap-4">
            {!isExpanded && reportData && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Report Generated
                </span>
            )}
            <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-muted"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
        </div>
    </CardHeader>
        
        {isExpanded && (
            <CardContent>
                <div>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <h3 className="font-medium mb-2 text-sm">Report Type</h3>
                            <Select
                                value={reportType}
                                onValueChange={setReportType}
                            >
                                <SelectTrigger className="w-full h-11">
                                    <SelectValue placeholder="Select report type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reportTypes.map((type) => (
                                        <SelectItem 
                                            key={type.id} 
                                            value={type.id}
                                        >
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-medium mb-2 text-sm">Date Range</h3>
                            <DatePickerWithRange 
                                date={dateRange}
                                setDate={setDateRange}
                            />
                        </div>

                        <div className="flex items-end ml-auto">
                            <Button 
                                onClick={fetchReportData}
                                className="w-full h-11 max-w-[200px]"
                                disabled={loading || !dateRange.from || !dateRange.to}
                            >
                                {loading ? 'Generating...' : 'Generate Report'}
                            </Button>
                        </div>
                    </div>

                    {/* Report Display */}
                    {reportData && (
                        <div className="mt-12">
                            {renderReport()}
                        </div>
                    )}
                </div>
            </CardContent>
        )}
    </Card>
);
}