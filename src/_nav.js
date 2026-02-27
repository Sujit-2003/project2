import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilPeople, cilChildFriendly, cilPlus } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const adminNav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Management',
  },
  {
    component: CNavItem,
    name: 'Users',
    to: '/users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
]

const parentNav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Patient Management',
  },
  {
    component: CNavItem,
    name: 'Add Patient',
    to: '/patients/add',
    icon: <CIcon icon={cilPlus} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Patient Details',
    to: '/patients',
    icon: <CIcon icon={cilChildFriendly} customClassName="nav-icon" />,
  },
]

export function getNavItemsByRole(roleId) {
  if (Number(roleId) === 1) return adminNav
  return parentNav
}

export default adminNav
