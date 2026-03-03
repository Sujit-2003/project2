import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CSpinner,
  CAlert,
  CBadge,
  CFormInput,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { getSymptoms } from '../../services/symptomService'
import useTableControls from '../../hooks/useTableControls'

const severityColor = {
  Mild: 'success',
  Moderate: 'warning',
  Severe: 'danger',
}

const Symptoms = () => {
  const navigate = useNavigate()
  const [symptoms, setSymptoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const {
    paginatedData,
    currentPage,
    totalPages,
    searchTerm,
    setCurrentPage,
    setSearchTerm,
  } = useTableControls(symptoms, ['symptom_name', 'severity_level', 'description'])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSymptoms()
        let data = []
        if (Array.isArray(res)) data = res
        else if (Array.isArray(res.data)) data = res.data
        setSymptoms(data)
      } catch {
        setError('Network error loading symptoms.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Symptoms</strong>
            <CButton color="primary" size="sm" onClick={() => navigate('/symptoms/add')}>
              <CIcon icon={cilPlus} className="me-1" />
              Add Symptom
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CFormInput
              type="text"
              placeholder="Search symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
              style={{ maxWidth: '300px' }}
            />

            {loading && (
              <div className="text-center py-4">
                <CSpinner color="primary" />
              </div>
            )}
            {error && <CAlert color="danger">{error}</CAlert>}
            {!loading && !error && (
              <>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>#</CTableHeaderCell>
                      <CTableHeaderCell>Symptom Name</CTableHeaderCell>
                      <CTableHeaderCell>Severity Level</CTableHeaderCell>
                      <CTableHeaderCell>Description</CTableHeaderCell>
                      <CTableHeaderCell>Created Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginatedData.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={5} className="text-center text-muted">
                          No symptoms found.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      paginatedData.map((s, index) => (
                        <CTableRow key={s.id || index}>
                          <CTableDataCell>{(currentPage - 1) * 10 + index + 1}</CTableDataCell>
                          <CTableDataCell>{s.symptom_name || '-'}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={severityColor[s.severity_level] || 'secondary'}>
                              {s.severity_level || '-'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>{s.description || '-'}</CTableDataCell>
                          <CTableDataCell>{s.cdate || s.created_date || '-'}</CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>

                {totalPages > 1 && (
                  <CPagination className="justify-content-center">
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </CPaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <CPaginationItem
                        key={i + 1}
                        active={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </CPaginationItem>
                  </CPagination>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Symptoms
