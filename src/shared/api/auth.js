import { apiRequest } from './client';

const PROFILE_STORAGE_KEY = 'dorumdorum:profile';

function mapProfile(profile) {
  return {
    displayName: profile.nickname || profile.name || '',
    accountName: profile.name || '',
    email: profile.email || '',
    department: profile.major || '',
    studentId: profile.studentNo || '',
    age: profile.age != null ? String(profile.age) : '',
    gender: profile.gender || '',
    photo: '',
    userNo: profile.userNo || '',
    grade: profile.grade || '',
    birth: profile.birth || '',
  };
}

export function cacheProfile(profile) {
  if (typeof window === 'undefined' || !profile) return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(mapProfile(profile)));
}

export function clearProfileCache() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

export function getCachedUserNo() {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return '';
    return JSON.parse(raw).userNo || '';
  } catch {
    return '';
  }
}

export async function login(email, password) {
  await apiRequest('/api/users/login', {
    method: 'POST',
    body: { email, password },
  });

  return getMe({ retry: false });
}

export async function logout() {
  try {
    await apiRequest('/api/users/logout', { method: 'DELETE' });
  } finally {
    clearProfileCache();
  }
}

export async function sendVerificationEmail(email) {
  await apiRequest(`/api/email/send?email=${encodeURIComponent(email)}`, {
    method: 'POST',
  });
}

export async function verifyEmail(email, code) {
  await apiRequest(`/api/email/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
    method: 'POST',
  });
}

export async function signUp(payload) {
  await apiRequest('/api/users/sign-up', {
    method: 'POST',
    body: payload,
  });
}

export async function sendPasswordResetEmail(email) {
  await apiRequest(`/api/email/password-reset/send?email=${encodeURIComponent(email)}`, {
    method: 'POST',
  });
}

export async function verifyPasswordResetCode(email, code) {
  await apiRequest(`/api/email/password-reset/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
    method: 'POST',
  });
}

export async function resetPassword(email, newPassword) {
  await apiRequest('/api/users/password/reset', {
    method: 'POST',
    body: { email, newPassword, newPasswordCheck: newPassword },
  });
}

export async function reissueToken() {
  await apiRequest('/api/token/reissue', { method: 'POST' });
}

export async function updateUserProfile(request) {
  const profile = await apiRequest('/api/users/profile', {
    method: 'PATCH',
    body: request,
  });
  cacheProfile(profile);
  return profile;
}

export async function getMe({ retry = true } = {}) {
  try {
    const profile = await apiRequest('/api/users/profile/me');
    cacheProfile(profile);
    return profile;
  } catch (error) {
    if (!retry) throw error;

    await reissueToken();
    const profile = await apiRequest('/api/users/profile/me');
    cacheProfile(profile);
    return profile;
  }
}
