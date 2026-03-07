import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilPeople,
  cilChildFriendly,
  cilChartPie,
  cilMedicalCross,
  cilUserFollow,
  cilNotes,
  cilCommentSquare,
  cilSettings,
} from '@coreui/icons'
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
  {
    component: CNavItem,
    name: 'Patients',
    to: '/patients',
    icon: <CIcon icon={cilChildFriendly} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Doctors',
    to: '/doctors',
    icon: <CIcon icon={cilUserFollow} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Symptoms',
    to: '/symptoms',
    icon: <CIcon icon={cilMedicalCross} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Charts',
    to: '/charts',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Settings',
  },
  {
    component: CNavItem,
    name: 'Master Data',
    to: '/masterdata',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'FAQs',
    to: '/faqs',
    icon: <CIcon icon={cilCommentSquare} customClassName="nav-icon" />,
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
    name: 'Management',
  },
  {
    component: CNavItem,
    name: 'Patients',
    to: '/patients',
    icon: <CIcon icon={cilChildFriendly} customClassName="nav-icon" />,
  },
]

export function getNavItemsByRole(roleId) {
  if (Number(roleId) === 2) return adminNav
  return parentNav
}

export default adminNav
