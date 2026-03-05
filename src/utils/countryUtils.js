// Map ISD code to country name for contact-based detection
const isdToCountry = {
  '+91': 'India',
  '+1': 'USA',
  '+44': 'UK',
  '+61': 'Australia',
  '+971': 'UAE',
  '+65': 'Singapore',
  '+49': 'Germany',
  '+33': 'France',
  '+81': 'Japan',
  '+86': 'China',
  '+55': 'Brazil',
  '+7': 'Russia',
  '+82': 'South Korea',
  '+39': 'Italy',
  '+34': 'Spain',
}

export function getCountryFromContact(contact) {
  if (!contact) return null
  const str = String(contact).trim()
  const prefixes = Object.keys(isdToCountry).sort((a, b) => b.length - a.length)
  for (const prefix of prefixes) {
    if (str.startsWith(prefix)) {
      return { prefix, name: isdToCountry[prefix] }
    }
  }
  // Fallback: 10-digit number starting with 6-9 is likely Indian
  if (/^[6-9]\d{9}$/.test(str)) {
    return { prefix: '+91', name: 'India' }
  }
  return null
}

// Format contact for display using country data from /api/get-countries
// countryObj: { country_id, country_name, isd_code }
export function formatPatientContact(contact, countryObj) {
  const num = String(contact || '').trim()
  if (countryObj && countryObj.isd_code) {
    const display = num.startsWith('+') ? num : `${countryObj.isd_code} ${num}`
    return { display, countryName: countryObj.country_name }
  }
  const detected = getCountryFromContact(num)
  if (detected) {
    const display = num.startsWith('+') ? num : `${detected.prefix} ${num}`
    return { display, countryName: detected.name }
  }
  return { display: num || '-', countryName: null }
}
