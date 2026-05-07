const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export function validateImageUrl(url) {
  if (!url) return "";
  const normalized = String(url).trim();
  if (!/^https?:\/\//i.test(normalized)) {
    return "URL anh phai bat dau bang http:// hoac https://";
  }
  return "";
}

export function validateSelectedImageFile(file) {
  if (!file) return "Vui long chon anh";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Chi chap nhan JPG, PNG hoac WEBP";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Anh vuot qua gioi han 2MB";
  }
  return "";
}
