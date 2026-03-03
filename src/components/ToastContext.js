import React, { createContext, useContext, useState, useCallback } from 'react'
import { CToast, CToastBody, CToastClose, CToaster, CToastHeader } from '@coreui/react'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ title, message, color = 'primary' }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, title, message, color }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const showSuccess = useCallback(
    (message) => addToast({ title: 'Success', message, color: 'success' }),
    [addToast],
  )
  const showError = useCallback(
    (message) => addToast({ title: 'Error', message, color: 'danger' }),
    [addToast],
  )
  const showWarning = useCallback(
    (message) => addToast({ title: 'Warning', message, color: 'warning' }),
    [addToast],
  )
  const showInfo = useCallback(
    (message) => addToast({ title: 'Info', message, color: 'info' }),
    [addToast],
  )

  return (
    <ToastContext.Provider value={{ addToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <CToaster
        placement="top-end"
        className="position-fixed p-3"
        style={{ zIndex: 9999 }}
      >
        {toasts.map((toast) => (
          <CToast key={toast.id} visible={true} color={toast.color} className="text-white">
            <CToastHeader closeButton>
              <strong className="me-auto">{toast.title}</strong>
            </CToastHeader>
            <CToastBody>{toast.message}</CToastBody>
          </CToast>
        ))}
      </CToaster>
    </ToastContext.Provider>
  )
}
