# Admissions Platform - Frontend

React frontend for the intelligent admissions management platform.

## 🚀 Features

- **Public Admission Form**: Beautiful, responsive form for parent submissions
- **Admin Dashboard**: Complete admin interface with full control
- **Counselor Dashboard**: Limited access dashboard for counselors
- **Role-Based Authentication**: Separate login pages for admin and counselors
- **Protected Routes**: Secure route protection based on user roles
- **Real-time Updates**: Live data fetching and updates
- **Responsive Design**: Works on all devices

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 5000

## 🛠️ Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   └── ProtectedRoute.jsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.jsx
│   ├── layouts/             # Layout components
│   │   ├── PublicLayout.jsx
│   │   ├── AdminLayout.jsx
│   │   └── CounselorLayout.jsx
│   ├── pages/               # Page components
│   │   ├── public/          # Public pages
│   │   │   ├── AdmissionForm.jsx
│   │   │   └── ThankYou.jsx
│   │   ├── auth/            # Authentication pages
│   │   │   ├── AdminLogin.jsx
│   │   │   └── CounselorLogin.jsx
│   │   ├── admin/           # Admin pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Leads.jsx
│   │   │   ├── Counselors.jsx
│   │   │   ├── Institutions.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── Training.jsx
│   │   │   └── Analytics.jsx
│   │   └── counselor/        # Counselor pages
│   │       ├── Dashboard.jsx
│   │       ├── Leads.jsx
│   │       ├── Sessions.jsx
│   │       ├── Training.jsx
│   │       └── Todos.jsx
│   ├── services/            # API services
│   │   └── api.js
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🔐 Authentication

### Admin Login
- URL: `/admin/login`
- Username: `admin`
- Password: `admin123` (from seed data)

### Counselor Login
- URL: `/counselor/login`
- Username: `counselor1`, `counselor2`, etc.
- Password: `counselor123` (from seed data)

## 📡 API Integration

All API calls are handled through the `api.js` service file. The API base URL is configured via environment variable `VITE_API_URL`.

### Features:
- Automatic token injection in requests
- Error handling and token refresh
- Centralized API configuration

## 🎨 Styling

The app uses **Tailwind CSS** for styling with custom color scheme:
- Primary colors: Blue shades
- Responsive design with mobile-first approach
- Custom utility classes in `index.css`

## 🔒 Route Protection

Routes are protected using the `ProtectedRoute` component:
- Checks authentication status
- Validates user roles
- Redirects to login if unauthorized

## 📱 Pages Overview

### Public Pages
- **Admission Form**: Multi-section form for parent submissions
- **Thank You**: Confirmation page after form submission

### Admin Pages
- **Dashboard**: Overview with statistics and charts
- **Leads**: Complete lead management with filters
- **Counselors**: Counselor account management
- **Institutions**: School/college management
- **Courses**: Course/program management
- **Training**: Training content management
- **Analytics**: Detailed analytics and reports

### Counselor Pages
- **Dashboard**: Personal dashboard with workload stats
- **My Leads**: View and manage assigned leads
- **Sessions**: Schedule and manage counseling sessions
- **Training**: Access training materials
- **To-Dos**: Personal task management

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Hot Reload
The development server supports hot module replacement (HMR) for instant updates.

## 🔧 Configuration

### Vite Configuration
- Proxy setup for API calls
- Port: 3000 (configurable)
- React plugin enabled

### Tailwind Configuration
- Custom color palette
- Responsive breakpoints
- Custom utility classes

## 🚨 Error Handling

- Toast notifications for user feedback
- Error boundaries for graceful error handling
- API error interception and handling

## 📝 Notes

- All forms use `react-hook-form` for validation
- Date formatting uses `date-fns`
- Toast notifications use `react-hot-toast`
- All API calls are async/await based

## 🔗 Backend Integration

Make sure the backend server is running on `http://localhost:5000` before starting the frontend.

## 📄 License

ISC
