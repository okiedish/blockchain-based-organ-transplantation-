import React from 'react';

export default function PatientForm({ onChange, data }) {
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
          <label className="block text-sm font-medium">Gender</label>
          <select value={data.gender} onChange={e=>onChange('gender', e.target.value)} className="mt-1 block w-full rounded border px-3 py-2">
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Required Organ</label>
        <input value={data.organ} onChange={e=>onChange('organ', e.target.value)} placeholder="e.g. Kidney, Liver" className="mt-1 block w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Hospital / City</label>
        <input value={data.hospital} onChange={e=>onChange('hospital', e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
      </div>
    </div>
  );
}
