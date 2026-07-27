import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

let client = null;
let connectPromise = null;
let pendingResolvers = [];

export function connectChatSocket() {
  if (client && client.connected) return Promise.resolve(client);
  if (connectPromise) return connectPromise;

  // client 존재하지만 재연결 중 — 다음 onConnect를 기다린다
  if (client) {
    return new Promise((resolve) => pendingResolvers.push(resolve));
  }

  connectPromise = new Promise((resolve, reject) => {
    const stomp = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        // 연결(재연결 포함) 성공 시 stale promise 초기화
        connectPromise = null;
        const pending = pendingResolvers.splice(0);
        pending.forEach((r) => r(stomp));
        resolve(stomp);
      },
      onStompError: (frame) => {
        connectPromise = null;
        client = null;
        reject(new Error(frame.headers?.message || 'STOMP error'));
      },
      onWebSocketError: (e) => {
        connectPromise = null;
        client = null;
        reject(e);
      },
    });
    stomp.activate();
    client = stomp;
  });
  return connectPromise;
}

// 토픽 구독. 콜백에는 파싱된 JSON 객체를 넘긴다. 반환된 함수로 구독 해제.
export async function subscribe(destination, callback) {
  const stomp = await connectChatSocket();
  const sub = stomp.subscribe(destination, (frame) => {
    let payload = frame.body;
    try { payload = JSON.parse(frame.body); } catch { /* keep raw */ }
    callback(payload);
  });
  return () => sub.unsubscribe();
}

// 메시지 전송. body는 객체.
export async function publish(destination, body) {
  const stomp = await connectChatSocket();
  stomp.publish({ destination, body: JSON.stringify(body) });
}

export function disconnectChatSocket() {
  if (client) {
    client.deactivate();
    client = null;
    connectPromise = null;
    pendingResolvers = [];
  }
}
