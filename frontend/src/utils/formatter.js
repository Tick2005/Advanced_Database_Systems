export const truncate = (str, n = 80) => str?.length > n ? str.slice(0, n) + '…' : str || '';
export const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
