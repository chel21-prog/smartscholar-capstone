import { Routes, Route } from "react-router-dom";

import CashierLayout from "@/layouts/CashierLayout";

import Dashboard from "@/pages/cashier/Dashboard";
import Grantees from "@/pages/cashier/Grantees";
import Settings from "@/pages/settings/Settings";

export default function CashierRoutes() {
  return (
    <Routes>
      <Route element={<CashierLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="grantees" element={<Grantees />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}