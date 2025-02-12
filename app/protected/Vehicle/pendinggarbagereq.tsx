'use client';
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PendingGarbageRequests() {
    // States
    const [pendingGarbageRequests, setPendingGarbageRequests] = useState<any[]>([]);
    const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
    const [selectedGarbageRequest, setSelectedGarbageRequest] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [newVehicleRequestId, setNewVehicleRequestId] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [selectedRequestDetails, setSelectedRequestDetails] = useState<any>(null);

    // Fetch pending requests and available vehicles
    useEffect(() => {
        fetchPendingGarbageRequests();
        fetchAvailableVehicles();
    }, []);

    // Update selected request details when a request is selected
    useEffect(() => {
        if (selectedGarbageRequest) {
            const details = pendingGarbageRequests.find(
                req => req.garbage_req_id === selectedGarbageRequest
            );
            setSelectedRequestDetails(details);
            // Reset vehicle selection when garbage request changes
            setSelectedVehicle(null);
        } else {
            setSelectedRequestDetails(null);
        }
    }, [selectedGarbageRequest]);

    const fetchPendingGarbageRequests = async () => {
        try {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('factory_garbage_request')
                .select(`
                    garbage_req_id,
                    garbage_type,
                    garbage_quantity,
                    factory_id,
                    factory:factory_id (
                        factory_name,
                        factory_location
                    )
                `)
                .eq('garbage_req_status', true); // true means pending

            if (error) throw error;
            setPendingGarbageRequests(data || []);
        } catch (err: any) {
            setCreateError(err.message);
        }
    };

    const fetchAvailableVehicles = async () => {
        try {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('vehicle')
                .select('*')
                .eq('vehicle_status', true); // true means available

            if (error) throw error;
            setAvailableVehicles(data || []);
        } catch (err: any) {
            setCreateError(err.message);
        }
    };

    // Filter vehicles based on capacity
    const getEligibleVehicles = () => {
        if (!selectedRequestDetails) return availableVehicles;
        
        return availableVehicles.filter(
            vehicle => vehicle.vehicle_capacity >= selectedRequestDetails.garbage_quantity
        );
    };

    const createVehicleRequest = async () => {
        if (!selectedGarbageRequest || !selectedVehicle || !newVehicleRequestId) {
            setCreateError('Please fill in all fields');
            return;
        }

        if (!newVehicleRequestId.startsWith('vr_')) {
            setCreateError('Vehicle Request ID must start with "vr_"');
            return;
        }

        // Validate vehicle capacity
        const selectedVehicleDetails = availableVehicles.find(v => v.vehicle_id === selectedVehicle);
        if (selectedVehicleDetails.vehicle_capacity < selectedRequestDetails.garbage_quantity) {
            setCreateError('Vehicle capacity must be greater than or equal to garbage quantity');
            return;
        }

        try {
            const supabase = await createClient();

            // Start a transaction
            const { error: vehicleRequestError } = await supabase
                .from('vehicle_request')
                .insert({
                    vehicle_req_id: newVehicleRequestId,
                    vehicle_id: selectedVehicle,
                    garbage_req_id: selectedGarbageRequest,
                    vehicle_req_status: true, // true means on road
                    vehicle_request_date: new Date().toISOString()
                });

            if (vehicleRequestError) throw vehicleRequestError;

            // Update garbage request status
            const { error: garbageUpdateError } = await supabase
                .from('factory_garbage_request')
                .update({ garbage_req_status: false }) // false means completed
                .eq('garbage_req_id', selectedGarbageRequest);

            if (garbageUpdateError) throw garbageUpdateError;

            // Update vehicle status
            const { error: vehicleUpdateError } = await supabase
                .from('vehicle')
                .update({ vehicle_status: false }) // false means not available
                .eq('vehicle_id', selectedVehicle);

            if (vehicleUpdateError) throw vehicleUpdateError;

            // Reset form and refresh data
            setSelectedGarbageRequest(null);
            setSelectedVehicle(null);
            setNewVehicleRequestId('');
            fetchPendingGarbageRequests();
            fetchAvailableVehicles();
            setCreateError(null);

        } catch (err: any) {
            setCreateError(err.message);
        }
    };

    const eligibleVehicles = getEligibleVehicles();

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Create Vehicle Request</CardTitle>
                <CardDescription>Assign vehicles to pending garbage requests</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {createError && (
                        <Alert variant="destructive">
                            <AlertDescription>{createError}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pending Garbage Requests */}
                        <div>
                            <h3 className="font-medium mb-2">Select Garbage Request</h3>
                            <Select
                                value={selectedGarbageRequest || ''}
                                onValueChange={setSelectedGarbageRequest}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select garbage request" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pendingGarbageRequests.map((request) => (
                                        <SelectItem 
                                            key={request.garbage_req_id} 
                                            value={request.garbage_req_id}
                                        >
                                            {`${request.garbage_req_id} - ${request.factory.factory_name} 
                                            (${request.garbage_quantity} tons of ${request.garbage_type})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Available Vehicles */}
                        <div>
                            <h3 className="font-medium mb-2">Select Vehicle</h3>
                            <Select
                                value={selectedVehicle || ''}
                                onValueChange={setSelectedVehicle}
                                disabled={!selectedGarbageRequest}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={
                                        !selectedGarbageRequest 
                                            ? "First select a garbage request" 
                                            : "Select vehicle"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {eligibleVehicles.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            No vehicles with sufficient capacity
                                        </SelectItem>
                                    ) : (
                                        eligibleVehicles.map((vehicle) => (
                                            <SelectItem 
                                                key={vehicle.vehicle_id} 
                                                value={vehicle.vehicle_id}
                                            >
                                                {`${vehicle.vehicle_id} - Capacity: ${vehicle.vehicle_capacity} tons 
                                                (${vehicle.cost_per_km}/km)`}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Vehicle Request ID */}
                        <div>
                            <h3 className="font-medium mb-2">Vehicle Request ID</h3>
                            <Input
                                placeholder="Enter ID (must start with vr_)"
                                value={newVehicleRequestId}
                                onChange={(e) => setNewVehicleRequestId(e.target.value)}
                            />
                        </div>

                        {/* Create Button */}
                        <div className="flex items-end">
                            <Button 
                                onClick={createVehicleRequest}
                                className="w-full"
                                disabled={!selectedGarbageRequest || !selectedVehicle || !newVehicleRequestId}
                            >
                                Create Vehicle Request
                            </Button>
                        </div>
                    </div>

                    {/* Display Selected Request Details */}
                    {selectedRequestDetails && (
                        <div className="mt-4 p-4 bg-gray-50 rounded">
                            <h3 className="font-medium mb-2">Selected Request Details</h3>
                            <div className="space-y-2">
                                <p>Factory: {selectedRequestDetails.factory.factory_name}</p>
                                <p>Location: {selectedRequestDetails.factory.factory_location}</p>
                                <p>Garbage Type: {selectedRequestDetails.garbage_type}</p>
                                <p>Quantity: {selectedRequestDetails.garbage_quantity} tons</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}