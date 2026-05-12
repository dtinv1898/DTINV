# DTI Performance Tracker Dashboard

A web application developed for the **Department of Trade and Industry (DTI) - Nueva Vizcaya** for reporting, tracking, and data visualization of the organization's performance.

The system features interactive dashboards for **Organizational Outcomes (OORC)** and the **Performance Governance System (PGS)**
## Key Features

- **Public Dashboards:** Open access for users to view and interact with OORC and PGS performance metrics.

- **Interactive Visualizations:** Dynamic charts (bar charts, donut charts) and data insights panels that   update in real-time upon uploading Excel files.

- **Advanced Filtering:** Synchronized multi-dropdown controls (Filter by Perspective, Strategic Measure, and Semester) for seamless data navigation.

- **Role-Based Access Control:** Secure, password-protected administrator login system.

- **Admin Management:** Dedicated and secure upload features restricted exclusively to authorized administrators to update the system's data.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Backend & Database:** Supabase (Authentication, PostgreSQL Database)
- **Runtime Environment:** Node.js
- **Deployment:** Vercel

## Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites
- Node.js (v18 or higher)
- npm or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dtinv1898/DTINV.git
   cd DTINV
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. **Open the app**
   Navigate to `http://localhost:8080` (or the port specified by Vite) in your browser.

## Developer Notes
- Developed as an OJT project by Joverdale D. Dela Cruz II & Bryan B. Camingal to simplify data reporting, and provide a clear overview of the organization's performance.
