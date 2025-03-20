// financialReports.tsx
'use client';
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from 'react';
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
                    // Fetch revenue data
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
                                garbage_request:garbage_req_id (
                                    garbage_type,
                                    garbage_quantity
                                )
                            )
                        `)
                        .gte('process_date', dateRange.from.toISOString())
                        .lte('process_date', dateRange.to.toISOString());

                    if (error) throw error;

                    // Process revenue data
                    const revenueByPlant = data.reduce((acc, process) => {
                        const plantName = process.recycle_plant.plant_name;
                        const quantity = process.vehicle_request.garbage_request.garbage_quantity;
                        const revenuePerUnit = process.recycle_plant.revenue_per_unit;
                        const revenue = quantity * revenuePerUnit;

                        if (!acc[plantName]) {
                            acc[plantName] = {
                                plantName,
                                location: process.recycle_plant.plant_location,
                                totalQuantity: 0,
                                totalRevenue: 0,
                                processCount: 0
                            };
                        }

                        acc[plantName].totalQuantity += quantity;
                        acc[plantName].totalRevenue += revenue;
                        acc[plantName].processCount += 1;

                        return acc;
                    }, {});

                    setReportData({
                        summary: {
                            totalRevenue: Object.values(revenueByPlant).reduce(
                                (sum, plant) => sum + plant.totalRevenue, 0
                            ),
                            totalQuantity: Object.values(revenueByPlant).reduce(
                                (sum, plant) => sum + plant.totalQuantity, 0
                            ),
                            totalProcesses: Object.values(revenueByPlant).reduce(
                                (sum, plant) => sum + plant.processCount, 0
                            )
                        },
                        details: Object.values(revenueByPlant)
                    });
                    break;
                }

                case 'cost': {
                    // Fetch transportation and collection costs
                    const { data, error } = await supabase
                        .from('vehicle_request')
                        .select(`
                            vehicle_req_id,
                            vehicle_request_date,
                            vehicle:vehicle_id (
                                vehicle_type,
                                cost_per_km
                            ),
                            garbage_request:garbage_req_id (
                                garbage_quantity,
                                factory:factory_id (
                                    factory_name,
                                    factory_location
                                )
                            )
                        `)
                        .gte('vehicle_request_date', dateRange.from.toISOString())
                        .lte('vehicle_request_date', dateRange.to.toISOString());

                    if (error) throw error;

                    // Calculate costs
                    const costsByFactory = data.reduce((acc, request) => {
                        const factoryName = request.garbage_request.factory.factory_name;
                        const quantity = request.garbage_request.garbage_quantity;
                        const costPerKm = request.vehicle.cost_per_km;
                        // Assuming average distance or fetch actual distance
                        const estimatedDistance = 50; // km
                        const transportCost = estimatedDistance * costPerKm;

                        if (!acc[factoryName]) {
                            acc[factoryName] = {
                                factoryName,
                                location: request.garbage_request.factory.factory_location,
                                totalQuantity: 0,
                                transportationCost: 0,
                                tripCount: 0
                            };
                        }

                        acc[factoryName].totalQuantity += quantity;
                        acc[factoryName].transportationCost += transportCost;
                        acc[factoryName].tripCount += 1;

                        return acc;
                    }, {});

                    setReportData({
                        summary: {
                            totalCost: Object.values(costsByFactory).reduce(
                                (sum, factory) => sum + factory.transportationCost, 0
                            ),
                            totalTrips: Object.values(costsByFactory).reduce(
                                (sum, factory) => sum + factory.tripCount, 0
                            ),
                            totalQuantity: Object.values(costsByFactory).reduce(
                                (sum, factory) => sum + factory.totalQuantity, 0
                            )
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
                                    revenue_per_unit
                                ),
                                vehicle_request:vehicle_req_id (
                                    garbage_request:garbage_req_id (
                                        garbage_quantity
                                    )
                                )
                            `)
                            .gte('process_date', dateRange.from.toISOString())
                            .lte('process_date', dateRange.to.toISOString()),
                        
                        supabase
                            .from('vehicle_request')
                            .select(`
                                vehicle_req_id,
                                vehicle:vehicle_id (
                                    cost_per_km
                                )
                            `)
                            .gte('vehicle_request_date', dateRange.from.toISOString())
                            .lte('vehicle_request_date', dateRange.to.toISOString())
                    ]);

                    if (revenueData.error) throw revenueData.error;
                    if (costData.error) throw costData.error;

                    // Calculate total revenue and costs
                    const totalRevenue = revenueData.data.reduce((sum, process) => {
                        const quantity = process.vehicle_request.garbage_request.garbage_quantity;
                        const revenuePerUnit = process.recycle_plant.revenue_per_unit;
                        return sum + (quantity * revenuePerUnit);
                    }, 0);

                    const totalCost = costData.data.reduce((sum, request) => {
                        const costPerKm = request.vehicle.cost_per_km;
                        const estimatedDistance = 50; // km
                        return sum + (estimatedDistance * costPerKm);
                    }, 0);

                    setReportData({
                        summary: {
                            totalRevenue,
                            totalCost,
                            netProfit: totalRevenue - totalCost,
                            profitMargin: ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2)
                        },
                        details: [
                            { category: 'Revenue', amount: totalRevenue },
                            { category: 'Cost', amount: totalCost },
                            { category: 'Net Profit', amount: totalRevenue - totalCost }
                        ]
                    });
                    break;
                }

                case 'vehicle': {
                    // Fetch vehicle operational costs
                    const { data, error } = await supabase
                        .from('vehicle_request')
                        .select(`
                            vehicle_req_id,
                            vehicle_request_date,
                            vehicle:vehicle_id (
                                vehicle_id,
                                vehicle_type,
                                cost_per_km
                            )
                        `)
                        .gte('vehicle_request_date', dateRange.from.toISOString())
                        .lte('vehicle_request_date', dateRange.to.toISOString());

                    if (error) throw error;

                    // Calculate vehicle-wise costs
                    const vehicleCosts = data.reduce((acc, request) => {
                        const vehicleId = request.vehicle.vehicle_id;
                        const costPerKm = request.vehicle.cost_per_km;
                        const estimatedDistance = 50; // km
                        const tripCost = estimatedDistance * costPerKm;

                        if (!acc[vehicleId]) {
                            acc[vehicleId] = {
                                vehicleId,
                                vehicleType: request.vehicle.vehicle_type,
                                totalTrips: 0,
                                totalDistance: 0,
                                totalCost: 0,
                                fuelCost: 0 // Assuming 60% of total cost is fuel
                            };
                        }

                        acc[vehicleId].totalTrips += 1;
                        acc[vehicleId].totalDistance += estimatedDistance;
                        acc[vehicleId].totalCost += tripCost;
                        acc[vehicleId].fuelCost += tripCost * 0.6;

                        return acc;
                    }, {});

                    setReportData({
                        summary: {
                            totalVehicles: Object.keys(vehicleCosts).length,
                            totalTrips: Object.values(vehicleCosts).reduce(
                                (sum, vehicle) => sum + vehicle.totalTrips, 0
                            ),
                            totalCost: Object.values(vehicleCosts).reduce(
                                (sum, vehicle) => sum + vehicle.totalCost, 0
                            )
                        },
                        details: Object.values(vehicleCosts)
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
                                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '16px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Quantity vs Revenue Bar Chart */}
                        <Card className="w-full">
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
                        </Card>
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
                                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
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
                                        <Bar yAxisId="right" dataKey="transportationCost" fill="#82ca9d" name="Transportation Cost ($)" barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </>
                );

            case 'profit':
                return (
                    <>
                        {/* Revenue vs Cost vs Profit Bar Chart */}
                        <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle>Revenue vs Cost vs Profit</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-6">
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={reportData.details} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                        <Legend wrapperStyle={{ paddingTop: '16px' }} />
                                        <Bar dataKey="amount" fill={(data) => {
                                            if (data.category === 'Revenue') return '#00C49F';
                                            if (data.category === 'Cost') return '#FF8042';
                                            return '#0088FE'; // Net Profit
                                        }} barSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Profit Margin Gauge */}
                        <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle>Profit Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-6">
                                <div className="flex flex-col items-center justify-center h-full py-8">
                                    <div className="text-4xl font-bold mb-8">
                                        Profit Margin: {reportData.summary.profitMargin}%
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-8 mt-4 mb-2">
                                        <div
                                            className="bg-green-600 h-8 rounded-full"
                                            style={{
                                                width: `${Math.min(Math.max(parseFloat(reportData.summary.profitMargin), 0), 100)}%`
                                            }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between w-full mt-2 text-sm px-1">
                                        <span>0%</span>
                                        <span>25%</span>
                                        <span>50%</span>
                                        <span>75%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                );

            case 'vehicle':
                return (
                    <>
                        {/* Vehicle Cost Distribution Pie Chart */}
                        <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle>Vehicle Cost Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-6">
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={reportData.details}
                                            dataKey="totalCost"
                                            nameKey="vehicleType"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={110}
                                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {reportData.details.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '16px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Fuel vs Maintenance Costs */}
                        <Card className="w-full">
                            <CardHeader className="pb-4">
                                <CardTitle>Fuel vs Maintenance Costs by Vehicle</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-6">
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={reportData.details} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="vehicleType" tick={{ fontSize: 12 }} />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                        <Legend wrapperStyle={{ paddingTop: '16px' }} />
                                        <Bar dataKey="fuelCost" name="Fuel Cost" fill="#0088FE" barSize={40} />
                                        <Bar dataKey="totalCost" name="Total Cost" fill="#00C49F" barSize={40} />
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
                                {typeof value === 'number' ? 
                                    key.includes('cost') || key.includes('revenue') || key.includes('profit') ?
                                        `$${Number(value).toFixed(2)}` :
                                        key.includes('margin') ?
                                            `${value}%` :
                                            value
                                    : value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main content with table and charts side by side */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left side - Table */}
                <div className="w-full lg:w-1/3">
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
                                                        {typeof value === 'number' ?
                                                            key.includes('cost') || key.includes('revenue') || key.includes('profit') ?
                                                                `$${Number(value).toFixed(2)}` :
                                                                key.includes('distance') ?
                                                                    `${value} km` :
                                                                    value
                                                            : value}
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

                {/* Right side - Charts */}
                <div className="w-full lg:w-2/3">
                    <div className="grid grid-cols-1 gap-8">
                        {renderCharts()}
                    </div>
                </div>
            </div>
        </div>
    );
};

    return (
        
            <Card >
                <CardHeader >
                    <CardTitle >Financial Reports</CardTitle>
                    <CardDescription className="text-base mt-2">Generate detailed financial reports and analysis</CardDescription>
                </CardHeader>
                <CardContent >
                    <div >
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

                            <div className="flex items-end">
                                <Button 
                                    onClick={fetchReportData}
                                    className="w-full h-11"
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
            </Card>
       
    );
}