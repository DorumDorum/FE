export function applyReadReceipt(messages, receipt) {
  const readAt = new Date(receipt.readAt).getTime();
  return messages.map((m) => {
    if (m.senderNo === receipt.readerUserNo) return m;
    if (m.unreadCount <= 0) return m;
    if (new Date(m.sentAt).getTime() > readAt) return m;
    return { ...m, unreadCount: m.unreadCount - 1 };
  });
}

export function appendMessage(messages, incoming) {
  const idx = messages.findIndex((m) => m.messageNo === incoming.messageNo);
  if (idx >= 0) {
    const next = messages.slice();
    next[idx] = incoming;
    return next;
  }
  return [...messages, incoming];
}
