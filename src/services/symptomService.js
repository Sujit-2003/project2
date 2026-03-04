import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

export async function getSymptoms() {
  const response = await fetch(`${API_URL}/get-symptoms`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

function getISTDateTime() {
  const ist = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000))
  const y = ist.getUTCFullYear()
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0')
  const d = String(ist.getUTCDate()).padStart(2, '0')
  const h = String(ist.getUTCHours()).padStart(2, '0')
  const min = String(ist.getUTCMinutes()).padStart(2, '0')
  const s = String(ist.getUTCSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

export async function addSymptom({ symptom_name, severity_level, description }) {
  const created_at = getISTDateTime()
  const response = await fetch(`${API_URL}/add-symptom`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ symptom_name, severity_level, description, created_at }),
  })
  return safeJson(response)
}
