import React from 'react';

export default function About(){
  // mock stats, daily rates of donation/transport
  const stats = {
    donationsToday: 12,
    transitsToday: 8,
    successfulMatches: 1245
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-3">About PRGAN Portal</h2>
      <p className="text-sm text-gray-700 mb-4">Prototype of an India-focused organ donation / transport portal with Aadhaar-based authentication simulation. Real deployment requires secure backends, consent flows, medical clearance and cooperation with government agencies.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <h4 className="font-semibold">Donations Today</h4>
          <div className="text-2xl font-bold mt-2">{stats.donationsToday}</div>
        </div>
        <div className="p-4 border rounded">
          <h4 className="font-semibold">Transports Today</h4>
          <div className="text-2xl font-bold mt-2">{stats.transitsToday}</div>
        </div>
        <div className="p-4 border rounded">
          <h4 className="font-semibold">Total Matches</h4>
          <div className="text-2xl font-bold mt-2">{stats.successfulMatches}</div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Important:</strong> This is a frontend prototype. Do not use this for real medical decisions. Integrate with certified medical systems, secure identity providers and legal frameworks before production.</p>
      </div>
    </div>
  );
}
