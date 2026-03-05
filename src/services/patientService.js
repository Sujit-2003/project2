import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

export async function addPatient(patientData) {
  const response = await fetch(`${API_URL}/patients`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(patientData),
  })
  return safeJson(response)
}

export async function getPatients(umId) {
  const response = await fetch(`${API_URL}/patients/${umId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

export async function getAllPatients(userIds) {
  const results = await Promise.all(
    userIds.map((id) => getPatients(id)),
  )
  const all = []
  for (const res of results) {
    if (Number(res.code) === 0 && Array.isArray(res.data)) {
      all.push(...res.data)
    }
  }
  return all
}
