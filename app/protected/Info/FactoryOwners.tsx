'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface FactoryOwner {
  user_id: string;
  factory_id: string;
  user_name?: string;  // from users table
  factory_name?: string;  // from factory table
}

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface Factory {
  factory_id: string;
  factory_name: string;
}

export default function FactoryOwners() {
  const [factoryOwners, setFactoryOwners] = useState<FactoryOwner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    factory_id: ''
  });

  const supabase = createClient();

  useEffect(() => {
    if (isExpanded) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [isExpanded]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch factory owners with user and factory details
      const { data: ownersData, error: ownersError } = await supabase
        .from('factory_owner')
        .select(`
          *,
          users:user_id (first_name, last_name),
          factory:factory_id (factory_name)
        `);

      if (ownersError) throw ownersError;

      // Fetch available users (not already factory owners)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, first_name, last_name');

      if (usersError) throw usersError;

      // Fetch factories
      const { data: factoriesData, error: factoriesError } = await supabase
        .from('factory')
        .select('factory_id, factory_name');

      if (factoriesError) throw factoriesError;

      setFactoryOwners(ownersData || []);
      setUsers(usersData || []);
      setFactories(factoriesData || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const [confirmDelete, setConfirmDelete] = useState<{
    userId: string;
    factoryId: string;
  } | null>(null);

  const handleRemoveOwner = async (userId: string, factoryId: string) => {
    setConfirmDelete({ userId, factoryId });
  };

  const confirmRemoveOwner = async () => {
    if (!confirmDelete) return;

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('factory_owner')
        .delete()
        .eq('user_id', confirmDelete.userId)
        .eq('factory_id', confirmDelete.factoryId);

      if (deleteError) throw deleteError;

      // Refresh the data
      await fetchData();
      
      // Close the confirmation modal
      setConfirmDelete(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleAssignOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('factory_owner')
        .insert([newAssignment]);

      if (error) throw error;

      await fetchData();
      setNewAssignment({ user_id: '', factory_id: '' });
    } catch (error: any) {
      setError(error.message);
    }
    const handleRemoveOwner = async (userId: string, factoryId: string) => {
        try {
          const { error } = await supabase
            .from('factory_owner')
            .delete()
            .match({ 
              user_id: userId,
              factory_id: factoryId 
            });
    
          if (error) throw error;
    
          // Refresh data after removal
          await fetchData();
        } catch (error: any) {
          setError(error.message);
        }}
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Factory Owner Management</h2>
          <p className="text-sm text-gray-600">Manage factory ownership assignments</p>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="p-6 border-t border-gray-200">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div>Loading...</div>
            </div>
          ) : (
            <>
              {/* Assign Factory Owner Form */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select User
                    </label>
                    <select
                      value={newAssignment.user_id}
                      onChange={(e) => setNewAssignment({...newAssignment, user_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                    >
                      <option value="">Select a user</option>
                      {users.map((user) => (
                        <option key={user.user_id} value={user.user_id}>
                          {`${user.first_name} ${user.last_name}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Factory Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Factory
                    </label>
                    <select
                      value={newAssignment.factory_id}
                      onChange={(e) => setNewAssignment({...newAssignment, factory_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                    >
                      <option value="">Select a factory</option>
                      {factories.map((factory) => (
                        <option key={factory.factory_id} value={factory.factory_id}>
                          {factory.factory_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assign Button */}
                  <div className="flex items-end">
                    <button
                      onClick={handleAssignOwner}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Assign Factory Owner
                    </button>
                  </div>
                </div>
              </div>

              {/* Factory Owners Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">User ID</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">User Name</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Factory ID</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Factory Name</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {factoryOwners.map((owner) => (
                      <tr key={`${owner.user_id}-${owner.factory_id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500">{owner.user_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {`${owner.users?.first_name} ${owner.users?.last_name}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{owner.factory_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{owner.factory?.factory_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <button
                            onClick={() => handleRemoveOwner(owner.user_id, owner.factory_id)}
                            className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                          >
                            <svg 
                              className="w-4 h-4" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                              />
                            </svg>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Removal
            </h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to remove this factory owner? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveOwner}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}