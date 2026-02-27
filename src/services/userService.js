import environment from '../config/environment'
import { getAuthHeaders } from './authService'

const API_URL = environment.apiBaseUrl

export async function registerUser({ username, emailid, upassword, cnumber }) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, emailid, upassword, cnumber }),
  })
  return response.json()
}

export async function getUsers(roleId) {
  const response = await fetch(`${API_URL}/login/${roleId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return response.json()
}
