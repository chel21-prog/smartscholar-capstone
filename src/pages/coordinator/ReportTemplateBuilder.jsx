import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReportTemplateBuilder() {
    
  // ===============================
  // 🧠 STATE INITIALIZATION
  // ===============================
  const [templateName, setTemplateName] = useState("");
const [sections, setSections] = useState([]);
const [loading, setLoading] = useState(false);

  // ===============================
  // 💾 SAVE TEMPLATE FUNCTION
  // ===============================
  const saveTemplate = async () => {
    if (!templateName) {
      alert("Template name is required");
      return;
    }

    setLoading(true);

    const layout = {
      title: templateName,
      sections: sections
    };

    const { error } = await supabase
      .from("report_templates")
      .insert({
        name: templateName,
        layout
      });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Template saved successfully!");
      setTemplateName("");
      setSections([]);
    }
  };
  

  const addSection = () => {
  setSections(prev => [
    ...prev,
    {
      title: "",
      type: "table",
      fields: []
    }
  ]);
};

const updateSectionTitle = (index, value) => {
  setSections(prev => {
    const copy = [...prev];

    if (!copy[index]) return prev;

    copy[index] = {
      ...copy[index],
      title: value
    };

    return copy;
  });
};

const deleteSection = (index) => {
  setSections(prev => prev.filter((_, i) => i !== index));
};

const addField = (sectionIndex) => {
  setSections(prev => {
    const copy = [...prev];

    const section = copy[sectionIndex];

    if (!section) return prev;

    copy[sectionIndex] = {
      ...section,
      fields: [
        ...(section.fields || []),
        { label: "", key: "" }
      ]
    };

    return copy;
  });
};

const updateField = (sectionIndex, fieldIndex, field, value) => {
  setSections(prev => {
    const copy = [...prev];

    const section = copy[sectionIndex];
    if (!section || !section.fields) return prev;

    const fields = [...section.fields];

    if (!fields[fieldIndex]) return prev;

    fields[fieldIndex] = {
      ...fields[fieldIndex],
      [field]: value
    };

    copy[sectionIndex] = {
      ...section,
      fields
    };

    return copy;
  });
};

const deleteField = (sectionIndex, fieldIndex) => {
  setSections(prev => {
    const copy = [...prev];

    const section = copy[sectionIndex];
    if (!section || !section.fields) return prev;

    copy[sectionIndex] = {
      ...section,
      fields: section.fields.filter((_, i) => i !== fieldIndex)
    };

    return copy;
  });
};

  // ===============================
  // 📄 PAGE UI (INITIAL DUMMY UI)
  // ===============================
  return (
    <div style={styles.page}>

      <h1 style={styles.title}>
        Report Template Builder
      </h1>

      {/* TEMPLATE NAME INPUT */}
      <div style={styles.card}>
        <label>Template Name</label>
        <input
          style={styles.input}
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="e.g. Government Scholarship Report"
        />
      </div>

      {/* SECTIONS PLACEHOLDER */}
      <div style={styles.card}>
  <h3>Template Sections</h3>

  {sections.length === 0 && (
    <p style={{ color: "#666" }}>
      No sections yet. Click "Add Section"
    </p>
  )}

  {(sections || []).map((section, secIndex) => (
    <div
      key={secIndex}
      style={{
        border: "1px solid #ddd",
        padding: 10,
        marginBottom: 15,
        borderRadius: 8
      }}
    >

      {/* SECTION HEADER */}
      <input
        placeholder="Section Title (e.g. Student Info)"
        value={section.title}
        onChange={(e) =>
          updateSectionTitle(secIndex, e.target.value)
        }
        style={styles.input}
      />

      <button onClick={() => deleteSection(secIndex)}>
        Delete Section
      </button>

      <hr />

      {/* FIELDS */}
      <h4>Fields</h4>

      {(section.fields || []).map((field, fieldIndex) => (
        <div key={fieldIndex} style={{ marginBottom: 8 }}>

          <input
            placeholder="Label (e.g. Full Name)"
            value={field.label}
            onChange={(e) =>
              updateField(secIndex, fieldIndex, "label", e.target.value)
            }
            style={{ ...styles.input, marginBottom: 5 }}
          />

          <input
            placeholder="Key (e.g. full_name)"
            value={field.key}
            onChange={(e) =>
              updateField(secIndex, fieldIndex, "key", e.target.value)
            }
            style={styles.input}
          />

          <button
            onClick={() => deleteField(secIndex, fieldIndex)}
          >
            Remove Field
          </button>
        </div>
      ))}

      {/* ADD FIELD */}
      <button onClick={() => addField(secIndex)}>
        + Add Field
      </button>

    </div>
  ))}

  {/* ADD SECTION */}
  <button onClick={addSection}>
    + Add Section
  </button>
</div>

      {/* ACTION BUTTONS */}
      <div style={styles.actions}>
       

        <button
          onClick={saveTemplate}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Template"}
        </button>
      </div>

    </div>
  );
}

const styles = {
  page: {
    padding: 20,
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "Arial"
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20
  },

  card: {
    background: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },

  input: {
    width: "100%",
    padding: 8,
    marginTop: 5,
    border: "1px solid #ddd",
    borderRadius: 6
  },

  actions: {
    display: "flex",
    gap: 10
  }
};