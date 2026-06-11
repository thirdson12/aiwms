export function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase('tr');
}

export function matchesSearch(query: string, ...fields: Array<string | null | undefined>) {
  const q = normalizeSearch(query);
  if (!q) return true;
  return fields.some((field) => field && normalizeSearch(field).includes(q));
}
