/**
 * Avatar Helper
 * Prevents massive Base64 strings (5-10MB each) from inflating JSON responses to 50-70MB.
 * If photo_url is a long base64 string, converts it to an avatar endpoint URL: /api/users/:id/avatar
 */

export function formatAvatarUrl(userId, photoUrl) {
  if (!photoUrl) return null;
  if (typeof photoUrl === 'string' && (photoUrl.startsWith('data:image/') || photoUrl.length > 500)) {
    return `/api/users/${userId}/avatar`;
  }
  return photoUrl;
}
