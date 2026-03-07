import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

export async function getAllFaqs() {
  const response = await fetch(`${API_URL}/faqs`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

export async function getFaqById(id) {
  const response = await fetch(`${API_URL}/faqs/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return safeJson(response)
}

export async function createFaq({ question, response: faqResponse }) {
  const res = await fetch(`${API_URL}/faqs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ question, response: faqResponse }),
  })
  return safeJson(res)
}

export async function updateFaq(id, { question, response: faqResponse }) {
  const res = await fetch(`${API_URL}/faqs/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ question, response: faqResponse }),
  })
  return safeJson(res)
}
