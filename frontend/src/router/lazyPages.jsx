import { lazy } from 'react'

export const DashboardPage = lazy(() =>
  import('../pages/DashboardPage'),
)

export const CreateTicketPage = lazy(() =>
  import('../pages/CreateTicketPage'),
)

export const MyTicketsPage = lazy(() =>
  import('../pages/MyTicketsPage'),
)

export const TicketDetailsPage = lazy(() =>
  import('../pages/TicketDetailsPage'),
)

export const EditTicketPage = lazy(() =>
  import('../pages/EditTicketPage'),
)

export const UsersPage = lazy(() =>
  import('../pages/UsersPage'),
)

export const TeamPage = lazy(() =>
  import('../pages/TeamPage'),
)

export const ProfilePage = lazy(() =>
  import('../pages/ProfilePage'),
)
