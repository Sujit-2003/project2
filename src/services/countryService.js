import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

let cachedCountries = null

export async function getCountries() {
  if (cachedCountries) return cachedCountries
  try {
    const response = await fetch(`${API_URL}/masterdata`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    const res = await safeJson(response)
    if (Number(res.code) === 0 && res.data) {
      // Backend may return countries as array or inside a field
      const data = res.data
      let countries = []
      if (Array.isArray(data)) {
        countries = data
      } else if (Array.isArray(data.countries)) {
        countries = data.countries
      } else if (Array.isArray(data.country)) {
        countries = data.country
      }
      if (countries.length > 0) {
        cachedCountries = countries
        return countries
      }
    }
  } catch {
    // Backend not ready — return empty
  }
  return []
}
