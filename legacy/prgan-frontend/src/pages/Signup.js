import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DonorForm from '../components/DonorForm';
import PatientForm from '../components/PatientForm';

/*
  Signup flow:
  - Checks if Aadhaar was verified (prgan_aadhaar_verified in localStorage)
  - Allows selecting role: donor or patient
  - Saves profile to localStorage 'prgan_users' as simple store
*/

export default function Signup(){
  const [role, setRole] = useState('donor');
  const [profile, setProfile] = useState({});
  const [message, setMessage] = useState('');
  const nav = useNavigate();

  useEffect(()=> {
    const aad = localStorage.getItem('prgan_aadhaar_verified');
    if(!aad){
      setMessage('Please verify Aadhaar before signing up. Redirecting to Aadhaar auth...');
      setTimeout(()=> nav('/aadhaar'), 1200);
    } else {
      setProfile(prev=> ({...prev, aadhaar: aad}));
    }
  }, []);

  function onChange(field, value){
    setProfile(prev=> ({...prev, [field]: value}));
  }

  function submit(){
    // basic validation
    if(!profile.name){ setMessage('Please provide name.'); return; }
    // load users
    const users = JSON.parse(localStorage.getItem('prgan_users') || '[]');
    // check duplicate aadhaar
    if(users.find(u=>u.aadhaar === profile.aadhaar)){
      setMessage('User already exists with this Aadhaar. Please login.');
      return;
    }
    const final = { ...profile, role, id: Date.now() };
    users.push(final);
    localStorage.setItem('prgan_users', JSON.stringify(users));
    // auto-login
    localStorage.setItem('prgan_logged_in', JSON.stringify(final));
    nav('/dashboard');
  }

  return (
    <div className="bg-white p-6 rounded shadow max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Signup</h2>
      <div className="mb-4">
        <label className="block text-sm">Signup as</label>
        <select value={role} onChange={e=>setRole(e.target.value)} className="mt-1 block w-48 rounded border px-3 py-2">
          <option value="donor">Donor</option>
          <option value="patient">Patient</option>
        </select>
      </div>

      {role === 'donor' ? <DonorForm data={profile} onChange={onChange}/> : <PatientForm data={profile} onChange={onChange}/>}

      <div className="mt-4 flex gap-2">
        <button onClick={submit} className="px-3 py-2 bg-indigo-600 text-white rounded">Create account & continue</button>
      </div>

      {message && <p className="mt-3 text-sm text-red-500">{message}</p>}
    </div>
  );
}
