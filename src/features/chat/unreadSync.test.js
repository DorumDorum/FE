import { describe, it, expect } from 'vitest';
import { applyReadReceipt, appendMessage } from './unreadSync';

const msg = (over) => ({
  messageNo: '1', senderNo: 'A', content: 'hi',
  messageType: 'TEXT', sentAt: '2026-06-14T10:00:00', unreadCount: 2, ...over,
});

describe('applyReadReceipt', () => {
  it('reader가 아닌 사람의 메시지 중 readAt 이전/같음이고 unread>0이면 1 감소', () => {
    const messages = [msg({ messageNo: '1', senderNo: 'A', sentAt: '2026-06-14T10:00:00', unreadCount: 2 })];
    const result = applyReadReceipt(messages, { readerUserNo: 'B', readAt: '2026-06-14T10:05:00' });
    expect(result[0].unreadCount).toBe(1);
  });

  it('reader 본인이 보낸 메시지는 감소하지 않는다', () => {
    const messages = [msg({ senderNo: 'B', unreadCount: 2 })];
    const result = applyReadReceipt(messages, { readerUserNo: 'B', readAt: '2026-06-14T10:05:00' });
    expect(result[0].unreadCount).toBe(2);
  });

  it('readAt 이후 전송된 메시지는 감소하지 않는다', () => {
    const messages = [msg({ sentAt: '2026-06-14T10:10:00', unreadCount: 2 })];
    const result = applyReadReceipt(messages, { readerUserNo: 'B', readAt: '2026-06-14T10:05:00' });
    expect(result[0].unreadCount).toBe(2);
  });

  it('unreadCount가 이미 0이면 음수로 내려가지 않는다', () => {
    const messages = [msg({ unreadCount: 0 })];
    const result = applyReadReceipt(messages, { readerUserNo: 'B', readAt: '2026-06-14T10:05:00' });
    expect(result[0].unreadCount).toBe(0);
  });
});

describe('appendMessage', () => {
  it('새 메시지를 뒤에 추가한다', () => {
    const result = appendMessage([msg({ messageNo: '1' })], msg({ messageNo: '2' }));
    expect(result.map((m) => m.messageNo)).toEqual(['1', '2']);
  });

  it('동일 messageNo는 중복 추가하지 않고 최신 값으로 대체한다', () => {
    const result = appendMessage([msg({ messageNo: '1', unreadCount: 2 })], msg({ messageNo: '1', unreadCount: 1 }));
    expect(result).toHaveLength(1);
    expect(result[0].unreadCount).toBe(1);
  });
});
