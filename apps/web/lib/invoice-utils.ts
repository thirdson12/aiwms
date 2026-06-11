export function invoiceProxyUrl(fileName: string) {
  return `/api/proxy/uploads/invoice/${encodeURIComponent(fileName)}`;
}

export function isInvoiceImage(fileName: string) {
  return /\.(jpg|jpeg|png|webp)$/i.test(fileName);
}
