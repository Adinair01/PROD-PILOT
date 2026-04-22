import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Hub from "./pages/Hub";
import DecisionEngine from "./pages/DecisionEngine";
import RoleSelector from "./pages/RoleSelector";
import PMDashboard from "./pages/PMDashboard";
import QADashboard from "./pages/QADashboard";
import FEDashboard from "./pages/FEDashboard";
import BEDashboard from "./pages/BEDashboard";
import DataDashboard from "./pages/DataDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Landing />} />
        <Route path="/signin"          element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/hub"             element={<Hub />} />
        <Route path="/decision-engine" element={<DecisionEngine />} />
        <Route path="/dashboard"       element={<RoleSelector />} />
        <Route path="/dashboard/pm"    element={<PMDashboard />} />
        <Route path="/dashboard/qa"    element={<QADashboard />} />
        <Route path="/dashboard/fe"    element={<FEDashboard />} />
        <Route path="/dashboard/be"    element={<BEDashboard />} />
        <Route path="/dashboard/data"  element={<DataDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
