import React from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribe } from '../../shared/api/chatSocket';
import { getCachedUserNo } from '../../shared/api/auth';

// 로그인 상태에서 개인 알림 큐를 구독. 방 삭제/강퇴 시 사용자에게 알리고 채팅 목록으로 보낸다.
export function ChatNotificationGate({ children }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!getCachedUserNo()) return;
    let alive = true;
    let unsub = () => {};

    subscribe('/user/queue/notification', (msg) => {
      if (!alive) return;
      if (msg.type === 'ROOM_DELETED') {
        alert('방이 삭제되어 채팅방이 닫혔어요.');
        navigate('/chat');
      } else if (msg.type === 'KICKED_FROM_ROOM') {
        alert('방에서 내보내져 채팅방이 닫혔어요.');
        navigate('/chat');
      }
    }).then((fn) => { if (alive) unsub = fn; else fn(); });

    return () => { alive = false; unsub(); };
  }, [navigate]);

  return children;
}
