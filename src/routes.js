import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Users = React.lazy(() => import('./views/users/Users'))
const Patients = React.lazy(() => import('./views/patients/Patients'))
const AddPatient = React.lazy(() => import('./views/patients/AddPatient'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/users', name: 'Users', element: Users },
  { path: '/patients', name: 'Patients', element: Patients, exact: true },
  { path: '/patients/add', name: 'Add Patient', element: AddPatient },
]

export default routes
