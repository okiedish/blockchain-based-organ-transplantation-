import React from 'react';

export default function NotFound(){
  return (
    <div className="bg-white p-6 rounded shadow text-center">
      <h3 className="text-xl font-semibold">404 — Page not found</h3>
      <p className="text-sm text-gray-600">The page you requested does not exist.</p>
    </div>
  );
}
