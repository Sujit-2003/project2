import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

// GET /api/patient/{patient_id}/profile — Get patient profile (doctor, template, analysis)
export async function getPatientProfile(patientId) {
  const response = await fetch(`${API_URL}/patient/${patientId}/profile`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

// GET /api/doctor/{doctor_id}/patients — Get all patients assigned to a doctor
export async function getDoctorPatients(doctorId) {
  const response = await fetch(`${API_URL}/doctor/${doctorId}/patients`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

// POST /api/patient-profile — Assign doctor to patient
export async function assignDoctorToPatient({ doctor_id, patient_id }) {
  const response = await fetch(`${API_URL}/patient-profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ doctor_id, patient_id }),
  })
  return safeJson(response)
}

// PUT /api/patient-profile/{profile_id}/template — Assign template to patient
export async function assignTemplateToPatient({ profile_id, template_id }) {
  const response = await fetch(`${API_URL}/patient-profile/${profile_id}/template`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ template_id }),
  })
  return safeJson(response)
}

// PUT /api/patient-profile/{profile_id}/analysis — Doctor review (summary + precautions)
export async function submitDoctorReview({ profile_id, health_analysis, prescription_summary }) {
  const response = await fetch(`${API_URL}/patient-profile/${profile_id}/analysis`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ health_analysis, prescription_summary }),
  })
  return safeJson(response)
}
