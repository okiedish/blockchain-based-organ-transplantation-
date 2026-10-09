import React from 'react';

export default function DonorForm({ onChange, data }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input value={data.name} onChange={e=>onChange('name', e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Date of Birth</label>
          <input value={data.dob} onChange={e=>onChange('dob', e.target.value)} type="date" className="mt-1 block w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Blood Group</label>
          <input value={data.blood} onChange={e=>onChange('blood', e.target.value)} placeholder="e.g. B+, O-" className="mt-1 block w-full rounded border px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Available Organs</label>
        <input value={data.organs} onChange={e=>onChange('organs', e.target.value)} placeholder="Comma separated e.g. Kidney,Liver" className="mt-1 block w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Location (City / Hospital)</label>
        <input value={data.location} onChange={e=>onChange('location', e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
      </div>
    </div>
  );
}
