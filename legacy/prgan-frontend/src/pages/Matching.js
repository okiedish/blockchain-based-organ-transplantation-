import React, { useState, useEffect } from 'react';

/*
  Matching:
  - Loads donors and patients from prgan_users.
  - Shows simple matches by comparing organ fields & location.
*/

export default function Matching(){
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  useEffect(()=> {
    const u = JSON.parse(localStorage.getItem('prgan_users') || '[]');
    setUsers(u);
  }, []);

  function runMatching(){
    const donors = users.filter(x=>x.role==='donor');
    const patients = users.filter(x=>x.role==='patient');
    const res = [];
    patients.forEach(p=>{
      donors.forEach(d=>{
        const donorOrgans = (d.organs||'').toLowerCase().split(',').map(s=>s.trim());
        const need = (p.organ||'').toLowerCase().trim();
        if(need && donorOrgans.includes(need)){
          // simple proximity check: same city/hospital substring
          const sameLoc = (d.location||'').toLowerCase().includes((p.hospital||'').toLowerCase().split(',')[0]) || (p.hospital||'').toLowerCase().includes((d.location||'').toLowerCase());
          res.push({ patient: p, donor: d, proximity: sameLoc ? 'High' : 'Low' });
        }
      });
    });
    setMatches(res);
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Matching</h2>
      <p className="text-sm text-gray-600 mb-4">This is a simple, local matching demo. Real matching requires medical checks, priority logic and secure blockchain records.</p>
      <div className="mb-4">
        <button onClick={runMatching} className="px-3 py-2 bg-indigo-600 text-white rounded">Run Matching</button>
      </div>

      <div>
        <h3 className="font-semibold">Found {matches.length} matches</h3>
        <div className="mt-3 space-y-3">
          {matches.map((m, idx)=>(
            <div key={idx} className="p-3 border rounded bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-medium">Patient: {m.patient.name} — needs {m.patient.organ}</div>
                  <div className="text-xs text-gray-600">Hospital: {m.patient.hospital}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">Donor: {m.donor.name}</div>
                  <div className="text-xs text-gray-600">Organs: {m.donor.organs}</div>
                  <div className="text-xs mt-1">Proximity: <span className="font-semibold">{m.proximity}</span></div>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={()=>alert('Call to transport scheduling placeholder')} className="px-2 py-1 border rounded">Schedule Transport</button>
                <button onClick={()=>alert('Record match on blockchain placeholder')} className="px-2 py-1 bg-indigo-600 text-white rounded">Register Match</button>
              </div>
            </div>
          ))}
          {matches.length===0 && <div className="text-gray-600">No matches yet. Add some users via Aadhaar -> Signup.</div>}
        </div>
      </div>
    </div>
  );
}
