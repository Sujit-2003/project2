import environment from '../config/environment'
import { getAuthHeaders } from './authService'
import { encrypt } from './encryptionService'

const API_URL = environment.apiBaseUrl

export async function registerUser({ name, emailId, contactNumber, password, createdby }) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      username: name,
      emailid: emailId,
      upassword: encrypt(password),
      cnumber: contactNumber,
      roleId: 2,
      createdby: createdby,
    }),
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
