import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

// ─── Templates ───
// GET /api/template — list all
// POST /api/template — { template_name, template_desc, key_words, no_of_questions }

export async function getTemplates() {
  const response = await fetch(`${API_URL}/template`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

export async function addTemplate({ template_name, template_desc, key_words, no_of_questions }) {
  const response = await fetch(`${API_URL}/template`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ template_name, template_desc, key_words, no_of_questions }),
  })
  return safeJson(response)
}

// PUT /api/template/{template_id} — { template_name, template_desc, key_words, no_of_questions }
export async function updateTemplate({ template_id, template_name, template_desc, key_words, no_of_questions }) {
  const response = await fetch(`${API_URL}/template/${template_id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ template_name, template_desc, key_words, no_of_questions }),
  })
  return safeJson(response)
}

// No dedicated GET /api/template/:id — find from list
export async function getTemplateById(templateId) {
  const res = await getTemplates()
  if (Number(res.code) === 0 && Array.isArray(res.data)) {
    const found = res.data.find((t) => String(t.id) === String(templateId))
    return { code: found ? 0 : 1, data: found || null, message: found ? 'Success' : 'Template not found' }
  }
  return res
}

// ─── Questions ───
// GET /api/question/{template_id}           — list questions for a template
// POST /api/question                        — { question, description, template_id } (create)
// PUT  /api/question/{question_id}          — { question, description, template_id } (update)

export async function getQuestions(templateId) {
  const response = await fetch(`${API_URL}/question/${templateId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

export async function addQuestion({ question, description, template_id }) {
  const response = await fetch(`${API_URL}/question`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ question, description, template_id }),
  })
  return safeJson(response)
}

export async function updateQuestion({ question_id, question, description, template_id }) {
  const response = await fetch(`${API_URL}/question/${question_id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ question, description, template_id }),
  })
  return safeJson(response)
}

// ─── Question Options ───
// POST /api/question/options                  — { q_id, options: [{ opt_text, opt_hint, opt_weightge }] }
// PUT  /api/question/options/{option_id}      — { opt_text, opt_hint, opt_weightge }
// GET  /api/question/{q_id}/options           — list options for a question

export async function addQuestionOptions({ q_id, options }) {
  const response = await fetch(`${API_URL}/question/options`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      q_id,
      options: options.map((o) => ({
        opt_text: o.opt_text,
        opt_hint: o.opt_hint,
        opt_weightge: Number(o.opt_weightge) || 0,
      })),
    }),
  })
  return safeJson(response)
}

export async function updateQuestionOption({ option_id, opt_text, opt_hint, opt_weightge }) {
  const response = await fetch(`${API_URL}/question/options/${option_id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      opt_text,
      opt_hint,
      opt_weightge: Number(opt_weightge) || 0,
    }),
  })
  return safeJson(response)
}

export async function getQuestionOptions(q_id) {
  const response = await fetch(`${API_URL}/question/${q_id}/options`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}
