import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    users:          [],      // sare users
    selectedUser:   null,    // kiske saath chat ho rahi hai
    messages:       [],      // current chat messages
    onlineUsers:    [],      // online user IDs
    typingUsers:    [],      // kaun type kar raha hai
  },
  reducers: {
    setUsers:        (s, a) => { s.users        = a.payload; },
    setSelectedUser: (s, a) => { s.selectedUser = a.payload; s.messages = []; },
    setMessages:     (s, a) => { s.messages     = a.payload; },
    addMessage:      (s, a) => { s.messages.push(a.payload); },
    setOnlineUsers:  (s, a) => { s.onlineUsers  = a.payload; },
    setTyping:       (s, a) => {
      if (!s.typingUsers.includes(a.payload)) s.typingUsers.push(a.payload);
    },
    removeTyping:    (s, a) => {
      s.typingUsers = s.typingUsers.filter(id => id !== a.payload);
    },
  }
});

export const {
  setUsers, setSelectedUser, setMessages,
  addMessage, setOnlineUsers, setTyping, removeTyping
} = chatSlice.actions;

export default chatSlice.reducer;