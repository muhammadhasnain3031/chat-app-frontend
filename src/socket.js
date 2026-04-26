import { io } from 'socket.io-client';

// Singleton — ek baar connect, poori app mein use karo
const socket = io('http://localhost:5000', {
  autoConnect: false  // manually connect karenge login ke baad
});

export default socket;