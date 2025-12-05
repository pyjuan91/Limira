import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types'

// Pages
import Welcome from '@/pages/Welcome'
import InventorLogin from '@/pages/auth/InventorLogin'
import AttorneyLogin from '@/pages/auth/AttorneyLogin'
import Signup from '@/pages/auth/Signup'
import InventorDashboard from '@/pages/inventor/Dashboard'
import NewDisclosure from '@/pages/inventor/NewDisclosure'
import UploadPatent from '@/pages/inventor/UploadPatent'
import InventorDisclosureDetail from '@/pages/inventor/DisclosureDetail'
import LawyerDashboard from '@/pages/lawyer/Dashboard'
import LawyerDisclosureDetail from '@/pages/lawyer/DisclosureDetail'

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) => {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Root redirect based on user role
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />
  }

  switch (user?.role) {
    case UserRole.INVENTOR:
      return <Navigate to="/inventor/dashboard" replace />
    case UserRole.LAWYER:
      return <Navigate to="/lawyer/dashboard" replace />
    case UserRole.ADMIN:
      return <Navigate to="/admin/dashboard" replace />
    default:
      return <Navigate to="/welcome" replace />
  }
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login/inventor" element={<InventorLogin />} />
        <Route path="/login/attorney" element={<AttorneyLogin />} />
        <Route path="/signup" element={<Signup />} />

        {/* Inventor Routes */}
        <Route
          path="/inventor/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.INVENTOR, UserRole.ADMIN]}>
              <InventorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventor/new-disclosure"
          element={
            <ProtectedRoute allowedRoles={[UserRole.INVENTOR, UserRole.ADMIN]}>
              <NewDisclosure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventor/upload-patent"
          element={
            <ProtectedRoute allowedRoles={[UserRole.INVENTOR, UserRole.ADMIN]}>
              <UploadPatent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventor/disclosure/:id"
          element={
            <ProtectedRoute allowedRoles={[UserRole.INVENTOR, UserRole.ADMIN]}>
              <InventorDisclosureDetail />
            </ProtectedRoute>
          }
        />

        {/* Lawyer Routes */}
        <Route
          path="/lawyer/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.LAWYER, UserRole.ADMIN]}>
              <LawyerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lawyer/disclosure/:id"
          element={
            <ProtectedRoute allowedRoles={[UserRole.LAWYER, UserRole.ADMIN]}>
              <LawyerDisclosureDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
