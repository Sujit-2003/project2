import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

export async function getReminders(userId, roleId) {
  const response = await fetch(`${API_URL}/reminders/${userId}/${roleId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}
