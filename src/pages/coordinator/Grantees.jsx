import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Grantees() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
  setLoading(true);

  const { data, error } = await supabase
  .from("grantees")
  .select(`
    grantee_id,
    student_id,
    scholarship_id,
    status,
    date_awarded,
    academic_year,
    semester,
    students (
      school_id,
      users (
        first_name,
        last_name
      )
    ),
    scholarships (
      scholarship_name
    )
  `)
  .order("date_awarded", { ascending: false });

  if (error) {
    console.error(error.message);
    setLoading(false);
    return;
  }

  const formatted = data.map((g) => ({
  grantee_id: g.grantee_id,
  school_id: g.students?.school_id,
  student_name: `${g.students?.users?.first_name || ""} ${g.students?.users?.last_name || ""}`,
  scholarship_name: g.scholarships?.scholarship_name,
  status: g.status,
  academic_year: g.academic_year,
  semester: g.semester,
  date_awarded: g.date_awarded,
}));
  setRows(formatted);
  setLoading(false);
};

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Grantees</h1>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>School ID</th>
              <th style={styles.th}>Student Name</th>
              <th style={styles.th}>Scholarship</th>
              <th style={styles.th}>Date Approved</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Documents</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.grantee_id}>
                <td style={styles.td}>{r.school_id}</td>
                <td style={styles.td}>{r.student_name}</td>
                <td style={styles.td}>{r.scholarship_name}</td>
                <td style={styles.td}>
                  {r.date_awarded
  ? new Date(r.date_awarded).toLocaleDateString()
  : "Not set"}
                </td>

                <td style={styles.td}>
                  <span style={styles.badge}>{r.status  }</span>
                </td>

                {/* DOCUMENTS */}
                <td style={styles.td}>
  <span style={{ color: "#999" }}>Not available</span>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* STYLES */
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

  tableContainer: {
    background: "#fff",
    borderRadius: 10,
    overflowX: "auto",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },

  table: {
    width: "100%",
    minWidth: 900,
    borderCollapse: "collapse",
  },

  th: {
    background: "#111",
    color: "#fff",
    padding: 12,
    textAlign: "left",
    fontSize: 13,
  },

  td: {
    padding: 12,
    borderBottom: "1px solid #eee",
    fontSize: 13,
    verticalAlign: "top",
  },

  badge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },

  link: {
    display: "inline-block",
    color: "#2563eb",
    fontSize: 12,
    textDecoration: "underline",
  },
};