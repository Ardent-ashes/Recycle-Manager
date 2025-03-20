'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Vehicle {
  vehicle_id: string;
  vehicle_type: string;
  vehicle_capacity: number;
  vehicle_status: boolean;
  cost_per_km: number;
}

export default function VehicleInfo() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextVehicleId, setNextVehicleId] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_type: '',
    vehicle_capacity: 0,
    vehicle_status: true,
    cost_per_km: 0
  });

  const supabase = createClient();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const generateVehicleId = (existingVehicles: Vehicle[]) => {
    if (existingVehicles.length === 0) {
      return 've_001';
    }

    const existingIds = existingVehicles.map(vehicle => {
      try {
        const numStr = vehicle.vehicle_id.replace('ve_', '');
        return parseInt(numStr, 10);
      } catch {
        return 0;
      }
    }).filter(id => !isNaN(id));

    const maxId = Math.max(...existingIds, 0);
    return `ve_${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vehicle')
        .select('*')
        .order('vehicle_id', { ascending: true });

      if (error) throw error;

      const nextId = generateVehicleId(data || []);
      setNextVehicleId(nextId);
      setVehicles(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vehicleWithId = {
        vehicle_id: nextVehicleId,
        ...newVehicle
      };

      const { error } = await supabase
        .from('vehicle')
        .insert([vehicleWithId]);

      if (error) throw error;

      await fetchVehicles();
      setNewVehicle({
        vehicle_type: '',
        vehicle_capacity: 0,
        vehicle_status: true,
        cost_per_km: 0
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setNewVehicle({
      vehicle_type: vehicle.vehicle_type,
      vehicle_capacity: vehicle.vehicle_capacity,
      vehicle_status: vehicle.vehicle_status,
      cost_per_km: vehicle.cost_per_km
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    try {
      const { error } = await supabase
        .from('vehicle')
        .update({
          vehicle_type: newVehicle.vehicle_type,
          vehicle_capacity: newVehicle.vehicle_capacity,
          vehicle_status: newVehicle.vehicle_status,
          cost_per_km: newVehicle.cost_per_km
        })
        .eq('vehicle_id', editingVehicle.vehicle_id);

      if (error) throw error;

      await fetchVehicles();
      setEditingVehicle(null);
      setNewVehicle({
        vehicle_type: '',
        vehicle_capacity: 0,
        vehicle_status: true,
        cost_per_km: 0
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      const { error } = await supabase
        .from('vehicle')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (error) throw error;

      await fetchVehicles();
      setConfirmDelete(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const content = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        </h2>
        <p className="text-sm text-gray-600">
          {editingVehicle ? 'Update vehicle details' : 'Create a new vehicle with details'}
        </p>
      </div>

      {/* Add/Edit Vehicle Form */}
      <div className="mb-8">
        <form onSubmit={editingVehicle ? handleUpdate : handleAddVehicle}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle ID
              </label>
              <input
                type="text"
                value={editingVehicle ? editingVehicle.vehicle_id : nextVehicleId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-50"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type
              </label>
              <input
                type="text"
                value={newVehicle.vehicle_type}
                onChange={(e) => setNewVehicle({...newVehicle, vehicle_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter vehicle type"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity (kg)
              </label>
              <input
                type="number"
                value={newVehicle.vehicle_capacity}
                onChange={(e) => setNewVehicle({...newVehicle, vehicle_capacity: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter capacity"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost per KM
              </label>
              <input
                type="number"
                step="0.01"
                value={newVehicle.cost_per_km}
                onChange={(e) => setNewVehicle({...newVehicle, cost_per_km: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter cost per km"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={newVehicle.vehicle_status.toString()}
                onChange={(e) => setNewVehicle({...newVehicle, vehicle_status: e.target.value === 'true'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                required
              >
                <option value="true">Available</option>
                <option value="false">Not Available</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
              {editingVehicle && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingVehicle(null);
                    setNewVehicle({
                      vehicle_type: '',
                      vehicle_capacity: 0,
                      vehicle_status: true,
                      cost_per_km: 0
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Existing Vehicles Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Vehicles</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Vehicle ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Capacity (kg)</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Cost/KM(BDT)</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{vehicle.vehicle_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{vehicle.vehicle_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{vehicle.vehicle_capacity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{vehicle.cost_per_km}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehicle.vehicle_status 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.vehicle_status ? 'Available' : 'Not Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(vehicle.vehicle_id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  );

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div>Loading...</div>
        </div>
      ) : (
        content
      )}
    </>
  );
}