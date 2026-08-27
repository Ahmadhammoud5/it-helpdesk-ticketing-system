# IT HelpDesk Ticketing System

A full-stack IT HelpDesk Ticketing System developed as part of our Full Stack Web Development internship project.

The application is designed to manage technical support requests inside an organization. Employees can create and track support tickets, while IT Support Agents, Managers, and Administrators can manage the complete ticket lifecycle through role-based dashboards and tools.

## Main Features

* Role-based authentication and authorization
* Employee ticket creation and tracking
* Ticket assignment, reassignment, and unassignment
* Ticket status workflow
* Public comments and internal notes
* File attachments
* Notifications
* Real-time online/offline user presence
* User profiles and profile pictures
* Admin user management
* Account activation and deactivation
* Manager team workload monitoring
* Reports and analytics
* Excel report export
* PDF report export
* Light and Dark Mode
* Responsive user interface

## User Roles

### Employee

Employees can:

* Create support tickets
* Select category and priority
* Upload attachments
* View and track their own tickets
* Add comments
* View ticket updates and history
* Receive notifications
* Manage their profile

### IT Support Agent

IT Support Agents can:

* View tickets assigned to them
* Update ticket status
* Add public comments
* Add internal notes
* Manage ticket attachments
* View ticket timeline and history
* View work-time information

### Manager

Managers can:

* View all tickets
* Assign, reassign, and unassign tickets
* Monitor support agents
* View online/offline presence
* Monitor agent workload
* View assigned and unassigned tickets
* Access reports and analytics
* Export reports to Excel and PDF

### Administrator

Administrators can:

* View and manage all tickets
* Create users
* Manage user roles
* Activate and deactivate accounts
* View online/offline user presence
* Access reports and analytics
* Export reports
* Manage their own profile

## Ticket Workflow

Tickets move through the support process using the following statuses:

**Open → In Progress → Pending → Resolved → Closed**

The system also keeps track of important activity such as assignments, comments, status changes, attachments, and ticket history.

## Reports and Analytics

Managers and Administrators have access to a reporting module that includes:

* Total ticket count
* Ticket statistics by status
* Ticket statistics by priority
* Ticket statistics by category
* Ticket volume over time
* Average resolution time
* Date-range filtering
* Excel export
* PDF export

## Real-Time Features

The application uses SignalR to support real-time functionality such as:

* Online/offline user presence
* Notification updates

This allows Managers and Administrators to monitor support-agent availability and helps users receive important updates without manually refreshing the application.

## Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Axios
* React Router
* SignalR Client
* Recharts

### Backend

* ASP.NET Core
* Entity Framework Core
* ASP.NET Core Identity
* JWT Authentication
* SignalR

### Database

* Microsoft SQL Server

## Running the Project Locally

### Backend

From the project root:

```bash
dotnet run --project backend/ITHelpDesk.Api/ITHelpDesk.Api.csproj
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open the local address shown by Vite in the terminal, usually:

```text
http://localhost:5173
```

## Project Team

* Ahmad Hammoud — [@Ahmadhammoud5](https://github.com/Ahmadhammoud5)
* Hassan Hajj — [@hassanhajj22](https://github.com/hassanhajj22)
