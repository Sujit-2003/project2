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
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { adminLogin, storeSession } from '../../../services/authService'
import { encrypt } from '../../../services/encryptionService'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tryLogin = async (emailid, pwd) => {
    const res = await adminLogin({ emailid, password: pwd })
    if (Number(res.code) === 0 && res.data) return res
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter email and password.')
      return
    }

    setLoading(true)
    try {
      // Try encrypted password first (registered users), then plain (legacy admin)
      let res = await tryLogin(email, encrypt(password))
      if (!res) {
        res = await tryLogin(email, password)
      }

      if (res && res.data) {
        const userId = Number(res.data.user_id ?? res.data.userId ?? res.data.id)
        // Admin is user_id 1, all others are parents (role 2)
        const effectiveRole = userId === 1 ? 1 : 2
        storeSession(res.data, email, effectiveRole)

        if (effectiveRole === 1) {
          navigate('/dashboard')
        } else {
          navigate('/patients')
        }
      } else {
        setError('Invalid email or password.')
      }
    } catch {
      setError('Network error. Please try again.')
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
                    {error && <CAlert color="danger">{error}</CAlert>}
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
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
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
    </div>
  )
}

export default Login
