'use client';
import { useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditGarbageRequestFormProps {
    request: any;
    onRequestUpdated: () => void;
    onCancel: () => void;
}

export default function EditGarbageRequestForm({ request, onRequestUpdated, onCancel }: EditGarbageRequestFormProps) {
    const [formData, setFormData] = useState({
        garbage_req_id: request.garbage_req_id,
        factory_id: request.factory_id,
        garbage_type: request.garbage_type,
        garbage_quantity: request.garbage_quantity,
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = await createClient();

            // Update the garbage request
            const { error: updateError } = await supabase
                .from('factory_garbage_request')
                .update({
                    garbage_type: formData.garbage_type,
                    garbage_quantity: formData.garbage_quantity,
                    factory_id: formData.factory_id,
                })
                .eq('garbage_req_id', request.garbage_req_id);

            if (updateError) throw updateError;

            onRequestUpdated();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Garbage Request ID</label>
                    <Input
                        value={formData.garbage_req_id}
                        disabled
                        className="bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Factory ID</label>
                    <Input
                        value={formData.factory_id}
                        onChange={(e) => setFormData({ ...formData, factory_id: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Garbage Type</label>
                    <Select
                        value={formData.garbage_type}
                        onValueChange={(value) => setFormData({ ...formData, garbage_type: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select garbage type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="plastic">Plastic</SelectItem>
                            <SelectItem value="metal">Metal</SelectItem>
                            <SelectItem value="paper">Paper</SelectItem>
                            <SelectItem value="organic">Organic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Quantity (tons)</label>
                    <Input
                        type="number"
                        value={formData.garbage_quantity}
                        onChange={(e) => setFormData({ ...formData, garbage_quantity: parseFloat(e.target.value) })}
                        min="0"
                        step="0.1"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Updating...' : 'Update Request'}
                </Button>
            </div>
        </form>
    );
}