import React from 'react';
import { useNavigate } from 'react-router-dom';

function useUser(){
  const raw = localStorage.getItem('prgan_logged_in');
  return raw ? JSON.parse(raw) : null;
}

export default function Dashboard(){
  const user = useUser();
  const nav = useNavigate();
  if(!user) {
    return (
      <div className="bg-white p-6 rounded shadow max-w-md mx-auto text-center">
        <p>Please login to see dashboard.</p>
      </div>
    );
  }

  function logout(){
    localStorage.removeItem('prgan_logged_in');
    nav('/');
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-gray-600">Welcome, {user.name || 'User'} ({user.role})</p>
        </div>
        <div className="space-x-2">
          <button onClick={()=>nav('/matching')} className="px-3 py-2 border rounded">Go to Matching</button>
          <button onClick={logout} className="px-3 py-2 bg-red-600 text-white rounded">Logout</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Profile</h3>
          <pre className="text-sm mt-2 bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(user, null, 2)}</pre>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Quick Actions</h3>
          <div className="mt-2 space-y-2">
            <button onClick={()=>alert('Transport scheduling is a placeholder. Backend integration required.')} className="block px-3 py-2 bg-indigo-600 text-white rounded">Schedule Transport (placeholder)</button>
            <button onClick={()=>alert('Blockchain transaction placeholder: registering on-chain...')} className="block px-3 py-2 border rounded">Register on Blockchain (placeholder)</button>
          </div>
        </div>
      </div>
    </div>
  );
}
