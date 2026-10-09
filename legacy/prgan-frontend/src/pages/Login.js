import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/*
  Very simple login:
  - Enter Aadhaar -> if matches a user in prgan_users, logs in.
*/

export default function Login(){
  const [aadhaar, setAadhaar] = useState('');
  const [message, setMessage] = useState('');
  const nav = useNavigate();

  function submit(){
    const users = JSON.parse(localStorage.getItem('prgan_users') || '[]');
    const user = users.find(u=>u.aadhaar === aadhaar);
    if(!user){
      setMessage('No account found with this Aadhaar. Please signup.');
      return;
    }
    localStorage.setItem('prgan_logged_in', JSON.stringify(user));
    nav('/dashboard');
  }

  return (
    <div className="bg-white p-6 rounded shadow max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <div>
        <label className="block text-sm">Aadhaar</label>
        <input value={aadhaar} onChange={e=>setAadhaar(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={submit} className="px-3 py-2 bg-indigo-600 text-white rounded">Login</button>
      </div>
      {message && <p className="text-sm text-red-500 mt-2">{message}</p>}
    </div>
  );
}
