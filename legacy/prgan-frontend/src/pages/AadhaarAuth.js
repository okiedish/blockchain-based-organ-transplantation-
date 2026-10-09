import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/*
  This page simulates Aadhaar authentication:
  - User enters a 12-digit Aadhaar number.
  - App generates a 6-digit OTP (displayed on screen because we cannot access SMS).
  - User verifies OTP to mark Aadhaar as verified (stored in localStorage).
*/

export default function AadhaarAuth(){
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [message, setMessage] = useState('');
  const nav = useNavigate();

  function sendOtp(){
    if(!/^[0-9]{12}$/.test(aadhaar)){
      setMessage('Enter a valid 12-digit Aadhaar number.');
      return;
    }
    const code = Math.floor(100000 + Math.random()*900000).toString();
    setGeneratedOtp(code);
    // save to localStorage as "pending" to simulate backend
    localStorage.setItem('prgan_pending_aadhaar', aadhaar);
    localStorage.setItem('prgan_pending_otp', code);
    setMessage('OTP generated (for demo it is shown below). Please enter it to verify.');
  }

  function verifyOtp(){
    const stored = localStorage.getItem('prgan_pending_otp');
    const storedA = localStorage.getItem('prgan_pending_aadhaar');
    if(!stored || aadhaar !== storedA){
      setMessage('No OTP request matches this Aadhaar. Please generate first.');
      return;
    }
    if(otp === stored){
      localStorage.setItem('prgan_aadhaar_verified', aadhaar);
      localStorage.removeItem('prgan_pending_otp');
      localStorage.removeItem('prgan_pending_aadhaar');
      setMessage('Aadhaar verified successfully. You can now signup or login.');
      setTimeout(()=> nav('/signup'), 900);
    } else {
      setMessage('Incorrect OTP.');
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Aadhaar Authentication (Simulated)</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm">Enter Aadhaar (12 digits)</label>
          <input value={aadhaar} onChange={e=>setAadhaar(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" placeholder="123412341234"/>
        </div>

        <div className="flex gap-2">
          <button onClick={sendOtp} className="px-3 py-2 bg-indigo-600 text-white rounded">Generate OTP</button>
          <button onClick={()=>{ setAadhaar(''); setOtp(''); setGeneratedOtp(null); setMessage(''); localStorage.removeItem('prgan_pending_otp'); localStorage.removeItem('prgan_pending_aadhaar'); }} className="px-3 py-2 border rounded">Reset</button>
        </div>

        {generatedOtp && (
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-700">Generated OTP (demo only): <span className="font-mono text-lg">{generatedOtp}</span></div>
          </div>
        )}

        <div>
          <label className="block text-sm">Enter OTP</label>
          <input value={otp} onChange={e=>setOtp(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" placeholder="6-digit OTP" />
        </div>

        <div className="flex gap-2">
          <button onClick={verifyOtp} className="px-3 py-2 bg-green-600 text-white rounded">Verify OTP</button>
        </div>

        {message && <p className="text-sm text-gray-700 mt-2">{message}</p>}
      </div>
    </div>
  );
}
