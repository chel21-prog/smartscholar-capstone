import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [scholarships, setScholarships] = useState([]);
  const [requirementsMap, setRequirementsMap] = useState([]);
  const [studentReq, setStudentReq] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [formAnswers, setFormAnswers] = useState({});
  const [formId, setFormId] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMeta, setFormMeta] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data: userRow } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", user.id)
        .single();

      const { data: studentRow } = await supabase
        .from("students")
        .select("student_id")
        .eq("user_id", userRow.user_id)
        .single();

      const sid = studentRow.student_id;
      setStudentId(sid);

      const { data: appData } = await supabase
        .from("scholarship_applications")
        .select("*")
        .eq("student_id", sid);

      setApplications(appData || []);

      const { data: scholarshipsData } = await supabase
        .from("scholarships")
        .select("*");

      const { data: reqMap } = await supabase
        .from("scholarship_requirements")
        .select("*");

      const { data: studentData } = await supabase
        .from("student_eligibility_profile")
        .select("*")
        .eq("student_id", sid);

      setScholarships(scholarshipsData || []);
      setRequirementsMap(reqMap || []);
      setStudentReq(studentData || []);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // GET APPLICATION
  const getApplication = (scholarshipId) => {
    return applications.find((a) => a.scholarship_id === scholarshipId);
  };

  // ELIGIBILITY CHECK
  const isEligible = (scholarship) => {
    const required = requirementsMap
      .filter(
        (r) =>
          r.scholarship_id === scholarship.scholarship_id &&
          r.eligibility_requirement_id
      )
      .map((r) => r.eligibility_requirement_id);

    if (!required.length) return true;

    return required.every((reqId) => {
      const match = studentReq.find(
        (r) => r.eligibility_requirement_id === reqId
      );
      return match?.status === "Compliant";
    });
  };

 const loadForm = async (scholarshipId) => {
  const { data: form } = await supabase
    .from("scholarship_application_forms")
    .select("*")
    .eq("scholarship_id", scholarshipId)
    .single();

  if (!form) {
    alert("No application form found for this scholarship");
    return;
  }

  // ✅ SAVE FORM META (TITLE + TERMS)
  setFormMeta(form);
  setFormId(form.form_id);

  const { data: fields } = await supabase
    .from("scholarship_form_fields")
    .select("*")
    .eq("form_id", form.form_id);

  setFormFields(fields || []);
  setFormAnswers({});
  setShowForm(true); // 👈 IMPORTANT (open modal here)
};

  // MISSING REQUIREMENTS (FIXED)
  const getNotEligibleReasons = (scholarship) => {
  const required = requirementsMap.filter(
    (r) =>
      r.scholarship_id === scholarship.scholarship_id &&
      r.eligibility_requirement_id
  );

  const reasons = [];

  required.forEach((r) => {
    const studentRecord = studentReq.find(
      (s) =>
        s.eligibility_requirement_id === r.eligibility_requirement_id
    );

    const requirementName = r.requirement_name || "Requirement";

    // CASE 1: missing record
    if (!studentRecord) {
      reasons.push(`${requirementName} - Not submitted`);
      return;
    }

    // CASE 2: exists but not compliant
    if (studentRecord.status !== "Compliant") {
      reasons.push(`${requirementName} - ${studentRecord.status}`);
    }
  });

  return reasons;
};

  // APPLY
  const submitApplication = async () => {
  // 1. create application
  const { data: app, error: appError } = await supabase
    .from("scholarship_applications")
    .insert({
      student_id: studentId,
      scholarship_id: selectedScholarship.scholarship_id,
      status: "Pending",
    })
    .select()
    .single();

  if (appError) return alert(appError.message);

  // 2. insert responses
  const responses = Object.entries(formAnswers).map(
    ([fieldId, answer]) => ({
      application_id: app.application_id,
      field_id: fieldId,
      answer,
    })
  );

  const { error: resError } = await supabase
    .from("application_form_responses")
    .insert(responses);

  if (resError) return alert(resError.message);

  alert("Application submitted!");

  setShowForm(false);
  setSelectedScholarship(null);
};

  const eligible = scholarships.filter(isEligible);
  const notEligible = scholarships.filter((s) => !isEligible(s));

  if (loading) return <p>Loading...</p>;

  return (
    <div style={styles.page}>
      <h1>Scholarship Dashboard</h1>

      {/* STATS */}
      <div style={styles.statsRow}>
        <div style={styles.card}>
          <div style={styles.cardNumber}>{scholarships.length}</div>
          <div style={styles.cardLabel}>Total</div>
        </div>

        <div style={styles.card}>
          <div style={{ ...styles.cardNumber, color: "#16a34a" }}>
            {eligible.length}
          </div>
          <div style={styles.cardLabel}>Eligible</div>
        </div>

        <div style={styles.card}>
          <div style={{ ...styles.cardNumber, color: "#dc2626" }}>
            {notEligible.length}
          </div>
          <div style={styles.cardLabel}>Not Eligible</div>
        </div>
      </div>

      {/* ELIGIBLE */}
      <h2 style={{ color: "green" }}>Eligible Scholarships</h2>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>ApplicationDeadline</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {eligible.map((s) => (
              <tr key={s.scholarship_id}>
                <td style={styles.td}>{s.scholarship_name}</td>
                <td style={styles.td}>{s.description}</td>
                <td style={styles.td}>₱{s.amount}</td>
                <td style={styles.td}>{s.submission_deadline}</td>
                <td style={styles.td}>
                  {getApplication(s.scholarship_id) ? (
                    <span style={styles.badge}>
                      {getApplication(s.scholarship_id).status}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
  setSelectedScholarship(s);
  loadForm(s.scholarship_id);
  setShowForm(true);
}}
                      style={styles.applyBtn}
                    >
                      Apply
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NOT ELIGIBLE */}
      <h2 style={{ color: "red" }}>Not Eligible</h2>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Deadline</th>
              <th style={styles.th}>Why Not Eligible</th>
            </tr>
          </thead>

          <tbody>
            {notEligible.map((s) => {
              const reasons = getNotEligibleReasons(s);

              return (
                <tr key={s.scholarship_id}>
                  <td style={styles.td}>{s.scholarship_name}</td>
                  <td style={styles.td}>{s.description}</td>
                  <td style={styles.td}>₱{s.amount}</td>
                  <td style={styles.td}>{s.submission_deadline}</td>
                  <td style={styles.td}>
  {reasons.length === 0 ? (
    <span style={{ color: "green" }}>Eligible</span>
  ) : (
    <ul style={{ margin: 0, paddingLeft: 15 }}>
      {reasons.map((r, i) => (
        <li key={i} style={{ color: "red", fontSize: 12 }}>
          {r}
        </li>
      ))}
    </ul>
  )}
</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {/* MODAL */}
{showForm && selectedScholarship && formMeta && (
  <div style={styles.modalOverlay}>
    <div style={styles.modal}>
 
      <h2>{selectedScholarship.scholarship_name}</h2>
       <h2>{formMeta?.form_title}</h2>

      <p style={{ fontSize: 12, color: "#555" }}>
        {formMeta?.terms_and_conditions}
      </p>
      {/* FORM FIELDS */}
      {formFields.map((field) => (
        <div key={field.field_id} style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: "bold" }}>
            {field.label}
          </label>

          <input
            style={styles.input}
            type={field.field_type === "number" ? "number" : "text"}
            onChange={(e) =>
              setFormAnswers({
                ...formAnswers,
                [field.field_id]: e.target.value,
              })
            }
          />
        </div>
      ))}

      {/* SUBMIT BUTTON (IMPORTANT) */}
      <button
        onClick={submitApplication}
        style={styles.applyBtn}
      >
        Submit Application
      </button>

      {/* CANCEL BUTTON */}
      <button
        onClick={() => {
          setShowForm(false);
          setSelectedScholarship(null);
        }}
        style={styles.cancelBtn}
      >
        Cancel
      </button>

    </div>
  </div>
)}
    </div>
  );
}

/* STYLES */
const styles = {
  page: { padding: 30, background: "#f8fafc", minHeight: "100vh" },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 15,
    marginBottom: 20,
  },

  card: {
    background: "#fff",
    padding: 15,
    borderRadius: 10,
    textAlign: "center",
  },

  cardNumber: { fontSize: 28, fontWeight: "bold" },

  cardLabel: { fontSize: 12, color: "#666" },

  tableContainer: {
    background: "#fff",
    borderRadius: 10,
    overflowX: "auto",
    marginBottom: 20,
  },

  table: {
    width: "100%",
    minWidth: 700,
    borderCollapse: "collapse",
  },

  th: {
    background: "#111",
    color: "#fff",
    padding: 10,
    textAlign: "left",
  },

  td: {
    padding: 10,
    borderBottom: "1px solid #eee",
  },

  applyBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },

  badge: {
    background: "#fef3c7",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
  },

  modalOverlay: {
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
    width: 300,
  },

  cancelBtn: {
    marginLeft: 10,
    padding: "6px 10px",
    border: "1px solid #ccc",
    borderRadius: 6,
  },
  input: {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginTop: "4px",
},
};