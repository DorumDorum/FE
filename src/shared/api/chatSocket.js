import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

let client = null;
let connectPromise = null;

// 단일 STOMP 연결을 보장한다. 이미 연결되어 있으면 즉시 resolve.
export function connectChatSocket() {
  if (client && client.connected) return Promise.resolve(client);
  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve, reject) => {
    const stomp = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => resolve(stomp),
      onStompError: (frame) => reject(new Error(frame.headers?.message || 'STOMP error')),
      onWebSocketError: (e) => reject(e),
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
  }
}
