// components/garbage-request/create-request-form.tsx
'use client';
import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Factory, CreateRequestFormProps } from "@/types/garbage-request";

export default function CreateRequestForm({ onRequestCreated, onCancel }: CreateRequestFormProps) {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newRequest, setNewRequest] = useState({
        request_id: '',
        factory_id: '',
        garbage_type: '',
        garbage_quantity: '',
    });

    useEffect(() => {
        fetchFactories();
    }, []);

    const fetchFactories = async () => {
        try {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('factory')
                .select('factory_id')
                .order('factory_id', { ascending: true });
            
            if (error) throw error;
            setFactories(data || []);
        } catch (err: any) {
            console.error('Error fetching factories:', err);
            setError('Failed to load factories');
        }
    };

    const isValidRequestId = (id: string) => {
        const pattern = /^gar_\d{3}$/;
        return pattern.test(id.toLowerCase());
    };

    const checkDuplicateRequestId = async (requestId: string) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('factory_garbage_request')
            .select('garbage_req_id')
            .eq('garbage_req_id', requestId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return !!data;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const requestId = newRequest.request_id.toLowerCase();

            if (!isValidRequestId(requestId)) {
                throw new Error('Request ID must be in format "gar_XXX" where X is a number (e.g., gar_001)');
            }

            const isDuplicate = await checkDuplicateRequestId(requestId);
            if (isDuplicate) {
                throw new Error('This request ID already exists. Please use a different ID.');
            }
            const garbageQuantity = parseInt(newRequest.garbage_quantity);

            const supabase = await createClient();
            const { data, error } = await supabase
                .from('factory_garbage_request')
                .insert([{
                    garbage_req_id: requestId,
                    factory_id: newRequest.factory_id,
                    garbage_type: newRequest.garbage_type,
                    garbage_quantity: garbageQuantity,
                    remaining_garbage: garbageQuantity,
                    garbage_request_date: new Date().toISOString(),
                    garbage_req_status: true
                }])
                .select();

            if (error) throw error;

            onRequestCreated();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md space-y-4"
        >
            {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Request ID Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Request ID *
                    </label>
                    <div className="space-y-1">
                        <Input
                            type="text"
                            value={newRequest.request_id}
                            onChange={(e) => setNewRequest({
                                ...newRequest,
                                request_id: e.target.value
                            })}
                            placeholder="gar_001"
                            required
                            pattern="gar_\d{3}"
                            className="w-full"
                        />
                        <p className="text-sm text-gray-500">
                            Format: gar_XXX (e.g., gar_001)
                        </p>
                    </div>
                </div>

                {/* Factory ID Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Factory ID *
                    </label>
                    <select
                        value={newRequest.factory_id}
                        onChange={(e) => setNewRequest({
                            ...newRequest,
                            factory_id: e.target.value
                        })}
                        className="w-full p-2 border rounded-md"
                        required
                    >
                        <option value="">Select Factory ID</option>
                        {factories.map((factory) => (
                            <option 
                                key={factory.factory_id} 
                                value={factory.factory_id}
                            >
                                {factory.factory_id}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Garbage Type Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Garbage Type *
                    </label>
                    <select
                        value={newRequest.garbage_type}
                        onChange={(e) => setNewRequest({
                            ...newRequest,
                            garbage_type: e.target.value
                        })}
                        className="w-full p-2 border rounded-md"
                        required
                    >
                        <option value="">Select Type</option>
                        <option value="glass">Glass</option>
                        <option value="plastic">Plastic</option>
                        <option value="paper">Paper</option>
                    </select>
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Quantity (Ton) *
                    </label>
                    <Input
                        type="number"
                        value={newRequest.garbage_quantity}
                        onChange={(e) => setNewRequest({
                            ...newRequest,
                            garbage_quantity: e.target.value
                        })}
                        placeholder="Enter quantity in Ton"
                        required
                        min="1"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        'Submit Request'
                    )}
                </Button>
            </div>
        </form>
    );
}