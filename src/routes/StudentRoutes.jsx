import { Routes, Route } from "react-router-dom";

import StudentLayout from "@/layouts/StudentLayout";

import Dashboard from "@/pages/student/Dashboard";
import Profile from "@/pages/student/Profile";
import ApplyDetails from "@/pages/student/ApplyDetails";
import Applications from "@/pages/student/Applications";
import Compliance from "@/pages/student/Compliance";
import Settings from "@/pages/settings/Settings";


export default function StudentRoutes() {
  return (
    <Routes>
      <Route element={<StudentLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="apply/:id" element={<ApplyDetails />} />
        <Route path="applications" element={<Applications />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}