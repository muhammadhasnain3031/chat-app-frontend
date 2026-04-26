import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { setCredentials } from '../store/authSlice';
import socket from '../socket';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      const { data } = await axios.post(
  'https://chat-app-backend-rose-omega-71.vercel.app/api/auth/register', 
  formData, 
  { withCredentials: true }
);
      dispatch(setCredentials(data));
      socket.connect();
      socket.emit('user_online', data.user.id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a2e' }}>
      <div style={{ background:'#16213e', padding:'40px', borderRadius:'16px', width:'100%', maxWidth:'380px', border:'1px solid #0f3460' }}>
        <h2 style={{ color:'#e94560', textAlign:'center', marginBottom:'8px' }}>💬 Join ChatApp</h2>
        <p style={{ color:'#888', textAlign:'center', marginBottom:'28px', fontSize:'13px' }}>Create your account</p>

        {error && <div style={{ background:'#3a1515', color:'#ff6b6b', padding:'10px', borderRadius:'8px', marginBottom:'14px', fontSize:'13px' }}>{error}</div>}

        {['name','email','password'].map(f => (
          <input key={f} type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'text'}
            placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
            value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})}
            style={{ width:'100%', padding:'11px 14px', marginBottom:'12px', background:'#0f3460', border:'1px solid #e94560', borderRadius:'8px', color:'#fff', fontSize:'14px', boxSizing:'border-box', outline:'none' }}
          />
        ))}

        <button onClick={handleSubmit}
          style={{ width:'100%', padding:'12px', background:'#e94560', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer' }}>
          Create Account
        </button>
        <p style={{ textAlign:'center', marginTop:'18px', fontSize:'13px', color:'#888' }}>
          Have account? <Link to="/login" style={{ color:'#e94560', fontWeight:'500' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}