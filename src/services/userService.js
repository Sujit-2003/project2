import environment from '../config/environment'
import { getAuthHeaders, getAdminId, safeJson } from './authService'
import { encrypt, encryptEmail } from './encryptionService'

const API_URL = environment.apiBaseUrl

export async function registerUser({ name, emailId, contactNumber, password, countryid }) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      username: encrypt(name),
      emailid: encryptEmail(emailId),
      upassword: encrypt(password),
      cnumber: encrypt(contactNumber),
      roleid: 1,
      countryid: countryid || 1,
      createdby: getAdminId(),
    }),
  })
  return safeJson(response)
}

export async function getUsers(roleId) {
  const response = await fetch(`${API_URL}/users/role/${roleId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}
