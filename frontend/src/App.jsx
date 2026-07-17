import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Hub from "./pages/Hub";
import DecisionEngine from "./pages/DecisionEngine";
import RoleSelector from "./pages/RoleSelector";
import PMDashboard from "./pages/PMDashboard";
import QADashboard from "./pages/QADashboard";
import FEDashboard from "./pages/FEDashboard";
import BEDashboard from "./pages/BEDashboard";
import DataDashboard from "./pages/DataDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Authenticated */}
        <Route path="/hub" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
        <Route path="/decision-engine" element={<ProtectedRoute><DecisionEngine /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><RoleSelector /></ProtectedRoute>} />
        <Route path="/dashboard/pm" element={<ProtectedRoute><PMDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/qa" element={<ProtectedRoute><QADashboard /></ProtectedRoute>} />
        <Route path="/dashboard/fe" element={<ProtectedRoute><FEDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/be" element={<ProtectedRoute><BEDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/data" element={<ProtectedRoute><DataDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
