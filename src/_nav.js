import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilPeople,
  cilChildFriendly,
  cilPlus,
  cilDrop,
  cilPencil,
  cilPuzzle,
  cilChartPie,
  cilNotes,
  cilBell,
  cilCalculator,
} from '@coreui/icons'
import { CNavItem, CNavGroup, CNavTitle } from '@coreui/react'

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
    component: CNavTitle,
    name: 'Theme',
  },
  {
    component: CNavItem,
    name: 'Colors',
    to: '/theme/colors',
    icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Typography',
    to: '/theme/typography',
    icon: <CIcon icon={cilPencil} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Components',
  },
  {
    component: CNavGroup,
    name: 'Base',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [
      { component: CNavItem, name: 'Cards', to: '/base/cards' },
      { component: CNavItem, name: 'Tables', to: '/base/tables' },
    ],
  },
  {
    component: CNavItem,
    name: 'Charts',
    to: '/charts',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Forms',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    items: [
      { component: CNavItem, name: 'Form Control', to: '/forms/form-control' },
      { component: CNavItem, name: 'Select', to: '/forms/select' },
    ],
  },
  {
    component: CNavItem,
    name: 'Modals',
    to: '/notifications/modals',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Widgets',
    to: '/widgets',
    icon: <CIcon icon={cilCalculator} customClassName="nav-icon" />,
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
