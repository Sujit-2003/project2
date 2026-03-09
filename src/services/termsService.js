import environment from '../config/environment'
import { getAuthHeaders, safeJson } from './authService'

const API_URL = environment.apiBaseUrl

export async function getTermsAndConditions() {
  try {
    const response = await fetch(`${API_URL}/masterdata`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    const res = await safeJson(response)
    if (Number(res.code) === 0 && res.data && res.data.terms) {
      return {
        title: 'Terms and Conditions',
        content: res.data.terms,
      }
    }
    return fallbackTerms()
  } catch {
    return fallbackTerms()
  }
}

function fallbackTerms() {
  return {
    title: 'Terms and Conditions',
    content:
      'Welcome to our Health Platform.\n\n' +
      '1. By using this platform, you agree to our terms of service.\n' +
      '2. Your personal and health data will be handled securely.\n' +
      '3. You are responsible for the accuracy of information you provide.\n' +
      '4. This platform is not a substitute for professional medical advice.\n' +
      '5. We reserve the right to modify these terms at any time.',
  }
}
