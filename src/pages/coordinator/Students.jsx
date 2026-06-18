import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUS_OPTIONS = ["Enrolled", "Graduated", "Dropped", "Inactive"];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select(`
        student_id,
        school_id,
        course,
        year_level,
        gender,
        ethnicity,
        contact_number,
        status,
        remarks,
        users (
        first_name,
        last_name,
        email
        )
      `)
      .order("school_id", { ascending: true });

    if (!error) setStudents(data || []);
    setLoading(false);
  };

  // CLICK TO CHANGE STATUS
  const updateStatus = async (studentId, currentStatus) => {
    const currentIndex = STATUS_OPTIONS.indexOf(currentStatus);
    const nextStatus =
      STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length];

    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, status: nextStatus } : s
      )
    );

    await supabase
      .from("students")
      .update({ status: nextStatus })
      .eq("student_id", studentId);
  };

  // AUTO SAVE REMARKS
  const updateRemarks = (studentId, value) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, remarks: value } : s
      )
    );

    clearTimeout(window.__remarkTimeout);

    window.__remarkTimeout = setTimeout(async () => {
      await supabase
        .from("students")
        .update({ remarks: value })
        .eq("student_id", studentId);
    }, 600);
  };

  return (
    <div style={page}>
      <h1 style={title}>Students</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th>School ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Year</th>
                <th>Gender</th>
                <th>Ethnicity</th>
                <th>Contact</th>
                <th>Enrollement Status</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => (
                <tr key={s.student_id}>
                  <td>{s.school_id}</td>
                  <td>{s.users?.first_name} {s.users?.last_name}</td>
                  <td>{s.users?.email}</td>
                  <td>{s.course}</td>
                  <td>{s.year_level}</td>
                  <td>{s.gender}</td>
                  <td>{s.ethnicity}</td>
                  <td>{s.contact_number}</td>

                  {/* CLICKABLE STATUS */}
                  <td>
                    <button
                      onClick={() => updateStatus(s.student_id, s.status)}
                      style={{
                        ...statusBtn,
                        background:
                          s.status === "Enrolled"
                            ? "#16a34a"
                            : s.status === "Graduated"
                            ? "#2563eb"
                            : s.status === "Dropped"
                            ? "#dc2626"
                            : "#6b7280",
                      }}
                    >
                      {s.status}
                    </button>
                  </td>

                  {/* AUTO-SAVE REMARKS */}
                  <td>
                    <input
                      value={s.remarks || ""}
                      onChange={(e) =>
                        updateRemarks(s.student_id, e.target.value)
                      }
                      style={input}
                      placeholder="Add remark..."
                    />
                  </td>
                  <td>
                    <button
                      style={{
                      padding: "6px 10px",
                      border: "none",
                      borderRadius: 6,
                      background: "#f59e0b",
                      color: "white",
                      cursor: "pointer",
                      }}
                      onClick={() => {}}
                      >
                      Grant Scholarship
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== STYLES ===== */

const page = {
  padding: 20,
  fontFamily: "Arial",
  background: "#f5f6f8",
  minHeight: "100vh",
};

const title = {
  marginBottom: 20,
};

const tableWrapper = {
  background: "white",
  padding: 10,
  borderRadius: 10,
  overflowX: "auto",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const statusBtn = {
  padding: "6px 10px",
  border: "none",
  borderRadius: 6,
  color: "white",
  cursor: "pointer",
  fontSize: 12,
};

const input = {
  width: "100%",
  padding: 6,
  border: "1px solid #ddd",
  borderRadius: 6,
};