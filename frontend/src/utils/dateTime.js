export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('vi-VN');
};
export const toISODate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};
export const daysBetween = (a, b) => {
  const d1 = new Date(a), d2 = new Date(b);
  return Math.max(1, Math.ceil((d2 - d1) / (1000*60*60*24)));
};
