'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Factory {
  factory_id: string;
  factory_name: string;
  factory_location: string;
  factory_latitude: number;
  factory_longitude: number;
}

export default function FactoryInfo() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextFactoryId, setNextFactoryId] = useState('');
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newFactory, setNewFactory] = useState({
    factory_name: '',
    factory_location: '',
    factory_latitude: 0,
    factory_longitude: 0
  });

  const supabase = createClient();

  useEffect(() => {
    fetchFactories();
  }, []);

  const generateFactoryId = (existingFactories: Factory[]) => {
    if (existingFactories.length === 0) {
      return 'fact_001';
    }

    const existingIds = existingFactories.map(factory => {
      try {
        const numStr = factory.factory_id.replace('fact_', '');
        return parseInt(numStr, 10);
      } catch {
        return 0;
      }
    }).filter(id => !isNaN(id));

    const maxId = Math.max(...existingIds, 0);
    return `fact_${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const fetchFactories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('factory')
        .select('*')
        .order('factory_id', { ascending: true });

      if (error) throw error;

      const nextId = generateFactoryId(data || []);
      setNextFactoryId(nextId);
      setFactories(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const factoryWithId = {
        factory_id: nextFactoryId,
        ...newFactory
      };

      const { error } = await supabase
        .from('factory')
        .insert([factoryWithId]);

      if (error) throw error;

      await fetchFactories();
      setNewFactory({
        factory_name: '',
        factory_location: '',
        factory_latitude: 0,
        factory_longitude: 0
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (factory: Factory) => {
    setEditingFactory(factory);
    setNewFactory({
      factory_name: factory.factory_name,
      factory_location: factory.factory_location,
      factory_latitude: factory.factory_latitude,
      factory_longitude: factory.factory_longitude
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFactory) return;

    try {
      const { error } = await supabase
        .from('factory')
        .update({
          factory_name: newFactory.factory_name,
          factory_location: newFactory.factory_location,
          factory_latitude: newFactory.factory_latitude,
          factory_longitude: newFactory.factory_longitude
        })
        .eq('factory_id', editingFactory.factory_id);

      if (error) throw error;

      await fetchFactories();
      setEditingFactory(null);
      setNewFactory({
        factory_name: '',
        factory_location: '',
        factory_latitude: 0,
        factory_longitude: 0
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (factoryId: string) => {
    try {
      const { error } = await supabase
        .from('factory')
        .delete()
        .eq('factory_id', factoryId);

      if (error) throw error;

      await fetchFactories();
      setConfirmDelete(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const content = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {editingFactory ? 'Edit Factory' : 'Add New Factory'}
        </h2>
        <p className="text-sm text-gray-600">
          {editingFactory ? 'Update factory details' : 'Create a new factory with details'}
        </p>
      </div>

      {/* Add/Edit Factory Form */}
      <div className="mb-8">
        <form onSubmit={editingFactory ? handleUpdate : handleAddFactory}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Factory ID
              </label>
              <input
                type="text"
                value={editingFactory ? editingFactory.factory_id : nextFactoryId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-50"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Factory Name
              </label>
              <input
                type="text"
                value={newFactory.factory_name}
                onChange={(e) => setNewFactory({...newFactory, factory_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter factory name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={newFactory.factory_location}
                onChange={(e) => setNewFactory({...newFactory, factory_location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter location"
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
                value={newFactory.factory_latitude}
                onChange={(e) => setNewFactory({...newFactory, factory_latitude: parseFloat(e.target.value)})}
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
                value={newFactory.factory_longitude}
                onChange={(e) => setNewFactory({...newFactory, factory_longitude: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                placeholder="Enter longitude"
                required
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                {editingFactory ? 'Update Factory' : 'Add Factory'}
              </button>
              {editingFactory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingFactory(null);
                    setNewFactory({
                      factory_name: '',
                      factory_location: '',
                      factory_latitude: 0,
                      factory_longitude: 0
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

      {/* Existing Factories Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Factories</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Factory ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Location</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Coordinates</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {factories.map((factory) => (
                <tr key={factory.factory_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{factory.factory_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{factory.factory_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{factory.factory_location}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {`${factory.factory_latitude.toFixed(6)}, ${factory.factory_longitude.toFixed(6)}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(factory)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(factory.factory_id)}
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
              Are you sure you want to delete this factory? This action cannot be undone.
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