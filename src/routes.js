import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Users = React.lazy(() => import('./views/users/Users'))
const RegisterUser = React.lazy(() => import('./views/users/RegisterUser'))
const UserDetails = React.lazy(() => import('./views/users/UserDetails'))
const AddPatientForUser = React.lazy(() => import('./views/users/AddPatientForUser'))
const Patients = React.lazy(() => import('./views/patients/Patients'))
const PatientDetails = React.lazy(() => import('./views/patients/PatientDetails'))
const AddPatient = React.lazy(() => import('./views/patients/AddPatient'))
const Symptoms = React.lazy(() => import('./views/symptoms/Symptoms'))
const AddSymptom = React.lazy(() => import('./views/symptoms/AddSymptom'))
const ChangePassword = React.lazy(() => import('./views/pages/ChangePassword'))

// Demo views
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))
const Cards = React.lazy(() => import('./views/base/cards/Cards'))
const Tables = React.lazy(() => import('./views/base/tables/Tables'))
const Charts = React.lazy(() => import('./views/charts/Charts'))
const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
const Select = React.lazy(() => import('./views/forms/select/Select'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  // SUJI routes — admin only
  { path: '/users/register', name: 'Register User', element: RegisterUser, adminOnly: true },
  { path: '/users/:id/add-patient', name: 'Add Patient for User', element: AddPatientForUser, adminOnly: true },
  { path: '/users/:id', name: 'User Details', element: UserDetails, adminOnly: true },
  { path: '/users', name: 'Users', element: Users, adminOnly: true },
  { path: '/symptoms/add', name: 'Add Symptom', element: AddSymptom, adminOnly: true },
  { path: '/symptoms', name: 'Symptoms', element: Symptoms, adminOnly: true },
  // SUJI routes — all roles
  { path: '/patients', name: 'Patients', element: Patients, exact: true },
  { path: '/patients/add', name: 'Add Patient', element: AddPatient },
  { path: '/patients/:id', name: 'Patient Details', element: PatientDetails },
  { path: '/change-password', name: 'Change Password', element: ChangePassword },
  // Demo routes
  { path: '/theme', name: 'Theme', element: Colors, exact: true },
  { path: '/theme/colors', name: 'Colors', element: Colors },
  { path: '/theme/typography', name: 'Typography', element: Typography },
  { path: '/base/cards', name: 'Cards', element: Cards },
  { path: '/base/tables', name: 'Tables', element: Tables },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl },
  { path: '/forms/select', name: 'Select', element: Select },
  { path: '/notifications/modals', name: 'Modals', element: Modals },
  { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
