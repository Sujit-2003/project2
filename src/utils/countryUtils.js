// Map ISD code to ISO country code for flag display
const isdToIso = {
  '+91': 'in',
  '+1': 'us',
  '+44': 'gb',
  '+61': 'au',
  '+971': 'ae',
  '+65': 'sg',
  '+49': 'de',
  '+33': 'fr',
  '+81': 'jp',
  '+86': 'cn',
  '+55': 'br',
  '+7': 'ru',
  '+82': 'kr',
  '+39': 'it',
  '+34': 'es',
}

export function getIsoCode(isdCode) {
  return isdToIso[isdCode] || null
}

export function getCountryFromContact(contact) {
  if (!contact) return null
  const str = String(contact).trim()
  // Sort by prefix length descending so +971 matches before +9, +91 before +1
  const prefixes = Object.keys(isdToIso).sort((a, b) => b.length - a.length)
  for (const prefix of prefixes) {
    if (str.startsWith(prefix)) {
      return { prefix, code: isdToIso[prefix], name: prefix }
    }
  }
  // Fallback: 10-digit number starting with 6-9 is likely Indian
  if (/^[6-9]\d{9}$/.test(str)) {
    return { prefix: '+91', code: 'in', name: 'India' }
  }
  return null
}

export function getFlagUrl(isoCode) {
  if (!isoCode) return ''
  return `https://flagcdn.com/w40/${isoCode.toLowerCase()}.png`
}

// Format contact for display: flag + ISD code + number
// countryObj comes from getCountries() API: { country_id, country_name, isd_code }
export function formatPatientContact(contact, countryObj) {
  const num = String(contact || '').trim()
  if (countryObj && countryObj.isd_code) {
    const iso = getIsoCode(countryObj.isd_code)
    const display = num.startsWith('+') ? num : `${countryObj.isd_code} ${num}`
    return { display, isoCode: iso, countryName: countryObj.country_name }
  }
  // Fallback to contact-based detection
  const detected = getCountryFromContact(num)
  if (detected) {
    const display = num.startsWith('+') ? num : `${detected.prefix} ${num}`
    return { display, isoCode: detected.code, countryName: detected.name }
  }
  return { display: num || '-', isoCode: null, countryName: null }
}
