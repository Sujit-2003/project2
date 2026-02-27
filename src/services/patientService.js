import environment from '../config/environment'
import { getAuthHeaders } from './authService'

const API_URL = environment.apiBaseUrl

export async function addPatient(patientData) {
  const response = await fetch(`${API_URL}/add-patient`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(patientData),
  })
  return response.json()
}

export async function getPatients(umId) {
  const response = await fetch(`${API_URL}/patients/${umId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return response.json()
}
