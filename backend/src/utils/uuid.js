// Utility function to check if a string is a valid UUID
export function isUuid(str) {
  if (typeof str !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Utility function to check if a string is a valid integer
export function isInteger(str) {
  if (typeof str !== 'string') return false;
  return /^\d+$/.test(str);
}

// Utility function to determine if an ID should be cast as UUID or integer
export function getCastType(id) {
  return isUuid(id) ? '::uuid' : '::int';
}
