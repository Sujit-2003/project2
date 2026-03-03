import React, { Suspense, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  CContainer,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
} from '@coreui/react'
import { getRoleId } from '../services/authService'

import routes from '../routes'

const AdminGuard = ({ children }) => {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(true)

  const handleClose = () => {
    setShowModal(false)
    navigate('/patients')
  }

  return (
    <>
      <CModal visible={showModal} onClose={handleClose}>
        <CModalHeader>
          <CModalTitle>Unauthorized Access</CModalTitle>
        </CModalHeader>
        <CModalBody>
          You do not have permission to access this page. Redirecting to your dashboard.
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={handleClose}>
            OK
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

const AppContent = () => {
  const roleId = getRoleId()

  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {routes.map((route, idx) => {
            if (!route.element) return null

            if (route.adminOnly && roleId !== 2) {
              return (
                <Route
                  key={idx}
                  path={route.path}
                  element={<AdminGuard />}
                />
              )
            }

            return (
              <Route
                key={idx}
                path={route.path}
                exact={route.exact}
                name={route.name}
                element={<route.element />}
              />
            )
          })}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
