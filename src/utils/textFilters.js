export const ETH_PHONE_REGEX = /(?:\+?251|0)?[ -]?[97]\d{1}(?:[ -]?\d{2,3}){2,3}|\b\d{8,12}\b/g;

// Matches @usernames, t.me links, telegram.dog, bit.ly, http/https, and common web domains
export const SOCIAL_AND_LINK_REGEX = /(@[a-zA-Z0-9_]{4,32})|(https?:\/\/[^\s]+)|(t\.me\/[a-zA-Z0-9_]+)|(telegram\.me\/[a-zA-Z0-9_]+)|([a-zA-Z0-9.-]+\.(com|org|net|io|me|info|biz)\b(\/[^\s]*)?)/gi;

export function hasForbiddenContact(text) {
  if (!text) return false;
  const cleanNumbers = text.replace(/[\s\-_.]/g, '');
  const hasPhone = ETH_PHONE_REGEX.test(text) || /(?:\+?251|0)[79]\d{7}/.test(cleanNumbers);
  const hasLinkOrHandle = SOCIAL_AND_LINK_REGEX.test(text);
  return hasPhone || hasLinkOrHandle;
}

export function sanitizeDescription(text) {
  if (!text) return '';
  return text
    .replace(ETH_PHONE_REGEX, '[የተጠበቀ ስልክ / Contact Hidden]')
    .replace(SOCIAL_AND_LINK_REGEX, '[የተጠበቀ ሊንክ / Link Hidden]');
}
