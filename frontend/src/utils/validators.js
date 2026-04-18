export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPhone = (v) => /^[0-9]{9,11}$/.test(v?.replace(/\s/g, ''));
export const required = (v) => v !== null && v !== undefined && String(v).trim() !== '';
