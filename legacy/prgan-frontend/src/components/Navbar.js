import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();
  return (
    <nav className="bg-white shadow">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="text-indigo-600 font-bold text-xl">PRGAN</div>
            <div className="text-sm text-gray-600">National Organ Blockchain Portal</div>
          </div>
          <div className="flex items-center space-x-4">
            <Link className={`py-2 px-3 rounded ${loc.pathname==='/' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`} to="/">Home</Link>
            <Link className={`py-2 px-3 rounded ${loc.pathname==='/matching' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`} to="/matching">Matching</Link>
            <Link className={`py-2 px-3 rounded ${loc.pathname==='/about' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`} to="/about">About</Link>
            <Link className="py-2 px-3 bg-indigo-600 text-white rounded" to="/aadhaar">Aadhaar Auth</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
