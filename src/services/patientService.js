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

export async function getAllPatientsWithParent(users) {
  const results = await Promise.all(
    users.map((u) => getPatients(u.id)),
  )
  const all = []
  for (let i = 0; i < results.length; i++) {
    const res = results[i]
    if (Number(res.code) === 0 && Array.isArray(res.data)) {
      for (const p of res.data) {
        all.push({ ...p, _parent: users[i] })
      }
    }
  }
  return all
}
