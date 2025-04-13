import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import NavigationBar from "./components/Navbar";
import ProtectedRoute from "./routes/ProtectedRoute";

import SignIn from "./pages/SignIn";
import BiddingPage from "./pages/BiddingPage";
import Dashboard from "./pages/Dashboard";
import DevDashboard from "./pages/DevDashboard";
import AdminPanel from "./pages/AdminPanel";

import "bootstrap/dist/css/bootstrap.min.css"; // 🟦 Global Bootstrap styles

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavigationBar />

        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />

          {/* Bidder Routes */}
          <Route
            path="/bidding"
            element={
              <ProtectedRoute roles={["bidder"]}>
                <BiddingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["bidder"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Developer Routes */}
          <Route
            path="/dev-dashboard"
            element={
              <ProtectedRoute roles={["developer"]}>
                <DevDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Default Fallback */}
          <Route path="*" element={<SignIn />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
