import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
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
  const [showUnauthorized, setShowUnauthorized] = useState(false)

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
      const encEmail = encryptEmail(email)
      // Try encrypted email+password first (registered users), then plain (legacy admin)
      let res = await tryLogin(encEmail, encrypt(password))
      if (!res) {
        res = await tryLogin(email.toLowerCase(), password)
      }

      if (res && res.data) {
        // Backend now returns correct roleid: 2=admin, 1=user
        const roleId = Number(res.data.roleid ?? res.data.roleId ?? res.data.role_id ?? 1)

        // Only admin (role 2) is allowed to login
        if (roleId !== 2) {
          console.log('Unauthorized access')
          showError('Unauthorized access')
          setShowUnauthorized(true)
          return
        }

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
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6} lg={5}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>
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
                    <CRow>
                      <CCol xs={6}>
                        <CButton color="primary" className="px-4" type="submit" disabled={loading}>
                          {loading ? <CSpinner size="sm" /> : 'Login'}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>

      {/* Unauthorized Access Modal */}
      <CModal visible={showUnauthorized} onClose={() => setShowUnauthorized(false)} backdrop="static">
        <CModalHeader closeButton={false}>
          <CModalTitle>Unauthorized Access</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-0">
            You do not have admin privileges. Only administrators are allowed to login to this panel.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="danger" onClick={() => setShowUnauthorized(false)}>
            OK
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Login
