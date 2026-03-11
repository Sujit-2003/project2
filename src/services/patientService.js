import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'
import { getPatientProfile } from './patientProfileService'
import { decryptField } from './encryptionService'
import { getTemplates } from './questionnaireService'
import { hasSubmittedAnswers } from './answerService'

// Shared template map cache (refreshed per page load)
let _templateMap = null
export async function getTemplateMap() {
  if (_templateMap) return _templateMap
  try {
    const res = await getTemplates()
    if (Number(res.code) === 0 && Array.isArray(res.data)) {
      _templateMap = {}
      res.data.forEach((t) => { _templateMap[t.id] = t.template_name })
      return _templateMap
    }
  } catch { /* ignore */ }
  return {}
}

// Reset cache (call on page load)
export function resetTemplateMapCache() {
  _templateMap = null
}

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

// Fetch profile data for a single patient and merge it
async function enrichWithProfile(patient) {
  try {
    const profileRes = await getPatientProfile(patient.id)
    if (Number(profileRes.code) === 0 && profileRes.data) {
      const p = profileRes.data
      const tMap = await getTemplateMap()
      // Derive template_status: backend doesn't return it
      let templateStatus = null
      if (p.template_id) {
        if (p.health_analysis || p.prescription_summary) {
          templateStatus = 'reviewed'
        } else if (hasSubmittedAnswers(patient.id)) {
          templateStatus = 'submitted'
        } else {
          templateStatus = 'pending'
        }
      }
      return {
        ...patient,
        profile_id: p.profile_id || p.id || null,
        doctor_id: p.doctor_id || null,
        doctor_name: p.doctor_name ? decryptField(p.doctor_name) : null,
        template_id: p.template_id || null,
        template_name: p.template_name || tMap[p.template_id] || null,
        template_status: templateStatus,
        health_analysis: p.health_analysis || null,
        prescription_summary: p.prescription_summary || null,
      }
    }
  } catch {
    // Profile not found — patient has no doctor assigned yet
  }
  return patient
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

  // Enrich all patients with profile data (doctor, template, analysis)
  const enriched = await Promise.all(all.map(enrichWithProfile))
  return enriched
}
