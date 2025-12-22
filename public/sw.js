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
  // FCM 데이터가 오면 알림 표시 로직을 여기에 추가 가능
  // 예: const data = event.data?.json(); self.registration.showNotification(...)
})

