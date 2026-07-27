const DEVICE_ID_STORAGE_KEY = 'dorumdorum:deviceId';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getDeviceId() {
  if (typeof window === 'undefined') return '';

  let deviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  }
  return deviceId;
}

// Opens the /api/notifications/stream SSE connection and calls onNotification
// for each unnamed event pushed by the server. Returns an unsubscribe function.
export function openNotificationStream(onNotification) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const deviceId = getDeviceId();
  const source = new EventSource(
    `${API_BASE_URL}/api/notifications/stream?deviceId=${encodeURIComponent(deviceId)}`,
    { withCredentials: true },
  );

  source.onmessage = (event) => {
    if (!event.data) return;
    try {
      onNotification(JSON.parse(event.data));
    } catch {
      // malformed payload — ignore
    }
  };

  source.onerror = () => {
    // EventSource retries connecting on its own; nothing to do here.
  };

  return () => source.close();
}
