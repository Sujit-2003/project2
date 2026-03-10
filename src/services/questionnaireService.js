import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

// ─── Templates ───

export async function getTemplates() {
  try {
    const response = await fetch(`${API_URL}/questionnaire-templates`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    return safeJson(response)
  } catch {
    // Fallback to localStorage if API not ready
    const stored = JSON.parse(localStorage.getItem('suji_templates') || '[]')
    return { code: 0, data: stored, message: 'Success (local)' }
  }
}

export async function addTemplate(data) {
  try {
    const response = await fetch(`${API_URL}/questionnaire-templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return safeJson(response)
  } catch {
    // Fallback: store locally
    const stored = JSON.parse(localStorage.getItem('suji_templates') || '[]')
    const newTemplate = {
      ...data,
      id: Date.now(),
      cdate: new Date().toISOString().split('T')[0],
    }
    stored.push(newTemplate)
    localStorage.setItem('suji_templates', JSON.stringify(stored))
    return { code: 0, data: newTemplate, message: 'Template created (local)' }
  }
}

export async function getTemplateById(templateId) {
  try {
    const response = await fetch(`${API_URL}/questionnaire-templates/${templateId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    return safeJson(response)
  } catch {
    const stored = JSON.parse(localStorage.getItem('suji_templates') || '[]')
    const found = stored.find((t) => String(t.id) === String(templateId))
    return { code: found ? 0 : 1, data: found || null, message: found ? 'Success (local)' : 'Not found' }
  }
}

// ─── Questions ───

export async function getQuestions(templateId) {
  try {
    const response = await fetch(`${API_URL}/questionnaire-master/${templateId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    return safeJson(response)
  } catch {
    const stored = JSON.parse(localStorage.getItem('suji_questions') || '[]')
    const filtered = stored.filter((q) => String(q.template_id) === String(templateId))
    return { code: 0, data: filtered, message: 'Success (local)' }
  }
}

export async function addQuestion(data) {
  try {
    const response = await fetch(`${API_URL}/questionnaire-master`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return safeJson(response)
  } catch {
    const stored = JSON.parse(localStorage.getItem('suji_questions') || '[]')
    const newQuestion = { ...data, id: Date.now() }
    stored.push(newQuestion)
    localStorage.setItem('suji_questions', JSON.stringify(stored))
    return { code: 0, data: newQuestion, message: 'Question created (local)' }
  }
}

export async function updateQuestion(questionId, data) {
  try {
    const response = await fetch(`${API_URL}/questionnaire-master/${questionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return safeJson(response)
  } catch {
    const stored = JSON.parse(localStorage.getItem('suji_questions') || '[]')
    const idx = stored.findIndex((q) => String(q.id) === String(questionId))
    if (idx >= 0) {
      stored[idx] = { ...stored[idx], ...data }
      localStorage.setItem('suji_questions', JSON.stringify(stored))
      return { code: 0, data: stored[idx], message: 'Question updated (local)' }
    }
    return { code: 1, message: 'Question not found' }
  }
}
