// Map country calling code prefix to country code (ISO 3166-1 alpha-2) for flag display
const pinCodeToCountry = [
  { prefix: '+91', code: 'in', name: 'India' },
  { prefix: '+1', code: 'us', name: 'USA' },
  { prefix: '+44', code: 'gb', name: 'UK' },
  { prefix: '+61', code: 'au', name: 'Australia' },
  { prefix: '+971', code: 'ae', name: 'UAE' },
  { prefix: '+65', code: 'sg', name: 'Singapore' },
  { prefix: '+49', code: 'de', name: 'Germany' },
  { prefix: '+33', code: 'fr', name: 'France' },
  { prefix: '+81', code: 'jp', name: 'Japan' },
  { prefix: '+86', code: 'cn', name: 'China' },
  { prefix: '+55', code: 'br', name: 'Brazil' },
  { prefix: '+7', code: 'ru', name: 'Russia' },
  { prefix: '+82', code: 'kr', name: 'South Korea' },
  { prefix: '+39', code: 'it', name: 'Italy' },
  { prefix: '+34', code: 'es', name: 'Spain' },
]

export function getCountryFromContact(contact) {
  if (!contact) return null
  const str = String(contact).trim()
  // Sort by prefix length descending so +971 matches before +9
  const sorted = [...pinCodeToCountry].sort((a, b) => b.prefix.length - a.prefix.length)
  for (const entry of sorted) {
    if (str.startsWith(entry.prefix)) return entry
  }
  return null
}

export function getFlagUrl(countryCode) {
  return `https://flagcdn.com/w40/${countryCode}.png`
}
