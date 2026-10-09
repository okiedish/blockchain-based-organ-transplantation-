import React from 'react';
import { Link } from 'react-router-dom';

export default function Home(){
  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-semibold mb-2">Welcome to PRGAN — National Organ Blockchain Portal</h1>
      <p className="text-gray-700 mb-4">A government-style prototype portal for organ donation, transport scheduling and secure matching. Aadhaar-based authentication is simulated.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Get Started</h3>
          <p className="text-sm text-gray-600">Authenticate with Aadhaar (simulated) then sign up as Patient or Donor.</p>
          <Link className="mt-3 inline-block px-3 py-2 bg-indigo-600 text-white rounded" to="/aadhaar">Aadhaar Auth</Link>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Matching</h3>
          <p className="text-sm text-gray-600">View potential donor-patient matches based on organ and location.</p>
          <Link className="mt-3 inline-block px-3 py-2 bg-indigo-600 text-white rounded" to="/matching">See Matching</Link>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">About & Stats</h3>
          <p className="text-sm text-gray-600">Daily donation & transport statistics (mocked).</p>
          <Link className="mt-3 inline-block px-3 py-2 bg-indigo-600 text-white rounded" to="/about">About</Link>
        </div>
      </div>
    </div>
  );
}
