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

    // 1. GET APPROVED APPLICATIONS + STUDENT + USER + SCHOLARSHIP
    const { data: applications, error } = await supabase
      .from("scholarship_applications")
      .select(`
        application_id,
        status,
        application_date,
        students (
          student_id,
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
      .eq("status", "Approved");

    if (error) {
      console.error(error.message);
      setLoading(false);
      return;
    }

    // 2. GET ALL DOCUMENTS
    const { data: docs } = await supabase
      .from("application_documents")
      .select("*");

    // 3. MERGE DATA
    const merged = applications.map((app) => {
      const studentDocs =
        docs?.filter((d) => d.application_id === app.application_id) || [];

      return {
        application_id: app.application_id,
        scholarship_name: app.scholarships?.scholarship_name,
        school_id: app.students?.school_id,
        student_name: `${app.students?.users?.first_name || ""} ${app.students?.users?.last_name || ""}`,
        status: app.status,
        application_date: app.application_date,
        documents: studentDocs,
      };
    });

    setRows(merged);
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
              <tr key={r.application_id}>
                <td style={styles.td}>{r.school_id}</td>
                <td style={styles.td}>{r.student_name}</td>
                <td style={styles.td}>{r.scholarship_name}</td>
                <td style={styles.td}>
                  {new Date(r.application_date).toLocaleDateString()}
                </td>

                <td style={styles.td}>
                  <span style={styles.badge}>{r.status}</span>
                </td>

                {/* DOCUMENTS */}
                <td style={styles.td}>
                  {r.documents.length === 0 ? (
                    <span style={{ color: "#999" }}>No files</span>
                  ) : (
                    r.documents.map((d, i) => (
                      <div key={i} style={{ marginBottom: 5 }}>
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          {d.requirement_name || "View Document"}
                        </a>
                      </div>
                    ))
                  )}
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