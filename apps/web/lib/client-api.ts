'use client';

export async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`/api/proxy/${path}`, {
    ...init,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed');
  }

  return data;
}

export async function clientUploadInvoice(file: File): Promise<{ fileName: string }> {
  const form = new FormData();
  form.append('file', file);
  return clientFetch<{ fileName: string }>('uploads/invoice', {
    method: 'POST',
    body: form,
  });
}
