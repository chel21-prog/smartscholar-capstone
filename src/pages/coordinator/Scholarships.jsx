import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Scholarships() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [editMode, setEditMode] = useState(false);
const [editingId, setEditingId] = useState(null);

  const ITEMS_PER_PAGE = 10;
const [currentPage, setCurrentPage] = useState(1);
// SEARCH & FILTERS
const [statusFilter, setStatusFilter] = useState("All");
const [sponsorFilter, setSponsorFilter] = useState("All");
const [search, setSearch] = useState("");
  // SCHOLARSHIP INFO
  const [name, setName] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [slots, setSlots] = useState("");
  const [deadline, setDeadline] = useState("");

  // REQUIREMENTS
  const [appReq, setAppReq] = useState([]);
  const [eligReq, setEligReq] = useState([]);
  const [selectedReq, setSelectedReq] = useState([]);
  
  const [newAppName, setNewAppName] = useState("");
const [newAppType, setNewAppType] = useState("Document");

const [newEligName, setNewEligName] = useState("");
const [newEligType, setNewEligType] = useState("Other");

const [showAppForm, setShowAppForm] = useState(false);
const [showEligForm, setShowEligForm] = useState(false); 

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

  const addApplicationRequirement = async () => {
  if (!newAppName.trim()) return;

  const { data, error } = await supabase
    .from("application_requirements")
    .insert({
      requirement_name: newAppName,
      requirement_type: newAppType,
    })
    .select()
    .single();

  if (error) return alert(error.message);

  setAppReq([...appReq, data]);

  setSelectedReq([
    ...selectedReq,
    {
      id: data.application_requirement_id,
      type: "app",
    },
  ]);

  setNewAppName("");
  setShowAppForm(false);
};

const addEligibilityRequirement = async () => {
  if (!newEligName.trim()) return;

  const { data, error } = await supabase
    .from("eligibility_requirements")
    .insert({
      requirement_name: newEligName,
      requirement_type: newEligType,
    })
    .select()
    .single();

  if (error) return alert(error.message);

  setEligReq([...eligReq, data]);

  setSelectedReq([
    ...selectedReq,
    {
      id: data.eligibility_requirement_id,
      type: "elig",
    },
  ]);

  setNewEligName("");
  setShowEligForm(false);
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
  setSlots(scholarship.slots || "");
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
      slots: parseInt(slots || 0),
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
  slots: parseInt(slots || 0),
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
    setSlots("");
    setDeadline("");
    setSelectedReq([]);
    setFormTitle("");
    setTerms("");
    setFields([]);
  };

  const closeModal = () => {
  setOpen(false);
  setViewOpen(false);
  setViewFormOpen(false);

  reset();

  setEditMode(false);
  setEditingId(null);

  setShowAppForm(false);
  setShowEligForm(false);
};
  
  

const sponsors = [
  "All",
  ...new Set(list.map((s) => s.sponsor).filter(Boolean)),
];

const filteredScholarships = list.filter((s) => {
  const keyword = search.toLowerCase();

  const matchesSearch =
    (s.scholarship_name || "").toLowerCase().includes(keyword) ||
    (s.sponsor || "").toLowerCase().includes(keyword) ||
    (s.description || "").toLowerCase().includes(keyword) ||
    String(s.amount || "").includes(keyword) ||
    String(s.slots || "").includes(keyword) ||
    (s.submission_deadline || "").toLowerCase().includes(keyword) ||
    (s.status || "").toLowerCase().includes(keyword);

  const matchesStatus =
    statusFilter === "All" ||
    s.status === statusFilter;

  const matchesSponsor =
    sponsorFilter === "All" ||
    s.sponsor === sponsorFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesSponsor
  );
});
const totalPages = Math.ceil(
  filteredScholarships.length / ITEMS_PER_PAGE
);

const paginatedScholarships = filteredScholarships.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);


  return (
    <div style={styles.page}>
      <div style={styles.header}>
  <div style={styles.titleBlock}>
    <h1 style={styles.title}>Scholarships</h1>
    <p style={styles.subtitle}>
      Manage scholarships, requirements, and application forms
    </p>
  </div>

  <button
    style={styles.btnPrimary}
    onClick={() => setOpen(true)}
  >
    + Create Scholarship
  </button>
</div>


      <div
  style={{
    display: "flex",
    gap: 15,
    marginBottom: 20,
    flexWrap: "wrap",
    alignItems: "center",
  }}
>
  <input
    type="text"
    placeholder="Search scholarships..."
    value={search}
    onChange={(e) => {
      setSearch(e.target.value);
      setCurrentPage(1);
    }}
    style={{
      ...styles.input,
      maxWidth: 320,
    }}
  />

  <select
    value={statusFilter}
    onChange={(e) => {
      setStatusFilter(e.target.value);
      setCurrentPage(1);
    }}
    style={{
      ...styles.input,
      maxWidth: 180,
    }}
  >
    <option value="All">All Status</option>
    <option value="Active">Active</option>
    <option value="Suspended">Suspended</option>
    <option value="Terminated">Terminated</option>
  </select>

  <select
    value={sponsorFilter}
    onChange={(e) => {
      setSponsorFilter(e.target.value);
      setCurrentPage(1);
    }}
    style={{
      ...styles.input,
      maxWidth: 220,
    }}
  >
    {sponsors.map((sponsor) => (
      <option key={sponsor} value={sponsor}>
        {sponsor === "All"
          ? "All Sponsors"
          : sponsor}
      </option>
    ))}
  </select>
</div>

      {/* TABLE STYLE LIST */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
  <tr>
    <th style={styles.th}>Name</th>
    <th style={styles.th}>Sponsor</th>
    <th style={styles.th}>Description</th>
    <th style={styles.th}>Amount</th>
    <th style={styles.th}>Slots</th>
    <th style={styles.th}>Deadline</th>
    <th style={styles.th}>Status</th>
    <th style={styles.th}>Requirements</th>
    <th style={styles.th}>Form</th>
    <th style={styles.th}>Action</th>
  </tr>
</thead>

          <tbody>
  {paginatedScholarships.map((s, index) => (
  <tr
    key={s.scholarship_id}
    style={
      ((currentPage - 1) * ITEMS_PER_PAGE + index) % 2 === 0
        ? styles.rowEven
        : styles.rowOdd
    }
  >
  <td style={styles.td}>{s.scholarship_name}</td>
  <td style={styles.td}>{s.sponsor}</td>
  <td style={styles.td}>{s.description}</td>
  <td style={styles.td}>₱{s.amount}</td>
  <td style={styles.td}>{s.slots}</td>
  <td style={styles.td}>{s.submission_deadline}</td>

  <td style={styles.td}>
    <button
  onClick={() => toggleStatus(s)}
  style={{
    ...styles.badge,
    background:
      s.status === "Active"
        ? "#dcfce7"
        : s.status === "Suspended"
        ? "#fef3c7"
        : "#fee2e2",
    color:
      s.status === "Active"
        ? "#166534"
        : s.status === "Suspended"
        ? "#92400e"
        : "#991b1b",
    border: "none",
    cursor: "pointer",
  }}
>
  {s.status}
</button>
  </td>

  <td style={styles.td}>
    <button style={styles.btnAccent} onClick={() => viewRequirementsModal(s.scholarship_id)}>
      View
    </button>
  </td>

  <td style={styles.td}>
    <button style={styles.btnAccent} onClick={() => viewForm(s.scholarship_id)}>
      View
    </button>
  </td>

  <td style={styles.td}>
    <button style={styles.btn} onClick={() => editScholarship(s)}>
      Edit
    </button>
  </td>
</tr>
          ))}
         </tbody>
        </table>
      </div>

      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    flexWrap: "wrap",
    gap: 10,
  }}
>
  <span>
    Showing{" "}
    {filteredScholarships.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1}
    {" - "}
    {Math.min(
  currentPage * ITEMS_PER_PAGE,
  filteredScholarships.length
)}{" "}
    of {filteredScholarships.length}
  </span>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}
  >
    <button
      style={styles.pageButton}
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage((page) => page - 1)
      }
    >
      Previous
    </button>

    <span>
      Page {totalPages === 0 ? 0 : currentPage} of{" "}
      {totalPages || 1}
    </span>

    <button
      style={styles.pageButton}
      disabled={
        currentPage === totalPages ||
        totalPages === 0
      }
      onClick={() =>
        setCurrentPage((page) => page + 1)
      }
    >
      Next
    </button>
  </div>
</div>
      


      {/* REQUIREMENTS VIEW MODAL */}
{viewOpen && (
  <div
    style={styles.overlay}
    onClick={closeModal}
  >
    <div
      style={styles.modal}
      onClick={(e) => e.stopPropagation()}
    >

    <div style={styles.modalHeader}>
        <h2 style={styles.modalTitle}>
            {editMode ? "Edit Scholarship" : "Create Scholarship"}
        </h2>

        <button
    style={styles.closeButton}
    onClick={closeModal}
>
    ×
</button>
    </div>

      <h3 style={styles.sectionTitle}>Application Requirements</h3>
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
          style={styles.btn}
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
  <div
    style={styles.overlay}
    onClick={closeModal}
  >
    <div
      style={styles.modal}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={styles.modalHeader}>
    <h2 style={styles.modalTitle}>
        {formData.title}
    </h2>

    <button
        style={styles.closeButton}
        onClick={closeModal}
    >
        ×
    </button>
</div>

      <h3 style={styles.sectionTitle}>Terms & Conditions</h3>
      <p>{formData.terms}</p>

      <h3 style={styles.sectionTitle}>Form Fields</h3>

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
  style={styles.btn}
  onClick={closeModal}
>
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* MODAL (UNCHANGED LOGIC UI NOT TOUCHED) */}
      {open && (
  <div
    style={styles.overlay}
    onClick={closeModal}
  >
    <div
      style={styles.modal}
      onClick={(e) => e.stopPropagation()}
    >
            <div style={styles.modalHeader}>
    <h2 style={styles.modalTitle}>
        {editMode
            ? "Edit Scholarship"
            : "Create Scholarship"}
    </h2>

    <button
        style={styles.closeButton}
        onClick={closeModal}
    >
        ×
    </button>
</div>

<div style={styles.section}>
  <h3 style={styles.sectionTitle}>
    Scholarship Information
  </h3>
            <div style={styles.grid2}>
            <input placeholder="Scholarship Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
            <input placeholder="Sponsor" value={sponsor} onChange={(e) => setSponsor(e.target.value)} style={styles.input} />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={styles.textarea} />
            <input placeholder="Amount For Each Grantee" value={amount} onChange={(e) => setAmount(e.target.value)} style={styles.input} />
            <input
  type="number"
  placeholder="Amount Of Slots Available"
  value={slots}
  onChange={(e) => setSlots(e.target.value)}
  style={styles.input}
/>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={styles.input} />
</div></div>


           <div style={styles.section}>
  <h3 style={styles.sectionTitle}>
    Requirements
  </h3>

            <h4>Application</h4>

            <button
  type="button"
  style={styles.smallBtn}
  onClick={() => setShowAppForm(!showAppForm)}
>
  + New Requirement
</button>

{showAppForm && (
  <>
    <input
      placeholder="Requirement Name"
      value={newAppName}
      onChange={(e) => setNewAppName(e.target.value)}
      style={styles.input}
    />

    <select
      value={newAppType}
      onChange={(e) => setNewAppType(e.target.value)}
      style={styles.input}
    >
      <option>Document</option>
      <option>Grade</option>
      <option>Income</option>
      <option>Other</option>
    </select>

    <button
      type="button"
      style={styles.btn}
      onClick={addApplicationRequirement}
    >
      Save Requirement
    </button>
  </>
)}
            {appReq.map((r) => (
              <label key={r.application_requirement_id} style={styles.checkItem}>
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
            <button
  type="button"
  style={styles.smallBtn}
  onClick={() => setShowEligForm(!showEligForm)}
>
  + New Requirement
</button>

{showEligForm && (
  <>
    <input
      placeholder="Requirement Name"
      value={newEligName}
      onChange={(e) => setNewEligName(e.target.value)}
      style={styles.input}
    />

    <select
      value={newEligType}
      onChange={(e) => setNewEligType(e.target.value)}
      style={styles.input}
    >
      <option>Status</option>
      <option>Other</option>
    </select>

    <button
      type="button"
      style={styles.btn}
      onClick={addEligibilityRequirement}
    >
      Save Requirement
    </button>
  </>
)}
            {eligReq.map((r) => (
              <label key={r.eligibility_requirement_id} style={styles.checkItem}>
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

</div>



            <div style={styles.section}>
  <h3 style={styles.sectionTitle}>
    Application Form
  </h3>
            
            <input placeholder="Form Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} style={styles.textarea} />

            <textarea placeholder="Terms & Conditions" value={terms} onChange={(e) => setTerms(e.target.value)} style={styles.textarea} />
            
            <h4>Fields Preview</h4>
            {fields.map((f, i) => (
              
  <div
    key={i}
    style={{
      ...styles.fieldPreview,
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
            <div style={styles.fieldBuilder}>
            <input placeholder="Field Label" value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} style={styles.input} />

            <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} style={styles.input}>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="file">File</option>
            </select>

            <label>
              <input type="checkbox" checked={isRequired} onChange={() => setIsRequired(!isRequired)} />
              Required
            </label>

            <button onClick={addField} style={styles.smallBtn}>+ Add Field</button>
            </div></div>

            <div style={styles.actions}>
              <button onClick={closeModal} style={styles.btn}>
  Cancel
</button>

              <button
  onClick={
    editMode
      ? updateScholarship
      : createScholarship
  }
  style={styles.btn}
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
const styles = {
  page: {
    padding: 24,
    fontFamily: "Inter, sans-serif",
    background: "#f5f6f8",
    minHeight: "100vh",
    color: "#1f2937",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  titleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  title: {
    margin: 0,
    color: "#475c6c",
    fontSize: 24,
    fontWeight: 700,
  },

  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "#8a8583",
  },

  btnPrimary: {
    padding: "10px 14px",
    background: "#475c6c",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },

  btn: {
  padding: "8px 12px",
  background: "#475c6c",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
},

  btnAccent: {
    padding: "8px 12px",
    background: "#eed7a1",
    color: "#1f2937",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },

  btnDanger: {
    padding: "8px 12px",
    background: "#8a8583",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },

  card: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    overflowX: "auto",
    scrollbarWidth: "thin",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 900,
  },

  th: {
    background: "#475c6c",
    color: "#fff",
    padding: "14px",
    textAlign: "left",
    fontSize: 12,
    textTransform: "uppercase",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #eee",
    fontSize: 13,
  },

  rowEven: {
    background: "#fff",
  },

  rowOdd: {
    background: "#f9fafb",
  },

  badge: {
    padding: "6px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-block",
  },

  overlay: {
  position: "fixed",
  inset: 0,
  background: "rgba(71, 92, 108, 0.45)",
  backdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
  zIndex: 9999,
},

  modal: {
  width: "100%",
  maxWidth: 900,
  maxHeight: "90vh",
  overflowY: "auto",
 

  background: "#fff",
  borderRadius: 18,

  padding: 30,

  boxShadow: "0 20px 60px rgba(0,0,0,.18)",

  display: "flex",
  flexDirection: "column",
  gap: 18,
  scrollbarWidth: "none",
},

modalHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "2px solid #eed7a1",
  paddingBottom: 12,
},

fieldBuilder:{
display:"grid",
gridTemplateColumns:"2fr 1fr auto auto",
gap:12,
alignItems:"center",
},

modalTitle: {
  margin: 0,
  color: "#475c6c",
  fontSize: 24,
  fontWeight: 700,
},

closeButton: {
  width: 36,
  height: 36,

  border: "none",
  borderRadius: 10,

  background: "#f3f4f6",

  cursor: "pointer",

  fontSize: 20,
  fontWeight: "bold",

  color: "#475c6c",
},

  input:{
width:"100%",
color: "#475c6c",
padding:"14px 16px",
background:"#f8fafc",
border:"1px solid #d8dee4",
borderRadius:10,
fontSize:14,
transition:"all .2s",
boxSizing:"border-box",
},

textarea:{
width:"100%",
minHeight:120,
padding:"14px 16px",
color: "#475c6c",
background:"#f8fafc",

border:"1px solid #d8dee4",

borderRadius:10,

fontSize:14,

resize:"vertical",

boxSizing:"border-box",
},

requirementBox: {
  background: "#fafafa",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
},

fieldPreview: {
  padding: 14,
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#fafafa",
  marginBottom: 10,
},

actions: {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 20,
  borderTop: "1px solid #eee",
  paddingTop: 20,
},

grid2:{
display:"grid",
gridTemplateColumns:"1fr",
gap:16,
},

  pageButton: {
  padding: "8px 14px",
  border: "1px solid #475c6c",
  borderRadius: 8,
  background: "#475c6c",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
},

section: {
  background: "#ffffff",
  border: "1px solid #e8e8e8",
  borderLeft: "5px solid #eed7a1",
  borderRadius: 14,
  padding: 24,
  marginBottom: 22,

  display: "flex",
  flexDirection: "column",
  gap: 16,

  boxShadow: "0 6px 18px rgba(0,0,0,.05)",
},

sectionTitle:{
margin:0,
fontSize:18,
fontWeight:700,
color:"#475c6c",
display:"flex",
alignItems:"center",
gap:8,
},

checkItem:{
display:"flex",
alignItems:"center",
gap:10,

padding:"10px 12px",

border:"1px solid #ececec",

borderRadius:8,

background:"#fafafa",

marginBottom:8,
},
smallBtn:{
padding:"8px 14px",

background:"#eed7a1",

color:"#475c6c",

border:"none",

borderRadius:8,

fontWeight:600,

cursor:"pointer",

marginBottom:14,
},
fieldPreview:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",

padding:"14px 18px",

border:"1px solid #ececec",

background:"#ffffff",

borderRadius:10,

boxShadow:"0 3px 8px rgba(0,0,0,.04)",
},

searchInput: {
  width: "100%",
  maxWidth: 420,
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  color: "#475c6c",
},
};