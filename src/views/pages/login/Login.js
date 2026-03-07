import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { adminLogin, storeSession } from '../../../services/authService'
import { encrypt, encryptEmail } from '../../../services/encryptionService'
import { useToast } from '../../../components/ToastContext'

const Login = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const tryLogin = async (emailid, pwd) => {
    const res = await adminLogin({ emailid, password: pwd })
    if (Number(res.code) === 0 && res.data) return res
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      showWarning('Please enter email and password.')
      return
    }

    if (!email.includes('@')) {
      showWarning('Please enter a valid email address.')
      return
    }

    setLoading(true)
    showInfo('Authenticating...')
    try {
      // Try plain email+password first, then encrypted fallback
      let res = await tryLogin(email.toLowerCase(), password)
      if (!res) {
        const encEmail = encryptEmail(email)
        res = await tryLogin(encEmail, encrypt(password))
      }

      if (res && res.data) {
        // Backend now returns correct roleid: 2=admin, 1=user
        const roleId = Number(res.data.roleid ?? res.data.roleId ?? res.data.role_id ?? 1)

        storeSession(res.data, email.toLowerCase(), roleId)
        showSuccess('Login successful! Redirecting to dashboard...')
        setTimeout(() => navigate('/dashboard'), 500)
      } else {
        showError('Invalid email or password.')
      }
    } catch {
      showError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={5} lg={4}>
            <div className="text-center mb-4">
              <h2 className="fw-bold" style={{ color: '#fff', letterSpacing: '-0.02em' }}>SUJI</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Healthcare Management Platform</p>
            </div>
            <CCard
              className="border-0"
              style={{
                borderRadius: 'var(--suji-radius-xl)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              }}
            >
              <CCardBody className="p-4 p-md-5">
                <CForm onSubmit={handleSubmit}>
                  <h5 className="mb-1 fw-bold">Welcome back</h5>
                  <p className="text-body-secondary mb-4" style={{ fontSize: '0.875rem' }}>
                    Sign in to your account
                  </p>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <CInputGroupText
                      role="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: 'pointer' }}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </CInputGroupText>
                  </CInputGroup>
                  <CButton
                    color="primary"
                    type="submit"
                    disabled={loading}
                    className="w-100 py-2"
                    style={{ fontWeight: 600 }}
                  >
                    {loading ? <CSpinner size="sm" /> : 'Sign In'}
                  </CButton>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
