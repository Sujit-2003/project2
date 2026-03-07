import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

export async function getMasterData() {
  const response = await fetch(`${API_URL}/masterdata`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

export async function getMasterDataById(id) {
  const response = await fetch(`${API_URL}/masterdata/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

export async function updateMasterData(data) {
  const response = await fetch(`${API_URL}/masterdata`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return safeJson(response)
}
