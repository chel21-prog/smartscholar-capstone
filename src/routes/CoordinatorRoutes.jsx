import { Routes, Route } from "react-router-dom";

import CoordinatorLayout from "@/layouts/CoordinatorLayout";

import Dashboard from "@/pages/coordinator/Dashboard";
import Scholarships from "@/pages/coordinator/Scholarships";
import Grantees from "@/pages/coordinator/Grantees";
import Students from "@/pages/coordinator/Students";
import CoordinatorApplications from "@/pages/coordinator/CoordinatorApplications";
import Requirements from "@/pages/coordinator/Requirements";
import Settings from "@/pages/settings/Settings";
import ReportBuilder from "@/pages/coordinator/ReportBuilder";
export default function CoordinatorRoutes() {
  return (
    <Routes>
      <Route element={<CoordinatorLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="scholarships" element={<Scholarships />} />
        <Route path="grantees" element={<Grantees />} />
        <Route path="students" element={<Students />} />
        <Route
  path="/applications"
  element={<CoordinatorApplications />}
/>
        <Route path="requirements" element={<Requirements />} />
        <Route path="/ReportBuilder" element={<ReportBuilder />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}