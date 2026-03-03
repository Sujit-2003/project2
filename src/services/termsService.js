import environment from '../config/environment'
import { getAuthHeaders } from './authService'

const API_URL = environment.apiBaseUrl

export async function getTermsAndConditions() {
  try {
    const response = await fetch(`${API_URL}/terms-and-conditions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    const text = await response.text()
    let res
    try {
      res = JSON.parse(text)
    } catch {
      throw new Error('Non-JSON response')
    }
    if (Number(res.code) === 0 && res.data) {
      return res.data
    }
    // Fallback if API not ready yet
    return {
      title: 'Terms and Conditions',
      content:
        'Welcome to our Health Platform.\n\n' +
        '1. Acceptance of Terms\nBy accessing and using this platform, you accept and agree to be bound by the terms and provisions of this agreement.\n\n' +
        '2. Privacy Policy\nYour personal data will be collected and processed in accordance with our Privacy Policy. We are committed to protecting your health information.\n\n' +
        '3. User Responsibilities\nYou are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.\n\n' +
        '4. Health Information\nThe information provided on this platform is for informational purposes only and is not a substitute for professional medical advice.\n\n' +
        '5. Data Protection\nWe implement appropriate security measures to protect your personal and health data against unauthorized access.\n\n' +
        '6. Modifications\nWe reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.\n\n' +
        '7. Contact\nFor any questions regarding these terms, please contact the platform administrator.',
    }
  } catch {
    // Return fallback terms if API call fails
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
}
