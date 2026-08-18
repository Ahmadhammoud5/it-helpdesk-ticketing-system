import { Navigate, createBrowserRouter } from 'react-router'

import ProtectedRoute from '../auth/ProtectedRoute'
import {
  ROLES,
  TICKET_AUTHOR_ROLES,
} from '../auth/roles'
import AppLayout from '../components/layout/EmployeeLayout'
import RootLayout from '../components/layout/RootLayout'
import LoginPage from '../pages/LoginPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ErrorPage from '../pages/ErrorPage'
import {
  CreateTicketPage,
  DashboardPage,
  EditTicketPage,
  MyTicketsPage,
  ProfilePage,
  ReportsPage,
  TicketDetailsPage,
  TeamPage,
  UsersPage,
} from './lazyPages'

const routes = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/access-denied',
    element: (
      <ProtectedRoute>
        <ErrorPage type="403" />
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/tickets',
        element: <MyTicketsPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/tickets/create',
        element: (
          <ProtectedRoute allowedRoles={TICKET_AUTHOR_ROLES}>
            <CreateTicketPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/tickets/:ticketId',
        element: <TicketDetailsPage />,
      },
      {
        path: '/tickets/:ticketId/edit',
        element: (
          <ProtectedRoute allowedRoles={TICKET_AUTHOR_ROLES}>
            <EditTicketPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/team',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.manager]}>
            <TeamPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.admin]}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute
            allowedRoles={[
              ROLES.admin,
              ROLES.manager,
            ]}
          >
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <ErrorPage type="404" />,
  },
]

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: routes,
  },
])

export default router
