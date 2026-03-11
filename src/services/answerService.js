/**
 * Answer Service — stores questionnaire answers locally
 *
 * Backend does not yet have an answer submission endpoint.
 * Answers are stored in localStorage keyed by patient_id.
 * When the backend adds an endpoint, replace localStorage calls
 * with fetch() calls to the API.
 */

const STORAGE_KEY = 'suji_template_answers'

function getAllAnswers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveAllAnswers(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Submit answers for a patient's template
 * @param {number} patientId
 * @param {number} templateId
 * @param {Array} answers — [{ question_id, question, answer }]
 */
export function submitAnswers(patientId, templateId, answers) {
  const all = getAllAnswers()
  all[patientId] = {
    template_id: templateId,
    answers,
    submitted_at: new Date().toISOString(),
    status: 'submitted',
  }
  saveAllAnswers(all)
  return { code: 0, message: 'Answers submitted successfully' }
}

/**
 * Get submitted answers for a patient
 * @param {number} patientId
 * @returns {{ template_id, answers, submitted_at, status } | null}
 */
export function getAnswers(patientId) {
  const all = getAllAnswers()
  return all[patientId] || null
}

/**
 * Check if answers have been submitted for a patient
 * @param {number} patientId
 * @returns {boolean}
 */
export function hasSubmittedAnswers(patientId) {
  const data = getAnswers(patientId)
  return !!(data && data.status === 'submitted')
}

/**
 * Clear answers for a patient (e.g., when re-filling)
 */
export function clearAnswers(patientId) {
  const all = getAllAnswers()
  delete all[patientId]
  saveAllAnswers(all)
}
