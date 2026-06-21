import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef(null);

  const STATUS_CYCLE = ["Compliant", "Non-Compliant"];

  // STUDENT FORM STATE
  const [form, setForm] = useState({
  first_name: "",
  middle_name: "",
  last_name: "",

  school_id: "",
  course: "",
  year_level: "",
  ethnicity: "",
  gender: "",
  contact_number: "",
});

  const fetchEligibilityRequirements = async () => {
  if (!student) {
    alert("Please save your student profile first.");
    return;
  }

  try {
    // get all eligibility requirements
    const { data: requirementsData, error: reqError } =
      await supabase
        .from("eligibility_requirements")
        .select("*");

    if (reqError) throw reqError;

    // get existing student profile records
    const { data: existing, error: existingError } =
      await supabase
        .from("student_eligibility_profile")
        .select("eligibility_requirement_id")
        .eq("student_id", student.student_id);

    if (existingError) throw existingError;

    const existingIds = new Set(
      existing.map(
        (r) => r.eligibility_requirement_id
      )
    );

    // create only missing records
    const missingRequirements = requirementsData
      .filter(
        (r) =>
          !existingIds.has(
            r.eligibility_requirement_id
          )
      )
      .map((r) => ({
        student_id: student.student_id,
        eligibility_requirement_id:
          r.eligibility_requirement_id,
        status: "Pending",
      }));

    if (missingRequirements.length > 0) {
      const { error } = await supabase
        .from("student_eligibility_profile")
        .insert(missingRequirements);

      if (error) throw error;
    }

    await load();

    alert(
      `${missingRequirements.length} eligibility records added.`
    );
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) return;

      // GET USER ROW
      const { data: userRow } = await supabase
  .from("users")
  .select(`
    user_id,
    first_name,
    middle_name,
    last_name
  `)
  .eq("auth_id", user.id)
  .maybeSingle();

      // GET STUDENT
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", userRow.user_id)
        .maybeSingle();

      setStudent(studentData);

      // preload form if exists
      if (studentData) {
        if (studentData) {
  setForm({
    first_name: userRow?.first_name || "",
    middle_name: userRow?.middle_name || "",
    last_name: userRow?.last_name || "",

    school_id: studentData.school_id || "",
    course: studentData.course || "",
    year_level: studentData.year_level || "",
    ethnicity: studentData.ethnicity || "",
    gender: studentData.gender || "",
    contact_number: studentData.contact_number || "",
  });
}
      }

      // REQUIREMENTS
      const { data: req } = await supabase
        .from("eligibility_requirements")
        .select("*");

      const { data: profile } = await supabase
        .from("student_eligibility_profile")
        .select("*")
        .eq("student_id", studentData?.student_id);

      const merged = (req || []).map((r) => {
        const match = (profile || []).find(
          (p) =>
            p.eligibility_requirement_id ===
            r.eligibility_requirement_id
        );

        return {
          ...r,
          status: match?.status,
        };
      });

      setRequirements(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
 
  //AUTO SAVE STUDENT
  const autoSaveStudent = (updatedForm) => {
  clearTimeout(saveTimeout.current);

  saveTimeout.current = setTimeout(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) return;

      const { data: userRow } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!userRow) return;
      
      await supabase
  .from("users")
  .update({
    first_name: updatedForm.first_name,
    middle_name: updatedForm.middle_name,
    last_name: updatedForm.last_name,
  })
  .eq("user_id", userRow.user_id);

      const payload = {
        user_id: userRow.user_id,
        school_id: updatedForm.school_id,
        course: updatedForm.course,
        year_level: updatedForm.year_level,
        gender: updatedForm.gender,
        ethnicity: updatedForm.ethnicity,
        contact_number: updatedForm.contact_number,
      };

      if (student) {
        await supabase
          .from("students")
          .update(payload)
          .eq("student_id", student.student_id);
      } else {
        const { data: inserted } = await supabase
          .from("students")
          .insert(payload)
          .select()
          .maybeSingle();

        if (inserted) setStudent(inserted);
      }
    } catch (err) {
      console.error("Auto-save error:", err);
    }
  }, 500); // wait 0.5s after typing stops
};

  // SAVE STUDENT DETAILS (INSERT / UPDATE)
  const saveStudent = async () => {
    setSaving(true);

    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      const { data: userRow } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      const payload = {
        user_id: userRow.user_id,
        school_id: form.school_id,
        course: form.course,
        year_level: form.year_level,
        gender: form.gender,
        ethnicity: form.ethnicity,
        contact_number: form.contact_number,
      };

      if (student) {
        await supabase
          .from("students")
          .update(payload)
          .eq("student_id", student.student_id);
      } else {
        await supabase.from("students").insert(payload);
      }

      await load();
    } catch (err) {
      console.error(err);
    }

    setSaving(false);
  };

  const toggleCompliance = async (reqItem) => {
    const next =
      STATUS_CYCLE[
        (STATUS_CYCLE.indexOf(reqItem.status) + 1) %
          STATUS_CYCLE.length
      ];

    const { error } = await supabase
      .from("student_eligibility_profile")
      .upsert(
        {
          student_id: student.student_id,
          eligibility_requirement_id:
            reqItem.eligibility_requirement_id,
          status: next,
        },
        {
          onConflict:
            "student_id,eligibility_requirement_id",
        }
      );

    if (error) return alert(error.message);

    setRequirements((prev) =>
      prev.map((r) =>
        r.eligibility_requirement_id ===
        reqItem.eligibility_requirement_id
          ? { ...r, status: next }
          : r
      )
    );
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={styles.page}>
      <h1>Student Profile</h1>

      {/* ================= STUDENT FORM ================= */}
      <div style={styles.card}>
  <div style={styles.cardHeader}>
    <h2 style={{ margin: 0 }}>Student Information</h2>

    <span
      style={{
        fontSize: 13,
        color: "#16a34a",
      }}
    >
      Auto Saved
    </span>
  </div>

  <div style={styles.formGrid}>
    <div>
  <label style={styles.fieldLabel}>First Name</label>

  <input
    style={styles.input}
    value={form.first_name}
    onChange={(e) => {
      const updated = {
        ...form,
        first_name: e.target.value,
      };
      setForm(updated);
      autoSaveStudent(updated);
    }}
  />
</div>

<div>
  <label style={styles.fieldLabel}>Middle Name</label>

  <input
    style={styles.input}
    value={form.middle_name}
    onChange={(e) => {
      const updated = {
        ...form,
        middle_name: e.target.value,
      };
      setForm(updated);
      autoSaveStudent(updated);
    }}
  />
</div>

<div>
  <label style={styles.fieldLabel}>Last Name</label>

  <input
    style={styles.input}
    value={form.last_name}
    onChange={(e) => {
      const updated = {
        ...form,
        last_name: e.target.value,
      };
      setForm(updated);
      autoSaveStudent(updated);
    }}
  />
</div>


    <div>
      <label style={styles.fieldLabel}>School ID</label>
      <input
        style={styles.input}
        value={form.school_id}
        onChange={(e) => {
          const updated = {
            ...form,
            school_id: e.target.value,
          };
          setForm(updated);
          autoSaveStudent(updated);
        }}
      />
    </div>

    <div>
      <label style={styles.fieldLabel}>Program</label>
      <input
        style={styles.input}
        value={form.course}
        onChange={(e) => {
          const updated = {
            ...form,
            course: e.target.value,
          };
          setForm(updated);
          autoSaveStudent(updated);
        }}
      />
    </div>

    <div>
      <label style={styles.fieldLabel}>Year Level</label>
      <input
        style={styles.input}
        value={form.year_level}
        onChange={(e) => {
          const updated = {
            ...form,
            year_level: e.target.value,
          };
          setForm(updated);
          autoSaveStudent(updated);
        }}
      />
    </div>

    <div>
      <label style={styles.fieldLabel}>Gender</label>
      <input
        style={styles.input}
        value={form.gender}
        onChange={(e) => {
          const updated = {
            ...form,
            gender: e.target.value,
          };
          setForm(updated);
          autoSaveStudent(updated);
        }}
      />
    </div>

    <div>
      <label style={styles.fieldLabel}>Ethnicity</label>
      <input
        style={styles.input}
        value={form.ethnicity}
        onChange={(e) => {
          const updated = {
            ...form,
            ethnicity: e.target.value,
          };
          setForm(updated);
          autoSaveStudent(updated);
        }}
      />
    </div>

    <div>
      <label style={styles.fieldLabel}>Contact Number</label>
      <input
        style={styles.input}
        value={form.contact_number}
        onChange={(e) => {
          const updated = {
            ...form,
            contact_number: e.target.value,
          };
          setForm(updated);
          autoSaveStudent(updated);
        }}
      />
    </div>
  </div>
</div>



      {/* ================= REQUIREMENTS ================= */}
      <h2> Compliance Checker</h2>
   <div style={{ marginBottom: 15 }}>
  <button
    onClick={fetchEligibilityRequirements}
    style={{
      background: "#2563eb",
      color: "white",
      border: "none",
      padding: "10px 14px",
      borderRadius: 6,
      cursor: "pointer",
    }}
  >
    Refresh
  </button>
</div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {requirements.map((r) => (
            <tr key={r.eligibility_requirement_id}>
              <td>{r.requirement_name}</td>

              <td>{r.description}</td>

              <td>
                <span
                  onClick={() => toggleCompliance(r)}
                  style={{
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: 6,
                    background:
                      r.status === "Compliant"
                        ? "#d1fae5"
                        : "#fef3c7",
                    color:
                      r.status === "Compliant"
                        ? "green"
                        : "orange",
                    fontWeight: "bold",
                  }}
                >
                  {r.status || "Pending"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
    </div>
  );
}

const styles = {
  page: {
    padding: 20,
    fontFamily: "Arial",
    background: "#f5f6f8",
    minHeight: "100vh",
  },
  card: {
  background: "#ffffff",
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
},
  table: {
    width: "100%",
    background: "white",
    borderCollapse: "collapse",
  },
  label: {
    fontWeight: "bold",
    paddingRight: 10,
    width: "30%",
  },
  formGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
},
input: {
  width: "100%",
  height: 42,
  padding: "0 12px",
  border: "1px solid #dbe2ea",
  borderRadius: 10,
  background: "#ffffff",
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
},
};