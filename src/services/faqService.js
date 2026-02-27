import environment from '../config/environment'
import { getAuthHeaders } from './authService'

const API_URL = environment.apiBaseUrl

export async function getAllFaqs() {
  const response = await fetch(`${API_URL}/faqs`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return response.json()
}
