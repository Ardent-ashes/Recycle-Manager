// components/ProcessingCharts.tsx
'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// components/ProcessingCharts.tsx
export default function ProcessingCharts({ data }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Processing Volume by Plant</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart
    data={data}
    margin={{
        top: 20,
        right: 30,
        left: 20,
        bottom: 60,
    }}
>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis 
        dataKey="plantName"
        angle={-45}
        textAnchor="end"
        height={60}
    />
    <YAxis 
        label={{ 
            value: 'Amount (tons)', 
            angle: -90, 
            position: 'insideLeft' 
        }}
    />
    <Tooltip 
        formatter={(value, name) => [`${value} tons`, name]}
        labelFormatter={(label) => `Plant: ${label}`}
    />
    <Legend />
    <Bar 
        dataKey="completedQuantity" 
        fill="#00C49F"
        name="Completed"
    />
    <Bar 
        dataKey="pendingQuantity" 
        fill="#FF8042"
        name="Pending"
    />
</BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}