// createRecycleProcess.tsx
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateRecycleProcessProps {
    onSuccess: () => void;
}

export default function CreateRecycleProcess({ onSuccess }: CreateRecycleProcessProps) {
    const [pendingVehicleRequests, setPendingVehicleRequests] = useState<any[]>([]);
    const [selectedVehicleRequest, setSelectedVehicleRequest] = useState<string | null>(null);
    const [availablePlants, setAvailablePlants] = useState<any[]>([]);
    const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
    const [newProcessId, setNewProcessId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedRequestDetails, setSelectedRequestDetails] = useState<any>(null);

    useEffect(() => {
        fetchPendingVehicleRequests();
        fetchAvailablePlants();
    }, []);

    useEffect(() => {
        if (selectedVehicleRequest) {
            const details = pendingVehicleRequests.find(
                req => req.vehicle_req_id === selectedVehicleRequest
            );
            setSelectedRequestDetails(details);
            setSelectedPlant(null);
        } else {
            setSelectedRequestDetails(null);
        }
    }, [selectedVehicleRequest]);

    const fetchPendingVehicleRequests = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('vehicle_request')
                .select(`
                    vehicle_req_id,
                    vehicle_id,
                    garbage_req_id,
                    vehicle:vehicle_id (
                        vehicle_capacity
                    ),
                    garbage_request:garbage_req_id (
                        garbage_type,
                        garbage_quantity,
                        factory:factory_id (
                            factory_name,
                            factory_location
                        )
                    )
                `)
                .eq('vehicle_req_status', true);

            if (error) throw error;
            setPendingVehicleRequests(data || []);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const fetchAvailablePlants = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('recycle_plant')
                .select('*')
                .gt('plant_remaining_capacity', 0);

            if (error) throw error;
            setAvailablePlants(data || []);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const createRecycleProcess = async () => {
        if (!selectedVehicleRequest || !selectedPlant || !newProcessId) {
            setError('Please fill in all fields');
            return;
        }

        if (!newProcessId.startsWith('re_')) {
            setError('Process ID must start with "re_"');
            return;
        }

        const vehicleRequest = pendingVehicleRequests.find(
            req => req.vehicle_req_id === selectedVehicleRequest
        );
        const plant = availablePlants.find(
            p => p.plant_id === selectedPlant
        );

        if (plant.plant_remaining_capacity < vehicleRequest.garbage_request.garbage_quantity) {
            setError('Selected plant does not have enough capacity');
            return;
        }

        try {
            const supabase = createClient();

            // Create recycle process
            const { error: processError } = await supabase
                .from('recycle_process')
                .insert({
                    recycle_process_id: newProcessId,
                    plant_id: selectedPlant,
                    vehicle_req_id: selectedVehicleRequest,
                    plant_process_status: true,
                    process_date: new Date().toISOString()
                });

            if (processError) throw processError;

            // Update plant remaining capacity
            const newCapacity = plant.plant_remaining_capacity - vehicleRequest.garbage_request.garbage_quantity;
            const { error: plantError } = await supabase
                .from('recycle_plant')
                .update({ plant_remaining_capacity: newCapacity })
                .eq('plant_id', selectedPlant);

            if (plantError) throw plantError;

            // Update vehicle request status
            const { error: vehicleError } = await supabase
                .from('vehicle_request')
                .update({ vehicle_req_status: false })
                .eq('vehicle_req_id', selectedVehicleRequest);

            if (vehicleError) throw vehicleError;

            // Reset form and refresh data
            setSelectedVehicleRequest(null);
            setSelectedPlant(null);
            setNewProcessId('');
            setError(null);
            onSuccess();
            fetchPendingVehicleRequests();
            fetchAvailablePlants();

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Recycle Process</CardTitle>
                <CardDescription>Assign pending vehicle requests to recycling plants</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-medium mb-2">Select Vehicle Request</h3>
                            <Select
                                value={selectedVehicleRequest || ''}
                                onValueChange={setSelectedVehicleRequest}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select vehicle request" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pendingVehicleRequests.map((request) => (
                                        <SelectItem 
                                            key={request.vehicle_req_id} 
                                            value={request.vehicle_req_id}
                                        >
                                            {`${request.vehicle_req_id} - ${request.garbage_request.factory.factory_name} 
                                            (${request.garbage_request.garbage_quantity} tons)`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Select Recycling Plant</h3>
                            <Select
                                value={selectedPlant || ''}
                                onValueChange={setSelectedPlant}
                                disabled={!selectedVehicleRequest}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={
                                        !selectedVehicleRequest 
                                            ? "First select a vehicle request" 
                                            : "Select plant"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePlants.map((plant) => (
                                        <SelectItem 
                                            key={plant.plant_id} 
                                            value={plant.plant_id}
                                        >
                                            {`${plant.plant_name} - Remaining Capacity: ${plant.plant_remaining_capacity} tons`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Process ID</h3>
                            <Input
                                placeholder="Enter ID (must start with re_)"
                                value={newProcessId}
                                onChange={(e) => setNewProcessId(e.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button 
                                onClick={createRecycleProcess}
                                className="w-full"
                                disabled={!selectedVehicleRequest || !selectedPlant || !newProcessId}
                            >
                                Create Recycle Process
                            </Button>
                        </div>
                    </div>

                    {selectedRequestDetails && (
                        <div className="mt-4 p-4 bg-gray-50 rounded">
                            <h3 className="font-medium mb-2">Selected Request Details</h3>
                            <div className="space-y-2">
                                <p>Factory: {selectedRequestDetails.garbage_request.factory.factory_name}</p>
                                <p>Location: {selectedRequestDetails.garbage_request.factory.factory_location}</p>
                                <p>Garbage Type: {selectedRequestDetails.garbage_request.garbage_type}</p>
                                <p>Quantity: {selectedRequestDetails.garbage_request.garbage_quantity} tons</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}