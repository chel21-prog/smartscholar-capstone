import React, { useEffect, useState } from "react";
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
      application_id,
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

  const { data: docs } = await supabase
    .from("application_documents")
    .select("*")
    .in(
      "application_id",
      (data || []).map((g) => g.application_id)
    );

  const formatted = (data || []).map((g) => {
    const granteeDocs =
      docs?.filter((d) => d.application_id === g.application_id) || [];

    const first = g.students?.users?.first_name ?? "";
    const last = g.students?.users?.last_name ?? "";

    return {
      grantee_id: g.grantee_id,
      school_id: g.students?.school_id ?? "N/A",
      student_name: `${first} ${last}`.trim() || "Unknown",
      scholarship_name: g.scholarships?.scholarship_name ?? "N/A",
      status: g.status,
      academic_year: g.academic_year ?? "N/A",
      semester: g.semester ?? "N/A",
      date_awarded: g.date_awarded,

      documents: granteeDocs,
    };
  });

  setRows(formatted);
  setLoading(false);
};

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
 const grouped = rows.reduce((acc, r) => {
  const key = r.school_id; // better if you use student_id

  if (!acc[key]) {
    acc[key] = {
      school_id: r.school_id,
      student_name: r.student_name,
      scholarships: [],
    };
  }

  acc[key].scholarships.push(r);

  return acc;
}, {});
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
              <th style={styles.th}>AY Approved</th>
              <th style={styles.th}>Semester Approved</th>
              <th style={styles.th}>Date Approved</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Documents</th>
            </tr>
          </thead>

          <tbody>
  {Object.values(grouped).map((student) => (
  <React.Fragment key={student.student_id}>
      {student.scholarships.map((s, index) => (
        <tr key={s.grantee_id}>

          {/* ✅ MERGED STUDENT CELL */}
          {index === 0 && (
            <td
              rowSpan={student.scholarships.length}
              style={{ verticalAlign: "middle", fontWeight: "bold" }}
            >
              {student.school_id}
            </td>
          )}
          {index === 0 && (
            <td
              rowSpan={student.scholarships.length}
              style={{ verticalAlign: "middle", fontWeight: "bold" }}
            >
              {student.student_name}
            </td>
          )}
          <td>{s.scholarship_name}</td>
          <td>{s.academic_year}</td>
          <td>{s.semester}</td>

          <td>
            {s.date_awarded
              ? new Date(s.date_awarded).toLocaleDateString()
              : "Not set"}
          </td>

          <td>
            <span style={styles.badge}>{s.status}</span>
          </td>

          <td>
            {!s.documents || s.documents.length === 0 ? (
              <span style={{ color: "#999" }}>No files uploaded</span>
            ) : (
              s.documents.map((d, i) => (
                <div key={i}>
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
    </React.Fragment  >
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