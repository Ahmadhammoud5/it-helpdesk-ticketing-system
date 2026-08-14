import { Navigate, createBrowserRouter } from 'react-router'

import ProtectedRoute from '../auth/ProtectedRoute'
import {
  ROLES,
  TICKET_AUTHOR_ROLES,
} from '../auth/roles'
import AppLayout from '../components/layout/EmployeeLayout'
import LoginPage from '../pages/LoginPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import {
  CreateTicketPage,
  DashboardPage,
  EditTicketPage,
  MyTicketsPage,
  ProfilePage,
  TicketDetailsPage,
  TeamPage,
  UsersPage,
} from './lazyPages'

const router = createBrowserRouter([
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
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

export default router
