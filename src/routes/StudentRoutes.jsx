import { Routes, Route } from "react-router-dom";
import ProfileGuard from "@/components/ProfileGuard";
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
        <Route path="/dashboard" element={<ProfileGuard><Dashboard /></ProfileGuard>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/apply/:id" element={<ProfileGuard><ApplyDetails /></ProfileGuard>} />
        <Route path="/applications" element={<ProfileGuard><Applications /></ProfileGuard>} />
        <Route path="/compliance" element={<ProfileGuard><Compliance /></ProfileGuard>} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}