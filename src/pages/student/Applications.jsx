import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [formAnswers, setFormAnswers] = useState({});
  const [formMeta, setFormMeta] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
  setLoading(true);

  const user = await supabase.auth.getUser();

  // 1. Get internal user row
  const { data: userRow } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_id", user.data.user.id)
    .single();

  // 2. Get student row
  const { data: studentRow } = await supabase
    .from("students")
    .select("student_id")
    .eq("user_id", userRow.user_id)
    .single();

  // 3. Get applications for that student only
  const { data } = await supabase
    .from("scholarship_applications")
    .select(`
      application_id,
      scholarship_id,
      status,
      application_date,
      scholarships (
        scholarship_name
      )
    `)
    .eq("student_id", studentRow.student_id);

  setApplications(data || []);
  setLoading(false);
};

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

  const cancelApplication = async (id) => {
    const confirm = window.confirm("Cancel this application?");
    if (!confirm) return;

    const { error } = await supabase
      .from("scholarship_applications")
      .delete()
      .eq("application_id", id);

    if (error) return alert(error.message);

    setApplications(applications.filter((a) => a.application_id !== id));
  };

  const editApplication = async (app) => {
    setEditMode(true);
    setEditApp(app);

    const { data: form } = await supabase
      .from("scholarship_application_forms")
      .select("*")
      .eq("scholarship_id", app.scholarship_id)
      .single();

    setFormMeta(form);

    const { data: fields } = await supabase
      .from("scholarship_form_fields")
      .select("*")
      .eq("form_id", form.form_id);

    setFormFields(fields || []);

    const { data: responses } = await supabase
      .from("application_form_responses")
      .select("*")
      .eq("application_id", app.application_id);

    const mapped = {};
    (responses || []).forEach((r) => {
      mapped[r.field_id] = r.answer;
    });

    setFormAnswers(mapped);
  };

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>My Applications</h1>

      {/* GRID */}
      <div style={styles.grid}>
        {applications.map((a) => (
          <div key={a.application_id} style={styles.card}>
            <h3 style={styles.cardTitle}>
              {a.scholarships?.scholarship_name}
            </h3>

            <p style={styles.date}>
              {a.application_date}
            </p>

            <span style={{
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
            }}>
              {a.status}
            </span>

            {/* BUTTONS */}
            <div style={styles.actions}>
              <button style={styles.btnBlue} onClick={() => viewAnswers(a)}>
                View
              </button>

              {a.status === "Pending" && (
                <>
                  <button
                    style={styles.btnGreen}
                    onClick={() => editApplication(a)}
                  >
                    Edit
                  </button>

                  <button
                    style={styles.btnRed}
                    onClick={() => cancelApplication(a.application_id)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* VIEW MODAL */}
      {selectedApp && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2>Application Answers</h2>

            {answers.map((r, i) => (
              <div key={i} style={styles.answerBox}>
                <b>{r.scholarship_form_fields?.label}</b>
                <p>{r.answer}</p>
              </div>
            ))}

            <button style={styles.btnRed} onClick={() => setSelectedApp(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editMode && (
        <div style={styles.overlay}>
          <div style={styles.modalLarge}>
            <h2>Edit Application</h2>

            <p style={styles.subtitle}>
              {formMeta?.form_title}
            </p>

            <div style={styles.form}>
              {formFields.map((field) => (
                <div key={field.field_id} style={styles.field}>
                  <label style={styles.label}>{field.label}</label>

                  <input
                    style={styles.input}
                    value={formAnswers[field.field_id] || ""}
                    onChange={(e) =>
                      setFormAnswers({
                        ...formAnswers,
                        [field.field_id]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div style={styles.actions}>
              <button
                style={styles.btnGreen}
                onClick={async () => {
                  for (const [fieldId, answer] of Object.entries(formAnswers)) {
                    await supabase
                      .from("application_form_responses")
                      .update({ answer })
                      .eq("application_id", editApp.application_id)
                      .eq("field_id", fieldId);
                  }

                  alert("Updated!");
                  setEditMode(false);
                  setEditApp(null);
                  load();
                }}
              >
                Save
              </button>

              <button
                style={styles.btnRed}
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 15,
  },

  card: {
    background: "#fff",
    padding: 18,
    borderRadius: 14,
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
  },

  date: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 10,
  },

  badge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 10,
  },

  actions: {
    display: "flex",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },

  btnBlue: {
    padding: "6px 12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  btnGreen: {
    padding: "6px 12px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  btnRed: {
    padding: "6px 12px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modal: {
    background: "#fff",
    padding: 20,
    borderRadius: 14,
    width: "400px",
  },

  modalLarge: {
    background: "#fff",
    padding: 25,
    borderRadius: 14,
    width: "500px",
    maxHeight: "80vh",
    overflowY: "auto",
  },

  subtitle: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 15,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  label: {
    fontSize: 13,
    fontWeight: 600,
  },

  input: {
    width: "100%",
    padding: 8,
    border: "1px solid #ddd",
    borderRadius: 6,
  },

  answerBox: {
    marginBottom: 10,
    padding: 10,
    background: "#f1f5f9",
    borderRadius: 8,
  },
};