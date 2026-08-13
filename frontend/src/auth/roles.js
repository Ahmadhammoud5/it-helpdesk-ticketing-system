export const ROLES = {
  admin: 'Admin',
  manager: 'Manager',
  supportAgent: 'ITSupportAgent',
  employee: 'Employee',
}

export const TICKET_AUTHOR_ROLES = [
  ROLES.admin,
  ROLES.employee,
]

export function getRoles(user) {
  return Array.isArray(user?.roles)
    ? user.roles
    : []
}

export function hasRole(user, role) {
  return getRoles(user).includes(role)
}

export function getRoleContext(user) {
  const roles = getRoles(user)

  if (roles.includes(ROLES.admin)) {
    return {
      role: ROLES.admin,
      portalLabel: 'Admin workspace',
      portalName: 'Admin portal',
      dashboardDescription:
        'Monitor support activity across the entire help desk.',
      ticketsTitle: 'All tickets',
      ticketsLinkLabel: 'all tickets',
      ticketsDescription:
        'Review every support request and access operational controls.',
      recentDescription:
        'The most recently updated tickets across the help desk.',
      emptyTitle: 'No tickets yet',
      emptyDescription:
        'There are currently no tickets in the help desk.',
      canCreateTickets: true,
    }
  }

  if (roles.includes(ROLES.manager)) {
    return {
      role: ROLES.manager,
      portalLabel: 'Manager workspace',
      portalName: 'Manager portal',
      dashboardDescription:
        'Monitor and coordinate support activity across the help desk.',
      ticketsTitle: 'All tickets',
      ticketsLinkLabel: 'all tickets',
      ticketsDescription:
        'Oversee, assign and manage tickets across the help desk.',
      recentDescription:
        'The most recently updated tickets across the help desk.',
      emptyTitle: 'No tickets yet',
      emptyDescription:
        'There are currently no tickets to oversee.',
      canCreateTickets: false,
    }
  }

  if (roles.includes(ROLES.supportAgent)) {
    return {
      role: ROLES.supportAgent,
      portalLabel: 'Support workspace',
      portalName: 'Support portal',
      dashboardDescription:
        'Here is what is happening in your assigned ticket queue.',
      ticketsTitle: 'Assigned tickets',
      ticketsLinkLabel: 'assigned tickets',
      ticketsDescription:
        'Work through the support tickets assigned to you.',
      recentDescription:
        'Your most recently updated assigned tickets.',
      emptyTitle: 'No tickets assigned',
      emptyDescription:
        'No tickets are currently assigned to you.',
      canCreateTickets: false,
    }
  }

  if (roles.includes(ROLES.employee)) {
    return {
      role: ROLES.employee,
      portalLabel: 'Employee workspace',
      portalName: 'Employee portal',
      dashboardDescription:
        'Here is what is happening with your support requests.',
      ticketsTitle: 'My tickets',
      ticketsLinkLabel: 'my tickets',
      ticketsDescription:
        'View, filter and manage your support requests.',
      recentDescription:
        'Your most recently updated support requests.',
      emptyTitle: 'No tickets yet',
      emptyDescription:
        'Create your first support request and it will appear here.',
      canCreateTickets: true,
    }
  }

  return {
    role: 'Unknown role',
    portalLabel: 'Help desk workspace',
    portalName: 'Help desk',
    dashboardDescription:
      'Your account does not have a recognized system role.',
    ticketsTitle: 'Tickets',
    ticketsLinkLabel: 'tickets',
    ticketsDescription:
      'Contact an administrator to correct your account role.',
    recentDescription: 'Recently updated tickets.',
    emptyTitle: 'No tickets available',
    emptyDescription:
      'Contact an administrator to correct your account role.',
    canCreateTickets: false,
  }
}
