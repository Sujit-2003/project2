import environment from '../config/environment'
import { getAuthHeaders } from './authService'

const API_URL = environment.apiBaseUrl

export async function getMasterData() {
  const response = await fetch(`${API_URL}/masterdata`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return response.json()
}
