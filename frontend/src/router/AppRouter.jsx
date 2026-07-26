import { Navigate, createBrowserRouter } from 'react-router'

import ProtectedRoute from '../auth/ProtectedRoute'
import EmployeeLayout from '../components/layout/EmployeeLayout'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import CreateTicketPage from '../pages/CreateTicketPage'
import MyTicketsPage from '../pages/MyTicketsPage'
import TicketDetailsPage from '../pages/TicketDetailsPage'
import EditTicketPage from '../pages/EditTicketPage'

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
    element: (
      <ProtectedRoute>
        <EmployeeLayout />
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
        path: '/tickets/create',
        element: <CreateTicketPage />,
      },
      {
        path: '/tickets/:ticketId',
        element: <TicketDetailsPage />,
      },
      {
        path: '/tickets/:ticketId/edit',
        element: <EditTicketPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

export default router
