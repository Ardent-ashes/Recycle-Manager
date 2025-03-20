'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  phone_no: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newUser, setNewUser] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    phone_no: ''
  });
  
  const supabase = createClient();

  useEffect(() => {
    if (isExpanded) {
      fetchUsers();
    } else {
      setIsLoading(false); // Set loading to false when collapsed
    }
  }, [isExpanded]);


  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('user_id', { ascending: true });
      
      if (error) throw error;
      if (data) setUsers(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateUserId = () => {
    const existingIds = users.map(user => {
      const numStr = user.user_id.replace('u_', '');
      return parseInt(numStr, 10);
    });
    
    const maxId = Math.max(...existingIds, 0);
    const newId = `u_${(maxId + 1).toString().padStart(3, '0')}`;
    return newId;
  };

  const handleModalOpen = () => {
    const newUserId = generateUserId();
    setNewUser({ ...newUser, user_id: newUserId });
    setIsModalOpen(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select();

      if (error) throw error;

      // Refresh the users list
      await fetchUsers();
      
      // Reset form and close modal
      setNewUser({ user_id: '', first_name: '', last_name: '', phone_no: '' });
      setIsModalOpen(false);
    } catch (error: any) {
      setError(error.message);
    }
  };



  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600">Manage and add new users to the system</p>
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
          {/* Add User Form */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User ID Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={newUser.user_id || generateUserId()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-50"
                  disabled
                />
              </div>

              {/* First Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                  placeholder="Enter last name"
                />
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newUser.phone_no}
                  onChange={(e) => setNewUser({...newUser, phone_no: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Add User Button */}
              <div className="flex items-end">
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">User ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">First Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Last Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Phone Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{user.user_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.first_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.last_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.phone_no}</td>
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
        </div>
      </div>
    </div>
  );



}