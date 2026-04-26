import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';
import { logout } from '../store/authSlice';
import {
  setUsers, setSelectedUser, setMessages,
  addMessage, setOnlineUsers, setTyping, removeTyping
} from '../store/chatSlice';

export default function Chat() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user, token } = useSelector(s => s.auth);
  const { users, selectedUser, messages, onlineUsers, typingUsers } = useSelector(s => s.chat);
  const [text, setText]      = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef  = useRef(null);
  const typingTimeout   = useRef(null);

  // ✅ headers ko useMemo ki jagah simple const — token se seedha
  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  // ✅ Users fetch + Socket setup
  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    // Users fetch karo
    axios.get('http://localhost:5000/api/chat/users', getHeaders())
      .then(r => dispatch(setUsers(r.data)))
      .catch(err => {
        if (err.response?.status === 401) {
          dispatch(logout());
          navigate('/login');
        }
      });

    // Socket connect
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('user_online', user.id);

    // Socket events
    socket.on('online_users',    (ids)          => dispatch(setOnlineUsers(ids)));
    socket.on('receive_message', (msg)          => dispatch(addMessage(msg)));
    socket.on('message_sent',    (msg)          => dispatch(addMessage(msg)));
    socket.on('user_typing',     ({ senderId }) => dispatch(setTyping(senderId)));
    socket.on('user_stop_typing',({ senderId }) => dispatch(removeTyping(senderId)));

    // Cleanup — component unmount pe
    return () => {
      socket.off('online_users');
      socket.off('receive_message');
      socket.off('message_sent');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [token]); // ✅ token dependency

  // ✅ Selected user badlne pe messages load karo
  useEffect(() => {
    if (!selectedUser || !token) return;
    axios.get(`http://localhost:5000/api/chat/messages/${selectedUser._id}`, getHeaders())
      .then(r => dispatch(setMessages(r.data)))
      .catch(console.error);
  }, [selectedUser]); // eslint-disable-line

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !selectedUser) return;
    socket.emit('send_message', {
      senderId:   user.id,
      receiverId: selectedUser._id,
      text,
    });
    setText('');
    socket.emit('stop_typing', { senderId: user.id, receiverId: selectedUser._id });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!selectedUser) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { senderId: user.id, receiverId: selectedUser._id });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop_typing', { senderId: user.id, receiverId: selectedUser._id });
    }, 1500);
  };

  const handleLogout = () => {
    socket.disconnect();
    dispatch(logout());
    navigate('/login');
  };

  const isOnline  = (id) => onlineUsers.includes(id);
  const isTypingU = (id) => typingUsers.includes(id);

  return (
    <div style={{ display:'flex', height:'100vh', background:'#1a1a2e', color:'#fff', fontFamily:'sans-serif' }}>

      {/* SIDEBAR */}
      <div style={{ width:'280px', background:'#16213e', borderRight:'1px solid #0f3460', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'18px 16px', borderBottom:'1px solid #0f3460', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontWeight:'700', fontSize:'16px', color:'#e94560' }}>💬 ChatApp</p>
            <p style={{ fontSize:'12px', color:'#aaa', marginTop:'2px' }}>Hi, {user?.name}</p>
          </div>
          <button onClick={handleLogout}
            style={{ background:'none', border:'1px solid #e94560', color:'#e94560', padding:'5px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'12px' }}>
            Logout
          </button>
        </div>

        <div style={{ padding:'12px' }}>
          <input placeholder="Search users..."
            style={{ width:'100%', padding:'8px 12px', background:'#0f3460', border:'none', borderRadius:'8px', color:'#fff', fontSize:'13px', boxSizing:'border-box', outline:'none' }}
          />
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {users.length === 0 && (
            <p style={{ color:'#555', fontSize:'13px', textAlign:'center', padding:'20px' }}>
              No other users yet.<br/>Register another account to chat!
            </p>
          )}
          {users.map(u => (
            <div key={u._id}
              onClick={() => dispatch(setSelectedUser(u))}
              style={{
                display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px',
                cursor:'pointer',
                background: selectedUser?._id === u._id ? '#0f3460' : 'transparent',
                borderLeft: selectedUser?._id === u._id ? '3px solid #e94560' : '3px solid transparent',
              }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'#e94560', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'700' }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div style={{
                  position:'absolute', bottom:'1px', right:'1px',
                  width:'11px', height:'11px', borderRadius:'50%',
                  background: isOnline(u._id) ? '#2ecc71' : '#666',
                  border:'2px solid #16213e'
                }} />
              </div>
              <div>
                <p style={{ fontWeight:'600', fontSize:'14px', marginBottom:'2px' }}>{u.name}</p>
                <p style={{ fontSize:'12px', color: isOnline(u._id) ? '#2ecc71' : '#888' }}>
                  {isTypingU(u._id) ? '✏️ typing...' : isOnline(u._id) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        {selectedUser ? (
          <>
            {/* Header */}
            <div style={{ padding:'16px 24px', background:'#16213e', borderBottom:'1px solid #0f3460', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ position:'relative' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#e94560', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700' }}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ position:'absolute', bottom:'0', right:'0', width:'11px', height:'11px', borderRadius:'50%', background: isOnline(selectedUser._id) ? '#2ecc71' : '#666', border:'2px solid #16213e' }} />
              </div>
              <div>
                <p style={{ fontWeight:'700', fontSize:'15px' }}>{selectedUser.name}</p>
                <p style={{ fontSize:'12px', color: isOnline(selectedUser._id) ? '#2ecc71' : '#888' }}>
                  {isTypingU(selectedUser._id) ? '✏️ typing...' : isOnline(selectedUser._id) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:'8px' }}>
              {messages.map((msg, i) => {
                const isMine = msg.sender === user.id || msg.sender?._id === user.id;
                return (
                  <div key={msg._id || i} style={{ display:'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth:'65%', padding:'10px 14px',
                      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMine ? '#e94560' : '#0f3460',
                      fontSize:'14px', lineHeight:'1.5',
                    }}>
                      <p>{msg.text}</p>
                      <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', marginTop:'4px', textAlign: isMine ? 'right' : 'left' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        {isMine && <span> {msg.read ? '✓✓' : '✓'}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
              {isTypingU(selectedUser._id) && (
                <div style={{ display:'flex' }}>
                  <div style={{ background:'#0f3460', padding:'10px 16px', borderRadius:'16px 16px 16px 4px', color:'#aaa', fontSize:'13px' }}>
                    ✏️ typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'16px 24px', background:'#16213e', borderTop:'1px solid #0f3460', display:'flex', gap:'10px' }}>
              <input
                value={text} onChange={handleTyping}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{ flex:1, padding:'12px 16px', background:'#0f3460', border:'none', borderRadius:'10px', color:'#fff', fontSize:'14px', outline:'none' }}
              />
              <button onClick={sendMessage} disabled={!text.trim()}
                style={{ padding:'12px 22px', background: text.trim() ? '#e94560' : '#444', color:'#fff', border:'none', borderRadius:'10px', cursor: text.trim() ? 'pointer' : 'not-allowed', fontSize:'16px' }}>
                ➤
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <p style={{ fontSize:'50px', marginBottom:'16px' }}>💬</p>
            <p style={{ fontSize:'18px', fontWeight:'600', color:'#888' }}>Select a user to start chatting</p>
            <p style={{ fontSize:'13px', color:'#555', marginTop:'8px' }}>Choose from the left sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
}