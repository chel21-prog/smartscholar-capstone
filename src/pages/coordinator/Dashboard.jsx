import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CoordinatorDashboard() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [academic, setAcademic] = useState(null);
  const [scholarStats, setScholarStats] = useState([]);
const [editMode, setEditMode] = useState(false);
const [showReportModal, setShowReportModal] = useState(false);
const [form, setForm] = useState({
  academic_year: "",
  semester: "",
});
const [reportFilters, setReportFilters] = useState({
  reportType: "grantees",
  academicYear: "",
  semester: "",
  course: "",
  yearLevel: "",
  status: "",
});

const [reportLayout, setReportLayout] = useState("portrait");

const [columns, setColumns] = useState({
  schoolId: true,
  studentName: true,
  scholarship: true,
  course: true,
  yearLevel: true,
  academicYear: true,
  semester: true,
  status: true,
});

const [signatories, setSignatories] = useState([
  {
    name: "",
    position: "",
  },
]);

  useEffect(() => {
  load();
  loadAcademic();
  loadScholarStats(); // ✅ ADD THIS
}, []);

  const load = async () => {
    setLoading(true);

    const { data } = await supabase
  .from("scholarship_applications")
  .select(`
    application_id,
    status,
    application_date,
    scholarship_id,

    students (
      student_id,
      course,
      year_level,

      users (
        first_name,
        middle_name,
        last_name
      )
    ),

    scholarships (
      scholarship_name
    )
  `)
  .order("application_date", { ascending: false });

    setApplications(data || []);
    setLoading(false);
  };
  
  const loadScholarStats = async () => {
  const { data, error } = await supabase
    .from("grantees")
    .select(`
      scholarship_id,
      scholarships (
        scholarship_name
      )
    `);

  if (error) {
    console.error(error.message);
    return;
  }

  const grouped = {};

  (data || []).forEach((g) => {
    const id = g.scholarship_id;
    const name = g.scholarships?.scholarship_name || "Unknown";

    if (!grouped[id]) {
      grouped[id] = {
        scholarship_id: id,
        scholarship_name: name,
        count: 0,
      };
    }

    grouped[id].count += 1;
  });

  setScholarStats(Object.values(grouped));
};


const generatePDF = async () => {
  const doc = new jsPDF(
    reportLayout === "landscape"
      ? "landscape"
      : "portrait"
  );

  const headers = [];

  if (columns.schoolId)
    headers.push("School ID");

  if (columns.studentName)
    headers.push("Student Name");

  if (columns.scholarship)
    headers.push("Scholarship");

  if (columns.course)
    headers.push("Course");

  if (columns.yearLevel)
    headers.push("Year Level");

  if (columns.academicYear)
    headers.push("Academic Year");

  if (columns.semester)
    headers.push("Semester");

  if (columns.status)
    headers.push("Status");

  const rows = applications.map((a) => {
    const row = [];

    if (columns.schoolId)
      row.push(a.students?.student_id);

    if (columns.studentName)
      row.push(
        `${a.students?.users?.first_name || ""} ${
          a.students?.users?.last_name || ""
        }`
      );

    if (columns.scholarship)
      row.push(
        a.scholarships?.scholarship_name
      );

    if (columns.course)
      row.push(a.students?.course);

    if (columns.yearLevel)
      row.push(a.students?.year_level);

    if (columns.academicYear)
      row.push(academic?.academic_year);

    if (columns.semester)
      row.push(academic?.semester);

    if (columns.status)
      row.push(a.status);

    return row;
  });

  doc.text("Scholarship Report", 14, 15);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 25,
  });

  doc.save("Scholarship_Report.pdf");
};



const exportReport = async () => {
  const { data, error } = await supabase
.from("grantees")
.select(`
  semester,
  academic_year,

  students (
    course,
    year_level,

    users (
      first_name,
      middle_name,
      last_name
    )
  ),

  scholarships (
    scholarship_name,
    amount
  )
`)
.order("scholarship_id");

if (error) {
  alert(error.message);
  return;
}

const doc = new jsPDF("landscape");

doc.setFontSize(14);

doc.text(
  `MASTERLIST OF SCHOLARS/GRANTEES, AY ${academic?.academic_year}`,
  14,
  15
);

const rows = data.map((g, index) => [

  g.scholarships?.scholarship_name,

  index + 1,

  g.students?.users?.last_name,

  g.students?.users?.first_name,

  g.students?.users?.middle_name
    ?.charAt(0)
    .toUpperCase() || "",

  g.students?.course,

  g.students?.year_level,

  g.students?.year_level,

  g.scholarships?.amount,

  g.semester

]);

autoTable(doc, {

  head: [[
    "Scholarship Grant",
    "Seq",
    "Last",
    "First",
    "MI",
    "Program",
    "Year",
    "Level",
    "Amount",
    "Granted/Sem"
  ]],

  body: rows,

  startY: 25,

  theme: "grid",

  styles: {
    fontSize: 8
  }

});

doc.save(
  `Masterlist_${academic?.academic_year}.pdf`
);

};

  const loadAcademic = async () => {
  const { data, error } = await supabase
    .from("academic_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (!error && data) {
    setAcademic(data);

    setForm({
      academic_year: data.academic_year,
      semester: data.semester,
    });
  }
};

  // VIEW ANSWERS
  const viewAnswers = async (app) => {
    const updateStatus = async (id, status) => {
  const { error } = await supabase
    .from("scholarship_applications")
    .update({ status })
    .eq("application_id", id);

  if (error) {
    alert(error.message);
    return;
  }

  load();
};
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

  
  const approveApplication = async (app) => {
  // STEP 1: update status
  const { error } = await supabase
    .from("scholarship_applications")
    .update({ status: "Approved" })
    .eq("application_id", app.application_id);

  if (error) return alert(error.message);

  // STEP 2: insert into grantees table
  const { error: insertError } = await supabase
    .from("grantees")
    .insert({
  student_id: app.students.student_id,
  scholarship_id: app.scholarship_id,
  application_id: app.application_id,
  status: "Active",

  academic_year: app.academic_year,
  semester: app.semester,
})

  if (insertError) {
    return alert(insertError.message);
  }

  // STEP 3: update UI
  setApplications((prev) =>
    prev.map((a) =>
      a.application_id === app.application_id
        ? { ...a, status: "Approved" }
        : a
    )
  );
};

  const saveAcademic = async () => {
  const { error } = await supabase
    .from("academic_settings")
    .update({
      academic_year: form.academic_year,
      semester: form.semester,
      updated_at: new Date(),
    })
    .eq("id", academic.id); // MUST exist

  if (error) return alert(error.message);

  alert("Academic period updated!");

  setEditMode(false);
  loadAcademic();
  console.log(academic);
};

  const filtered =
    filter === "All"
      ? applications
      : applications.filter((a) => a.status === filter);

  if (loading) return <p style={styles.loading}>Loading...</p>;
  
  const addSignatory = () => {
  setSignatories([
    ...signatories,
    {
      name: "",
      position: "",
    },
  ]);
};

const removeSignatory = (index) => {
  setSignatories(
    signatories.filter((_, i) => i !== index)
  );
};

const updateSignatory = (index, field, value) => {
  const updated = [...signatories];

  updated[index][field] = value;

  setSignatories(updated);
};


  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Coordinator Dashboard</h1>
      {/* ACADEMIC CARD */}
<div style={styles.academicCard}>
  <h3>Academic Period</h3>

  {!editMode ? (
    <>
      <p>
        <b>AY:</b> {academic?.academic_year}
      </p>
      <p>
        <b>Semester:</b> {academic?.semester}
      </p>

      <button
        style={styles.btnBlue}
        onClick={() => setEditMode(true)}
      >
        Edit
      </button>
    </>
  ) : (
    <>
      <input
        style={styles.input}
        value={form.academic_year}
        onChange={(e) =>
          setForm({ ...form, academic_year: e.target.value })
        }
        placeholder="Academic Year"
      />

      <select
        style={styles.input}
        value={form.semester}
        onChange={(e) =>
          setForm({ ...form, semester: e.target.value })
        }
      >
        <option>1st Semester</option>
        <option>2nd Semester</option>
      </select>

      <div style={{ display: "flex", gap: 6 }}>
        <button style={styles.btnGreen} onClick={saveAcademic}>
          Save
        </button>

        <button
          style={styles.btnRed}
          onClick={() => setEditMode(false)}
        >
          Cancel
        </button>
      </div>
    </>
  )}
</div>

<div style={styles.scholarCardBox}>
  <h3 style={{ marginBottom: 10 }}>Scholarships</h3>

  <div style={styles.scholarListSmall}>
    {scholarStats.map((s) => (
      <div key={s.scholarship_id} style={styles.scholarRowSmall}>
        <span style={styles.nameText}>{s.scholarship_name}</span>
        <span style={styles.countBadge}>{s.count}</span>
      </div>
    ))}
  </div>
</div>

      <button
  style={styles.btnGreen}
  onClick={exportReport}
>
  Export Masterlist
</button>
<button
  style={styles.btnGreen}
  onClick={() => setShowReportModal(true)}
>Generate Report
</button>

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
                        onClick={() => approveApplication(a)}
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

      {showReportModal && (
  <div style={styles.overlay}>
    <div
      style={{
        background: "#fff",
        width: "900px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 20,
        borderRadius: 10,
      }}
    >
      <h2>Report Builder</h2>

      <hr />

      <h3>Layout</h3>

      <select
        value={reportLayout}
        onChange={(e) =>
          setReportLayout(e.target.value)
        }
      >
        <option value="portrait">
          Portrait
        </option>

        <option value="landscape">
          Landscape
        </option>
      </select>

      <h3>Filters</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,1fr)",
          gap: 10,
        }}
      >
        <select
          value={reportFilters.reportType}
          onChange={(e) =>
            setReportFilters({
              ...reportFilters,
              reportType: e.target.value,
            })
          }
        >
          <option value="grantees">
            Grantees
          </option>

          <option value="applications">
            Applications
          </option>

          <option value="scholarships">
            Scholarships
          </option>
        </select>

        <input
          placeholder="Academic Year"
          value={reportFilters.academicYear}
          onChange={(e) =>
            setReportFilters({
              ...reportFilters,
              academicYear: e.target.value,
            })
          }
        />

        <select
          value={reportFilters.semester}
          onChange={(e) =>
            setReportFilters({
              ...reportFilters,
              semester: e.target.value,
            })
          }
        >
          <option value="">
            All Semesters
          </option>

          <option>
            1st Semester
          </option>

          <option>
            2nd Semester
          </option>
        </select>

        <input
          placeholder="Course"
          value={reportFilters.course}
          onChange={(e) =>
            setReportFilters({
              ...reportFilters,
              course: e.target.value,
            })
          }
        />

        <input
          placeholder="Year Level"
          value={reportFilters.yearLevel}
          onChange={(e) =>
            setReportFilters({
              ...reportFilters,
              yearLevel: e.target.value,
            })
          }
        />
      </div>

      <h3>Columns</h3>

      {Object.keys(columns).map((key) => (
        <label
          key={key}
          style={{
            display: "block",
          }}
        >
          <input
            type="checkbox"
            checked={columns[key]}
            onChange={() =>
              setColumns({
                ...columns,
                [key]:
                  !columns[key],
              })
            }
          />

          {key}
        </label>
      ))}

      <h3>Signatories</h3>

      {signatories.map((s, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <input
            placeholder="Name"
            value={s.name}
            onChange={(e) =>
              updateSignatory(
                index,
                "name",
                e.target.value
              )
            }
          />

          <input
            placeholder="Position"
            value={s.position}
            onChange={(e) =>
              updateSignatory(
                index,
                "position",
                e.target.value
              )
            }
          />

          <button
            onClick={() =>
              removeSignatory(index)
            }
          >
            Delete
          </button>
        </div>
      ))}

      <button
        onClick={addSignatory}
      >
        Add Signatory
      </button>

      <hr />

      <h3>Preview</h3>

<div
  style={{
    border: "1px solid #ddd",
    background: "#fff",
    maxHeight: 350,
    overflow: "auto",
  }}
>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
    }}
  >
    <thead>
      <tr>
        {columns.schoolId && <th>School ID</th>}
        {columns.studentName && <th>Student Name</th>}
        {columns.scholarship && <th>Scholarship</th>}
        {columns.course && <th>Course</th>}
        {columns.yearLevel && <th>Year Level</th>}
        {columns.academicYear && <th>Academic Year</th>}
        {columns.semester && <th>Semester</th>}
        {columns.status && <th>Status</th>}
      </tr>
    </thead>

    <tbody>
      {applications.slice(0, 10).map((a) => (
        <tr key={a.application_id}>
          {columns.schoolId && (
            <td>{a.students?.student_id}</td>
          )}

          {columns.studentName && (
            <td>
              {a.students?.users?.first_name}{" "}
              {a.students?.users?.last_name}
            </td>
          )}

          {columns.scholarship && (
            <td>
              {a.scholarships?.scholarship_name}
            </td>
          )}

          {columns.course && (
            <td>
              {a.students?.course || "-"}
            </td>
          )}

          {columns.yearLevel && (
            <td>
              {a.students?.year_level || "-"}
            </td>
          )}

          {columns.academicYear && (
            <td>
              {academic?.academic_year}
            </td>
          )}

          {columns.semester && (
            <td>
              {academic?.semester}
            </td>
          )}

          {columns.status && (
            <td>{a.status}</td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
</div>

      <br />

      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <button
  style={styles.btnGreen}
  onClick={generatePDF}
>
  Generate PDF
</button>

        <button
          style={styles.btnRed}
          onClick={() =>
            setShowReportModal(false)
          }
        >
          Close
        </button>
      </div>
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
  academicCard: {
  background: "#fff",
  padding: 15,
  borderRadius: 10,
  marginBottom: 20,
  width: "300px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
},
scholarWrap: {
  marginBottom: 20,
  padding: 15,
  background: "#fff",
  borderRadius: 10,
},

scholarGrid: {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
},

scholarCard: {
  padding: 10,
  border: "1px solid #eee",
  borderRadius: 8,
  minWidth: 160,
},
scholarList: {
  display: "flex",
  flexDirection: "column",
  gap: 8,
},

scholarRow: {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 10px",
  borderBottom: "1px solid #eee",
  fontSize: 14,
},

countBadge: {
  background: "#2563eb",
  color: "#fff",
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 12,
  minWidth: 30,
  textAlign: "center",
},
scholarCardBox: {
  background: "#fff",
  padding: 15,
  borderRadius: 10,
  marginBottom: 20,
  width: "300px", // same as academic card
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
},

scholarListSmall: {
  display: "flex",
  flexDirection: "column",
  gap: 6,
},

scholarRowSmall: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  padding: "4px 0",
  borderBottom: "1px solid #f1f1f1",
},

nameText: {
  fontSize: 13,
  color: "#111",
  maxWidth: "200px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
},

countBadge: {
  background: "#2563eb",
  color: "#fff",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  minWidth: 26,
  textAlign: "center",
},
input: {
  width: "100%",
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  marginBottom: "10px",
},
};