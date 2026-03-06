import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

export async function addActivity({ patient_id, actity_name, actity_type, actity_datetime, actity_desc, days_flag }) {
  const response = await fetch(`${API_URL}/activity`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      patient_id,
      actity_name,
      actity_type,
      actity_datetime,
      actity_desc,
      days_flag,
    }),
  })
  return safeJson(response)
}

export async function getActivities(patientId) {
  const response = await fetch(`${API_URL}/activity/${patientId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

export async function updateActivity(activityId, { actity_name, actity_type, actity_datetime, actity_desc, days_flag }) {
  const response = await fetch(`${API_URL}/activity/${activityId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      actity_name,
      actity_type,
      actity_datetime,
      actity_desc,
      days_flag,
    }),
  })
  return safeJson(response)
}

export async function deleteActivity(activityId) {
  const response = await fetch(`${API_URL}/activity/${activityId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}
