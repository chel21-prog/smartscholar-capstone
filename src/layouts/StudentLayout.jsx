import { Outlet } from "react-router-dom";
import StudentSidebar from "@/components/student/StudentSidebar";
import NotificationBell from "@/components/student/NotificationBell";
export default function StudentLayout() {
  return (
  <div style={styles.container}>
    <StudentSidebar />

    <main style={styles.main}>
      <div style={styles.topBar}>
        <div />

        <NotificationBell />
      </div>

      <Outlet />
    </main>
  </div>
);
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
  },

  main: {
    flex: 1,
    marginLeft: "230px",
    padding: 20,
    background: "#f4f6f8",
    minHeight: "100vh",
    overflowY: "auto",
    transition: "all 0.3s ease",
  },
  topBar: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
},
};