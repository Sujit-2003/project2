import environment from '../config/environment'

const API_URL = environment.apiBaseUrl

export function getAuthHeaders() {
  const token = sessionStorage.getItem('authToken') || environment.authToken
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function adminLogin({ emailid, password }) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailid, password }),
  })
  return response.json()
}

export function storeSession(data, emailId) {
  sessionStorage.setItem('adminId', data.user_id)
  sessionStorage.setItem('um_id', data.user_id)
  sessionStorage.setItem('roleId', data.roleid)
  sessionStorage.setItem('adminEmail', emailId)
  if (data.token) {
    sessionStorage.setItem('authToken', data.token)
  }
}

export function isLoggedIn() {
  return !!sessionStorage.getItem('adminId')
}

export function getRoleId() {
  return Number(sessionStorage.getItem('roleId'))
}

export function getUmId() {
  return Number(sessionStorage.getItem('um_id') || sessionStorage.getItem('adminId'))
}

export function getAdminEmail() {
  return sessionStorage.getItem('adminEmail') || ''
}

export function logout() {
  sessionStorage.clear()
}
