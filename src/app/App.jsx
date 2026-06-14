import React from 'react';
import { AppRoutes } from './routes.jsx';
import { ChatNotificationGate } from '../features/chat/ChatNotificationGate.jsx';

export default function App() {
  return (
    <ChatNotificationGate>
      <AppRoutes />
    </ChatNotificationGate>
  );
}

