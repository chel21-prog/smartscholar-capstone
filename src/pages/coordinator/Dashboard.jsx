import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CoordinatorDashboard() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("All");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("scholarship_applications")
      .select(`
        application_id,
        status,
        application_date,
        students (
          student_id
        ),
        scholarships (
          scholarship_name
        )
      `)
      .order("application_date", { ascending: false });

    setApplications(data || []);
    setLoading(false);
  };

  // VIEW ANSWERS
  const viewAnswers = async (app) => {
    setSelectedApp(app);

    const { data } = await supabase
      .from("application_form_responses")
      .select(`
        answer,
        scholarship_form_fields (
          label
        )
      `)
      .eq("application_id", app.application_id);

    setAnswers(data || []);
  };

  // UPDATE STATUS
  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("scholarship_applications")
      .update({ status })
      .eq("application_id", id);

    if (error) return alert(error.message);

    setApplications((prev) =>
      prev.map((a) =>
        a.application_id === id ? { ...a, status } : a
      )
    );
  };

  const filtered =
    filter === "All"
      ? applications
      : applications.filter((a) => a.status === filter);

  if (loading) return <p style={styles.loading}>Loading...</p>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Coordinator Dashboard</h1>

      {/* FILTERS */}
      <div style={styles.filterRow}>
        {["All", "Pending", "Approved", "Rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              background: filter === f ? "#2563eb" : "#fff",
              color: filter === f ? "#fff" : "#111",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Scholarship</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((a) => (
              <tr key={a.application_id}>
                <td>{a.students?.student_id}</td>
                <td>{a.scholarships?.scholarship_name}</td>
                <td>
                  <span
                    style={{
                      ...styles.badge,
                      background:
                        a.status === "Pending"
                          ? "#fef3c7"
                          : a.status === "Approved"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        a.status === "Pending"
                          ? "#92400e"
                          : a.status === "Approved"
                          ? "#166534"
                          : "#991b1b",
                    }}
                  >
                    {a.status}
                  </span>
                </td>
                <td>
                  {new Date(a.application_date).toLocaleDateString()}
                </td>

                <td style={styles.actions}>
                  <button
                    style={styles.btnBlue}
                    onClick={() => viewAnswers(a)}
                  >
                    View
                  </button>

                  {a.status === "Pending" && (
                    <>
                      <button
                        style={styles.btnGreen}
                        onClick={() =>
                          updateStatus(a.application_id, "Approved")
                        }
                      >
                        Approve
                      </button>

                      <button
                        style={styles.btnRed}
                        onClick={() =>
                          updateStatus(a.application_id, "Rejected")
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {selectedApp && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2>Application Answers</h2>

            <p style={styles.sub}>
              {selectedApp.scholarships?.scholarship_name}
            </p>

            {answers.map((r, i) => (
              <div key={i} style={styles.answerBox}>
                <b>{r.scholarship_form_fields?.label}</b>
                <p>{r.answer}</p>
              </div>
            ))}

            <button
              style={styles.btnRed}
              onClick={() => setSelectedApp(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 30,
    background: "#f8fafc",
    minHeight: "100vh",
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 20,
  },

  filterRow: {
    display: "flex",
    gap: 8,
    marginBottom: 15,
  },

  filterBtn: {
    padding: "6px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    cursor: "pointer",
  },

  tableContainer: {
    background: "#fff",
    borderRadius: 10,
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  badge: {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },

  actions: {
    display: "flex",
    gap: 6,
  },

  btnBlue: {
    padding: "6px 10px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
  },

  btnGreen: {
    padding: "6px 10px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
  },

  btnRed: {
    padding: "6px 10px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "450px",
  },

  answerBox: {
    padding: 10,
    background: "#f1f5f9",
    marginBottom: 8,
    borderRadius: 8,
  },

  sub: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 10,
  },

  loading: {
    padding: 20,
  },
};