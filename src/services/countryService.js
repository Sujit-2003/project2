import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

let cachedCountries = null

export async function getCountries() {
  if (cachedCountries) return cachedCountries
  try {
    const response = await fetch(`${API_URL}/get-countries`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    const res = await safeJson(response)
    if (Number(res.code) === 0 && Array.isArray(res.data) && res.data.length > 0) {
      cachedCountries = res.data
      return res.data
    }
  } catch {
    // Backend not ready — return empty
  }
  return []
}

export function getCountryByIdFromList(countries, countryId) {
  if (!countryId || !countries.length) return null
  return countries.find((c) => Number(c.country_id) === Number(countryId)) || null
}
