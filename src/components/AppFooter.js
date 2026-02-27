import React, { useState } from 'react'
import {
  CFooter,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CButton,
  CSpinner,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CAlert,
} from '@coreui/react'
import { getMasterData } from '../services/masterdataService'
import { getAllFaqs } from '../services/faqService'

const AppFooter = () => {
  const [aboutVisible, setAboutVisible] = useState(false)
  const [faqVisible, setFaqVisible] = useState(false)
  const [masterData, setMasterData] = useState(null)
  const [faqs, setFaqs] = useState([])
  const [aboutLoading, setAboutLoading] = useState(false)
  const [faqLoading, setFaqLoading] = useState(false)
  const [aboutError, setAboutError] = useState('')
  const [faqError, setFaqError] = useState('')

  const openAbout = async () => {
    setAboutVisible(true)
    setAboutLoading(true)
    setAboutError('')
    try {
      const res = await getMasterData()
      if (Number(res.code) === 0 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data
        setMasterData(data)
      } else if (res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data
        setMasterData(data)
      } else {
        setAboutError(res.message || 'Failed to load data.')
      }
    } catch {
      setAboutError('Network error loading data.')
    } finally {
      setAboutLoading(false)
    }
  }

  const openFaqs = async () => {
    setFaqVisible(true)
    setFaqLoading(true)
    setFaqError('')
    try {
      const res = await getAllFaqs()
      if (Number(res.code) === 0) {
        setFaqs(Array.isArray(res.data) ? res.data : [])
      } else if (Array.isArray(res.data)) {
        setFaqs(res.data)
      } else if (Array.isArray(res)) {
        setFaqs(res)
      } else {
        setFaqError(res.message || 'Failed to load FAQs.')
      }
    } catch {
      setFaqError('Network error loading FAQs.')
    } finally {
      setFaqLoading(false)
    }
  }

  return (
    <>
      <CFooter className="px-4">
        <div>
          <CButton color="link" className="px-0" onClick={openAbout}>
            About Us
          </CButton>
        </div>
        <div className="ms-auto">
          <CButton color="link" className="px-0" onClick={openFaqs}>
            FAQs
          </CButton>
        </div>
      </CFooter>

      <CModal size="lg" visible={aboutVisible} onClose={() => setAboutVisible(false)}>
        <CModalHeader>
          <CModalTitle>About Us</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {aboutLoading && (
            <div className="text-center py-4">
              <CSpinner color="primary" />
            </div>
          )}
          {aboutError && <CAlert color="danger">{aboutError}</CAlert>}
          {masterData && !aboutLoading && (
            <div>
              <h5>{masterData.companyname}</h5>
              <div dangerouslySetInnerHTML={{ __html: masterData.about }} />
              <hr />
              <p>
                <strong>Contact:</strong> {masterData.contactnumber}
              </p>
              <p>
                <strong>Email:</strong> {masterData.emailid}
              </p>
            </div>
          )}
        </CModalBody>
      </CModal>

      <CModal size="lg" visible={faqVisible} onClose={() => setFaqVisible(false)}>
        <CModalHeader>
          <CModalTitle>FAQs</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {faqLoading && (
            <div className="text-center py-4">
              <CSpinner color="primary" />
            </div>
          )}
          {faqError && <CAlert color="danger">{faqError}</CAlert>}
          {!faqLoading && faqs.length > 0 && (
            <CAccordion>
              {faqs.map((faq, index) => (
                <CAccordionItem key={faq.id || index} itemKey={index + 1}>
                  <CAccordionHeader>{faq.question}</CAccordionHeader>
                  <CAccordionBody>
                    <div dangerouslySetInnerHTML={{ __html: faq.response }} />
                  </CAccordionBody>
                </CAccordionItem>
              ))}
            </CAccordion>
          )}
          {!faqLoading && !faqError && faqs.length === 0 && (
            <p className="text-muted">No FAQs available.</p>
          )}
        </CModalBody>
      </CModal>
    </>
  )
}

export default AppFooter
