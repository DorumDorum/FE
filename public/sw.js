/* 기본 FCM용 Service Worker
 * - install/activate 시 즉시 활성화
 * - push 이벤트 핸들러는 비워둠(필요 시 알림 표시 로직 추가)
 */

self.addEventListener('install', () => {
  // 새 워커를 바로 활성화
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // 이전 서비스워커 제어권 즉시 가져오기
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  // FCM이 전달한 payload(JSON)를 파싱해 알림을 직접 표시한다.
  event.waitUntil(
    (async () => {
      try {
        const payload = event.data?.json ? event.data.json() : {};

        // FCM notification 필드 우선, 없으면 data로 대체
        const notification = payload.notification || payload;
        const data = payload.data || {};

        const title = notification.title || 'DorumDorum';
        const body = notification.body || '';
        const image = notification.image;
        const icon = notification.icon || '/vite.svg';
        const badge = notification.badge || '/vite.svg';
        const clickAction = data.clickAction || notification.clickAction || '/';
        const tag = data.tag || notification.tag || 'dorumdorum';

        await self.registration.showNotification(title, {
          body,
          icon,
          badge,
          image,
          data: {
            ...data,
            clickAction,
            tag,
          },
          tag,
          renotify: true, // 동일 tag면 갱신/재알림
          requireInteraction: true, // 사용자가 닫기 전까지 유지
          timestamp: Date.now(),
        });

        console.log('[sw] notification shown', { title, body, data, image });
      } catch (err) {
        console.error('[sw] push handling failed', err);
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.clickAction || '/';

  event.waitUntil(
    (async () => {
      const url = new URL(targetUrl, self.location.origin).href;
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      for (const client of allClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })()
  );
});

