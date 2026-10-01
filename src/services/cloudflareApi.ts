import { User } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Cloudflare API request failed'), { status: response.status, code: data.error });
  return data as T;
}

export const cloudflareApi = {
  me: () => request<{ user: User | null }>('/api/auth/me'),
  login: (term: string, password: string) => request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ term, password }) }),
  register: (input: { username: string; displayName: string; email: string; password: string; avatar?: string }) => request<{ user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  updateAccount: (input: { email?: string; newPassword?: string; currentPassword: string }) => request<{ user: User }>('/api/auth/account', { method: 'PUT', body: JSON.stringify(input) }),
  submitReport: (targetType: 'post' | 'user' | 'comment', targetId: string, reason: string) =>
    request<{ report: { id: string; status: string } }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId, reason }),
    }),
  listEntities: (type?: string, ownerId?: string) => request<{ items: Array<{ entityType: string; entityId: string; ownerId?: string; payload: string }> }>(`/api/entities?${new URLSearchParams({ ...(type ? { type } : {}), ...(ownerId ? { ownerId } : {}) })}`),
  saveEntity: (entityType: string, entityId: string, payload: string, ownerId?: string) => request<{ ok: boolean }>('/api/entities', { method: 'POST', body: JSON.stringify({ entityType, entityId, payload, ownerId }) }),
  saveEntityBatch: (entities: Array<{ entityType: string; entityId: string; payload: string; ownerId?: string }>) => request<{ ok: boolean }>('/api/entities/batch', { method: 'POST', body: JSON.stringify({ entities }) }),
};
