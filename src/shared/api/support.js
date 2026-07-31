import * as client from './client';

export function createSupportInquiry(request) {
  return client.apiRequestWithAuth('/api/support/inquiries', {
    method: 'POST',
    body: request,
  });
}

export function loadSupportInquiries() {
  return client.apiRequestWithAuth('/api/support/inquiries');
}

export function loadSupportInquiry(inquiryNo) {
  return client.apiRequestWithAuth(`/api/support/inquiries/${encodeURIComponent(inquiryNo)}`);
}
