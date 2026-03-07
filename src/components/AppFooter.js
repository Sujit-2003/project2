import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span className="text-body-secondary">&copy; {new Date().getFullYear()} SUJI</span>
      </div>
      <div className="ms-auto">
        <span className="text-body-secondary">Healthcare Management Platform</span>
      </div>
    </CFooter>
  )
}

export default AppFooter
