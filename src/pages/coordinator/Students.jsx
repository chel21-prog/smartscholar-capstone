import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUS_OPTIONS = ["Enrolled", "Graduated", "Dropped", "Inactive"];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openGrant, setOpenGrant] = useState(false);
const [selectedStudent, setSelectedStudent] = useState(null);

const [scholarships, setScholarships] = useState([]);
const [selectedScholarship, setSelectedScholarship] = useState("");

const [academicSettings, setAcademicSettings] = useState(null);

const [remarks, setRemarks] = useState("");

  useEffect(() => {
  loadStudents();
  loadAcademicSettings();
}, []);

  const loadStudents = async () => {
  setLoading(true);

  // Load students
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

  // Load active scholarships
  const { data: schols, error: scholError } = await supabase
    .from("scholarships")
    .select("*")
    .eq("status", "Active");

  if (!scholError) setScholarships(schols || []);

  setLoading(false);
};
 
const loadAcademicSettings = async () => {
  const { data, error } = await supabase
    .from("academic_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (!error) {
    setAcademicSettings(data);
  }
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
  
  const grantScholarship = async () => {
  if (!selectedStudent) return alert("No student selected");
  if (!selectedScholarship) return alert("Select scholarship");

  // 1. CREATE APPLICATION FIRST (THIS IS THE FIX)
  const { data: application, error: appError } = await supabase
    .from("scholarship_applications")
    .insert({
      student_id: selectedStudent.student_id,
      scholarship_id: selectedScholarship,
      status: "Approved",
      academic_year: academicYear,
      semester: semester,
    })
    .select()
    .single();

  if (appError) {
    alert(appError.message);
    return;
  }

  // 2. CREATE GRANTEE WITH APPLICATION ID
  const { error } = await supabase.from("grantees").insert({
    student_id: selectedStudent.student_id,
    scholarship_id: selectedScholarship,
    application_id: application.application_id, // ✅ IMPORTANT FIX
    academic_year: academicYear,
    semester: semester,
    date_awarded: new Date().toISOString().split("T")[0], // ✅ auto date
    status: "Active",
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Scholarship granted successfully!");

  // RESET FORM
  setOpenGrant(false);
  setSelectedScholarship("");
  setAcademicYear("");
  setSemester("1st");
  setSelectedStudent(null);
};

  return (
    <div style={page}>
      <h1 style={title}>Students</h1>
      {openGrant && (
  <div style={overlay}>
    <div style={modal}>
      <h2>Grant Scholarship</h2>

      <p>
        Student:{" "}
        <b>
          {selectedStudent?.users?.first_name}{" "}
          {selectedStudent?.users?.last_name}
        </b>
      </p>

      <select
        style={input}
        value={selectedScholarship}
        onChange={(e) => setSelectedScholarship(e.target.value)}
      >
        <option value="">Select Scholarship</option>
        {scholarships.map((s) => (
          <option key={s.scholarship_id} value={s.scholarship_id}>
            {s.scholarship_name}
          </option>
        ))}
      </select>

      <p>
  <b>Academic Year:</b> {academicSettings?.academic_year}
</p>

<p>
  <b>Semester:</b> {academicSettings?.semester}
</p>

      <button style={statusBtn} onClick={grantScholarship}>
        Grant
      </button>

      <button onClick={() => setOpenGrant(false)}>
        Cancel
      </button>
    </div>
  </div>
)}
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
                      onClick={() => {
  setSelectedStudent(s);
  setOpenGrant(true);
}}
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

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modal = {
  background: "white",
  padding: 20,
  borderRadius: 10,
  width: "400px",
};