'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface RecyclePlant {
  plant_id: string;
  plant_name: string;
  plant_location: string;
  plant_type: string;
  plant_total_capacity: number;
  plant_remaining_cap: number;
  plant_latitude: number;
  plant_longitude: number;
  revenue_per_unit: number;
}

export default function RecyclePlantInfo() {
  const [plants, setPlants] = useState<RecyclePlant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPlantId, setNextPlantId] = useState('');
  const [editingPlant, setEditingPlant] = useState<RecyclePlant | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newPlant, setNewPlant] = useState({
    plant_name: '',
    plant_location: '',
    plant_type: '',
    plant_total_capacity: 0,
    plant_remaining_cap: 0,
    plant_latitude: 0,
    plant_longitude: 0,
    revenue_per_unit: 0
  });

  const supabase = createClient();

  useEffect(() => {
    fetchPlants();
  }, []);

  const generatePlantId = (existingPlants: RecyclePlant[]) => {
    if (existingPlants.length === 0) {
      return 'plant_001';
    }

    const existingIds = existingPlants.map(plant => {
      try {
        const numStr = plant.plant_id.replace('plant_', '');
        return parseInt(numStr, 10);
      } catch {
        return 0;
      }
    }).filter(id => !isNaN(id));

    const maxId = Math.max(...existingIds, 0);
    return `plant_${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const fetchPlants = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('recycle_plant')
        .select('*')
        .order('plant_id', { ascending: true });

      if (error) throw error;

      const nextId = generatePlantId(data || []);
      setNextPlantId(nextId);
      setPlants(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const plantWithId = {
        plant_id: nextPlantId,
        ...newPlant
      };

      const { error } = await supabase
        .from('recycle_plant')
        .insert([plantWithId]);

      if (error) throw error;

      await fetchPlants();
      setNewPlant({
        plant_name: '',
        plant_location: '',
        plant_type: '',
        plant_total_capacity: 0,
        plant_remaining_cap: 0,
        plant_latitude: 0,
        plant_longitude: 0,
        revenue_per_unit: 0
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (plant: RecyclePlant) => {
    setEditingPlant(plant);
    setNewPlant({
      plant_name: plant.plant_name,
      plant_location: plant.plant_location,
      plant_type: plant.plant_type,
      plant_total_capacity: plant.plant_total_capacity,
      plant_remaining_cap: plant.plant_remaining_cap,
      plant_latitude: plant.plant_latitude,
      plant_longitude: plant.plant_longitude,
      revenue_per_unit: plant.revenue_per_unit
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlant) return;

    try {
      const { error } = await supabase
        .from('recycle_plant')
        .update({
          plant_name: newPlant.plant_name,
          plant_location: newPlant.plant_location,
          plant_type: newPlant.plant_type,
          plant_total_capacity: newPlant.plant_total_capacity,
          plant_remaining_cap: newPlant.plant_remaining_cap,
          plant_latitude: newPlant.plant_latitude,
          plant_longitude: newPlant.plant_longitude,
          revenue_per_unit: newPlant.revenue_per_unit
        })
        .eq('plant_id', editingPlant.plant_id);

      if (error) throw error;

      await fetchPlants();
      setEditingPlant(null);
      setNewPlant({
        plant_name: '',
        plant_location: '',
        plant_type: '',
        plant_total_capacity: 0,
        plant_remaining_cap: 0,
        plant_latitude: 0,
        plant_longitude: 0,
        revenue_per_unit: 0
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (plantId: string) => {
    try {
      const { error } = await supabase
        .from('recycle_plant')
        .delete()
        .eq('plant_id', plantId);

      if (error) throw error;

      await fetchPlants();
      setConfirmDelete(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const content = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {editingPlant ? 'Edit Recycling Plant' : 'Add New Recycling Plant'}
        </h2>
        <p className="text-sm text-gray-600">
          {editingPlant ? 'Update recycling plant details' : 'Create a new recycling plant with details'}
        </p>
      </div>

      {/* Add/Edit Plant Form */}
      <div className="mb-8">
        <form onSubmit={editingPlant ? handleUpdate : handleAddPlant}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant ID
              </label>
              <input
                type="text"
                value={editingPlant ? editingPlant.plant_id : nextPlantId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-50"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant Name
              </label>
              <input
                type="text"
                value={newPlant.plant_name}
                onChange={(e) => setNewPlant({...newPlant, plant_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter plant name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={newPlant.plant_location}
                onChange={(e) => setNewPlant({...newPlant, plant_location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter location"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant Type
              </label>
              <input
                type="text"
                value={newPlant.plant_type}
                onChange={(e) => setNewPlant({...newPlant, plant_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter plant type"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Capacity
              </label>
              <input
                type="number"
                value={newPlant.plant_total_capacity}
                onChange={(e) => setNewPlant({...newPlant, plant_total_capacity: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter total capacity"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remaining Capacity
              </label>
              <input
                type="number"
                value={newPlant.plant_remaining_cap}
                onChange={(e) => setNewPlant({...newPlant, plant_remaining_cap: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter remaining capacity"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={newPlant.plant_latitude}
                onChange={(e) => setNewPlant({...newPlant, plant_latitude: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter latitude"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={newPlant.plant_longitude}
                onChange={(e) => setNewPlant({...newPlant, plant_longitude: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter longitude"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revenue per Unit
              </label>
              <input
                type="number"
                step="0.01"
                value={newPlant.revenue_per_unit}
                onChange={(e) => setNewPlant({...newPlant, revenue_per_unit: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter revenue per unit"
                required
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                {editingPlant ? 'Update Plant' : 'Add Plant'}
              </button>
              {editingPlant && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlant(null);
                    setNewPlant({
                      plant_name: '',
                      plant_location: '',
                      plant_type: '',
                      plant_total_capacity: 0,
                      plant_remaining_cap: 0,
                      plant_latitude: 0,
                      plant_longitude: 0,
                      revenue_per_unit: 0
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

      {/* Existing Plants Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Recycling Plants</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Plant ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Location</th>
                {/* <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Type</th> */}
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Capacity</th>
                {/* <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Remaining</th> */}
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Revenue/Unit</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plants.map((plant) => (
                <tr key={plant.plant_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{plant.plant_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{plant.plant_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{plant.plant_location}</td>
                  {/* <td className="px-6 py-4 text-sm text-gray-500">{plant.plant_type}</td> */}
                  <td className="px-6 py-4 text-sm text-gray-500">{plant.plant_total_capacity}</td>
                  {/* <td className="px-6 py-4 text-sm text-gray-500">{plant.plant_remaining_cap}</td> */}
                  <td className="px-6 py-4 text-sm text-gray-500">{plant.revenue_per_unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(plant)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(plant.plant_id)}
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
              Are you sure you want to delete this recycling plant? This action cannot be undone.
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