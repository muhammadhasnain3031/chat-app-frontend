import { io } from 'socket.io-client';

// Singleton — ek baar connect, poori app mein use karo
const socket = io('https://chat-app-backend-rose-omega-71.vercel.app', {
  autoConnect: false  // manually connect karenge login ke baad
});

export default socket;