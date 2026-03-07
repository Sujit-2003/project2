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
const Doctors = React.lazy(() => import('./views/doctors/Doctors'))
const AddDoctor = React.lazy(() => import('./views/doctors/AddDoctor'))
const DoctorDetails = React.lazy(() => import('./views/doctors/DoctorDetails'))
const FAQs = React.lazy(() => import('./views/faqs/FAQs'))
const MasterData = React.lazy(() => import('./views/masterdata/MasterData'))
const ChangePassword = React.lazy(() => import('./views/pages/ChangePassword'))
const Charts = React.lazy(() => import('./views/charts/Charts'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  // Admin only
  { path: '/users/register', name: 'Register User', element: RegisterUser, adminOnly: true },
  { path: '/users/:id/add-patient', name: 'Add Patient for User', element: AddPatientForUser, adminOnly: true },
  { path: '/users/:id', name: 'User Details', element: UserDetails, adminOnly: true },
  { path: '/users', name: 'Users', element: Users, adminOnly: true },
  { path: '/doctors/add', name: 'Add Doctor', element: AddDoctor, adminOnly: true },
  { path: '/doctors/:id', name: 'Doctor Details', element: DoctorDetails, adminOnly: true },
  { path: '/doctors', name: 'Doctors', element: Doctors, adminOnly: true },
  { path: '/symptoms/add', name: 'Add Symptom', element: AddSymptom, adminOnly: true },
  { path: '/symptoms', name: 'Symptoms', element: Symptoms, adminOnly: true },
  { path: '/faqs', name: 'FAQs', element: FAQs, adminOnly: true },
  { path: '/masterdata', name: 'Master Data', element: MasterData, adminOnly: true },
  { path: '/charts', name: 'Charts', element: Charts, adminOnly: true },
  // All roles
  { path: '/patients', name: 'Patients', element: Patients, exact: true },
  { path: '/patients/add', name: 'Add Patient', element: AddPatient },
  { path: '/patients/:id', name: 'Patient Details', element: PatientDetails },
  { path: '/change-password', name: 'Change Password', element: ChangePassword },
]

export default routes
