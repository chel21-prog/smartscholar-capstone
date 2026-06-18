import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Scholarships() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [editMode, setEditMode] = useState(false);
const [editingId, setEditingId] = useState(null);

  // SCHOLARSHIP INFO
  const [name, setName] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  // REQUIREMENTS
  const [appReq, setAppReq] = useState([]);
  const [eligReq, setEligReq] = useState([]);
  const [selectedReq, setSelectedReq] = useState([]);

  // FORM BUILDER
  const [formTitle, setFormTitle] = useState("");
  const [terms, setTerms] = useState("");

// REMOVE FIELD FROM FORM BUILDER
const removeField = (index) => {
  setFields(fields.filter((_, i) => i !== index));
};

  // VIEW REQUIREMENTS MODAL
const [viewOpen, setViewOpen] = useState(false);
const [viewRequirements, setViewRequirements] = useState({
  application: [],
  eligibility: [],
});

// VIEW FORM MODAL
const [viewFormOpen, setViewFormOpen] = useState(false);
const [formData, setFormData] = useState({
  title: "",
  terms: "",
  fields: [],
});

// STATUS TOGGLE
const STATUS_OPTIONS = [
  "Active",
  "Suspended",
  "Terminated",
];

const toggleStatus = async (scholarship) => {
  const currentIndex = STATUS_OPTIONS.indexOf(
    scholarship.status
  );

  const nextStatus =
    STATUS_OPTIONS[
      (currentIndex + 1) % STATUS_OPTIONS.length
    ];

  const { data, error } = await supabase
    .from("scholarships")
    .update({ status: nextStatus })
    .eq("scholarship_id", scholarship.scholarship_id)
    .select();

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) {
    alert(error.message);
    return;
  }

  load();
};

  const [fields, setFields] = useState([]);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("scholarships").select("*");
    setList(data || []);

    const { data: app } = await supabase.from("application_requirements").select("*");
    const { data: elig } = await supabase.from("eligibility_requirements").select("*");

    setAppReq(app || []);
    setEligReq(elig || []);
  };

  const toggleReq = (id, type) => {
    const exists = selectedReq.find((r) => r.id === id && r.type === type);

    if (exists) {
      setSelectedReq(selectedReq.filter((r) => !(r.id === id && r.type === type)));
    } else {
      setSelectedReq([...selectedReq, { id, type }]);
    }
  };

  const addField = () => {
    if (!fieldLabel.trim()) return;

    setFields([
      ...fields,
      {
        label: fieldLabel,
        type: fieldType,
        required: isRequired,
      },
    ]);

    setFieldLabel("");
    setIsRequired(false);
  };

  const editScholarship = async (scholarship) => {
  setEditMode(true);
  setEditingId(scholarship.scholarship_id);

  setName(scholarship.scholarship_name || "");
  setSponsor(scholarship.sponsor || "");
  setDescription(scholarship.description || "");
  setAmount(scholarship.amount || "");
  setDeadline(scholarship.submission_deadline || "");
  console.log("EDIT DATA:", scholarship);

  // Load form
  const { data: form } = await supabase
    .from("scholarship_application_forms")
    .select("*")
    .eq("scholarship_id", scholarship.scholarship_id)
    .single();

  if (form) {
    setFormTitle(form.form_title || "");
    setTerms(form.terms_and_conditions || "");

    const { data: formFields } = await supabase
      .from("scholarship_form_fields")
      .select("*")
      .eq("form_id", form.form_id);

    setFields(
      (formFields || []).map((f) => ({
        label: f.label,
        type: f.field_type,
        required: f.is_required,
      }))
    );
  }

  const { data: reqs } = await supabase
  .from("scholarship_requirements")
  .select("*")
  .eq("scholarship_id", scholarship.scholarship_id);

if (reqs) {
  setSelectedReq(
    reqs.map((r) => ({
      id:
        r.application_requirement_id ||
        r.eligibility_requirement_id,
      type:
        r.application_requirement_id
          ? "app"
          : "elig",
    }))
  );
}

  setOpen(true);
};

//Update scholarship
const updateScholarship = async () => {
  if (!editingId) return alert("No scholarship selected");

  const { error } = await supabase
    .from("scholarships")
    .update({
      scholarship_name: name,
      sponsor,
      description,
      amount: parseInt(amount || 0),
      submission_deadline: deadline,
    })
    .eq("scholarship_id", editingId);
  
  if (error) return alert(error.message);
  console.log("UPDATE SUCCESS:", editingId);

  await supabase
  .from("scholarship_requirements")
  .delete()
  .eq("scholarship_id", editingId);

const reqPayload = selectedReq.map((r) => ({
  scholarship_id: editingId,
  application_requirement_id:
    r.type === "app" ? r.id : null,
  eligibility_requirement_id:
    r.type === "elig" ? r.id : null,
}));

if (reqPayload.length) {
  await supabase
    .from("scholarship_requirements")
    .insert(reqPayload);
}

  // OPTIONAL: update form title + terms
  const { data: form } = await supabase
    .from("scholarship_application_forms")
    .select("form_id")
    .eq("scholarship_id", editingId)
    .single();

  if (form) {
    await supabase
      .from("scholarship_application_forms")
      .update({
        form_title: formTitle,
        terms_and_conditions: terms,
      })
      .eq("form_id", form.form_id);
  }

  await supabase
  .from("scholarship_form_fields")
  .delete()
  .eq("form_id", form.form_id);

if (fields.length) {
  const fieldPayload = fields.map((f) => ({
    form_id: form.form_id,
    label: f.label,
    field_type: f.type,
    is_required: f.required,
  }));

  await supabase
    .from("scholarship_form_fields")
    .insert(fieldPayload);
}

  console.log("UPDATING ID:", editingId);
  reset();
  setOpen(false);
  setEditMode(false);
  setEditingId(null);
  load();
};

//Create scholarship
  const createScholarship = async () => {
    if (!name || !formTitle || !terms) {
      return alert("Name, form title, and terms are required");
    }

    const { data: scholarship, error } = await supabase
      .from("scholarships")
      .insert({
        scholarship_name: name,
        sponsor,
        description,
        amount: parseInt(amount || 0),
        submission_deadline: deadline,
        status: "Active",
      })
      .select()
      .single();

    if (error) return alert(error.message);

    const scholarshipId = scholarship.scholarship_id;

    const reqPayload = selectedReq.map((r) => ({
      scholarship_id: scholarshipId,
      application_requirement_id: r.type === "app" ? r.id : null,
      eligibility_requirement_id: r.type === "elig" ? r.id : null,
    }));

    if (reqPayload.length) {
      await supabase.from("scholarship_requirements").insert(reqPayload);
    }

    const { data: form, error: formError } = await supabase
      .from("scholarship_application_forms")
      .insert({
        scholarship_id: scholarshipId,
        form_title: formTitle,
        terms_and_conditions: terms,
      })
      .select()
      .single();

    if (formError) return alert(formError.message);

    if (fields.length) {
      const fieldPayload = fields.map((f) => ({
        form_id: form.form_id,
        label: f.label,
        field_type: f.type,
        is_required: f.required,
      }));

      await supabase.from("scholarship_form_fields").insert(fieldPayload);
    }

    reset();
    setOpen(false);
    load();
  };

// VIEW REQUIREMENTS
const viewRequirementsModal = async (scholarshipId) => {
  const { data } = await supabase
    .from("scholarship_requirements")
    .select(`
      application_requirements(requirement_name),
      eligibility_requirements(requirement_name)
    `)
    .eq("scholarship_id", scholarshipId);

  setViewRequirements({
    application:
      data
        ?.filter((r) => r.application_requirements)
        .map((r) => r.application_requirements.requirement_name) || [],

    eligibility:
      data
        ?.filter((r) => r.eligibility_requirements)
        .map((r) => r.eligibility_requirements.requirement_name) || [],
  });

  setViewOpen(true);
};

// VIEW FORM
const viewForm = async (scholarshipId) => {
  const { data: form, error } = await supabase
    .from("scholarship_application_forms")
    .select("*")
    .eq("scholarship_id", scholarshipId)
    .single();

  if (error || !form) {
    alert("No form found.");
    return;
  }

  const { data: formFields } = await supabase
    .from("scholarship_form_fields")
    .select("*")
    .eq("form_id", form.form_id);

  setFormData({
    title: form.form_title,
    terms: form.terms_and_conditions,
    fields: formFields || [],
  });

  setViewFormOpen(true);
};

  const reset = () => {
    setName("");
    setSponsor("");
    setDescription("");
    setAmount("");
    setDeadline("");
    setSelectedReq([]);
    setFormTitle("");
    setTerms("");
    setFields([]);
  };

  return (
    <div style={page}>
      <div style={header}>
        <h1>Scholarships</h1>
        <button style={btn} onClick={() => setOpen(true)}>
          + Create Scholarship
        </button>
      </div>

      {/* TABLE STYLE LIST */}
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Sponsor</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Requirements</th>
              <th>Form</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
  {list.map((s) => (
    <tr key={s.scholarship_id}>
      <td>{s.scholarship_name}</td>
      <td>{s.sponsor}</td>
      <td>{s.description}</td>
      <td>₱{s.amount}</td>
      <td>{s.submission_deadline}</td>

      {/* STATUS TOGGLE */}
      <td>
        <button
          onClick={() => toggleStatus(s)}
          style={{
            padding: "6px 12px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            color: "white",
            background:
            s.status === "Active"
            ? "green"
            : s.status === "Suspended"
            ? "orange"
            : "red",
          }}
        >
          {s.status}
        </button>
      </td>

      {/* VIEW REQUIREMENTS */}
      <td>
        <button
          onClick={() =>
            viewRequirementsModal(s.scholarship_id)
          }
          style={btn}
        >
          View
        </button>
      </td>
      <td>
          <button
            onClick={() => viewForm(s.scholarship_id)}
            style={btn}
          >
          View Form
          </button>
        </td>
      <td>
        <button
        onClick={() => editScholarship(s)}
        style={{
        padding: "8px 12px",
        background: "#f59e0b",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        }}
        >
        Edit
        </button>
         </td>
          </tr>
          ))}
         </tbody>
        </table>
      </div>


      {/* REQUIREMENTS VIEW MODAL */}
{viewOpen && (
  <div style={overlay}>
    <div style={modal}>
      <h2>{editMode ? "Edit Scholarship" : "Create Scholarship"}</h2>

      <h3>Application Requirements</h3>
      {viewRequirements.application.length === 0 ? (
        <p>No application requirements.</p>
      ) : (
        viewRequirements.application.map((r, i) => (
          <div key={i}>• {r}</div>
        ))
      )}

      <h3 style={{ marginTop: 20 }}>
        Eligibility Requirements
      </h3>

      {viewRequirements.eligibility.length === 0 ? (
        <p>No eligibility requirements.</p>
      ) : (
        viewRequirements.eligibility.map((r, i) => (
          <div key={i}>• {r}</div>
        ))
      )}

      <div style={{ marginTop: 20 }}>
        <button
          style={btn}
          onClick={() => setViewOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

{/* VIEW FORM MODAL */}
{viewFormOpen && (
  <div style={overlay}>
    <div style={modal}>
      <h2>{formData.title}</h2>

      <h3>Terms & Conditions</h3>
      <p>{formData.terms}</p>

      <h3>Form Fields</h3>

      {formData.fields.length === 0 ? (
        <p>No fields found.</p>
      ) : (
        formData.fields.map((field) => (
          <div
            key={field.field_id}
            style={{
              padding: "8px",
              marginBottom: "8px",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          >
            <strong>{field.label}</strong>
            <br />
            Type: {field.field_type}
            <br />
            Required: {field.is_required ? "Yes" : "No"}
          </div>
        ))
      )}

      <div style={{ marginTop: 20 }}>
        <button
          style={btn}
          onClick={() => setViewFormOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* MODAL (UNCHANGED LOGIC UI NOT TOUCHED) */}
      {open && (
        <div style={overlay}>
          <div style={modal}>
            <h2>Create Scholarship</h2>

            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={input} />
            <input placeholder="Sponsor" value={sponsor} onChange={(e) => setSponsor(e.target.value)} style={input} />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={input} />
            <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} style={input} />
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={input} />

            <h3>Requirements Checklist</h3>

            <h4>Application</h4>
            {appReq.map((r) => (
              <label key={r.application_requirement_id} style={checkItem}>
                <input
  type="checkbox"
  checked={selectedReq.some(
    x =>
      x.id === r.application_requirement_id &&
      x.type === "app"
  )}
  onChange={() =>
    toggleReq(r.application_requirement_id, "app")
  }
/>
                {r.requirement_name}
              </label>
            ))}

            <h4>Eligibility</h4>
            {eligReq.map((r) => (
              <label key={r.eligibility_requirement_id} style={checkItem}>
                <input
  type="checkbox"
  checked={selectedReq.some(
    x =>
      x.id === r.eligibility_requirement_id &&
      x.type === "elig"
  )}
  onChange={() =>
    toggleReq(r.eligibility_requirement_id, "elig")
  }
/>
                {r.requirement_name}
              </label>
            ))}

            <h3>Form Builder</h3>

            <input placeholder="Form Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} style={input} />

            <textarea placeholder="Terms & Conditions" value={terms} onChange={(e) => setTerms(e.target.value)} style={input} />

            <h4>Fields Preview</h4>
            {fields.map((f, i) => (
  <div
    key={i}
    style={{
      ...fieldPreview,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <div>
      <b>{f.label}</b> ({f.type})
      {f.required && " *"}
    </div>

    <button
      type="button"
      onClick={() => removeField(i)}
      style={{
        background: "#dc2626",
        color: "white",
        border: "none",
        padding: "6px 10px",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      Remove
    </button>
  </div>
))}

            <input placeholder="Field Label" value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} style={input} />

            <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} style={input}>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="file">File</option>
            </select>

            <label>
              <input type="checkbox" checked={isRequired} onChange={() => setIsRequired(!isRequired)} />
              Required
            </label>

            <button onClick={addField} style={smallBtn}>+ Add Field</button>

            <div style={actions}>
              <button
  onClick={() => {
    setOpen(false);
    setEditMode(false);
    setEditingId(null);
    reset();
  }}
>
  Cancel
</button>

              <button
  onClick={
    editMode
      ? updateScholarship
      : createScholarship
  }
  style={btn}
>
  {editMode ? "Update" : "Save"}
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* TABLE STYLE ADDED */
const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const page = { padding: 20, fontFamily: "Arial", background: "#f5f6f8", minHeight: "100vh" };
const header = { display: "flex", justifyContent: "space-between" };
const card = { background: "white", padding: 20, marginTop: 20 };

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modal = {
  background: "white",
  padding: 20,
  width: 650,
  maxHeight: "90vh",
  overflowY: "auto",
};

const input = { width: "100%", padding: 8, marginBottom: 10 };

const btn = { padding: 10, background: "#2563eb", color: "white", border: "none" };
const smallBtn = { padding: 6, background: "green", color: "white", border: "none" };
const actions = { display: "flex", justifyContent: "space-between", marginTop: 10 };

const checkItem = { display: "block", padding: "6px" };

const fieldPreview = {
  padding: "10px",
  marginBottom: "6px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  fontSize: "14px",
};