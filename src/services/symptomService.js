import environment from '../config/environment'
import { getAuthHeaders } from './authService'

const API_URL = environment.apiBaseUrl

export async function getSymptoms() {
  const response = await fetch(`${API_URL}/get-symptoms`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return response.json()
}

export async function addSymptom({ symptom_name, severity_level, description }) {
  const response = await fetch(`${API_URL}/add-symptom`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ symptom_name, severity_level, description }),
  })
  return response.json()
}
