import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Users = React.lazy(() => import('./views/users/Users'))
const Patients = React.lazy(() => import('./views/patients/Patients'))
const AddPatient = React.lazy(() => import('./views/patients/AddPatient'))

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
  // SUJI routes
  { path: '/users', name: 'Users', element: Users },
  { path: '/patients', name: 'Patients', element: Patients, exact: true },
  { path: '/patients/add', name: 'Add Patient', element: AddPatient },
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
