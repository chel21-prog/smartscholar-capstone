import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Compliance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
  setLoading(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: userProfile } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_id", user.id)
    .single();

  const { data: student } = await supabase
    .from("students")
    .select("student_id")
    .eq("user_id", userProfile.user_id)
    .single();

  // 1. START FROM GRANTEES
  const { data: grantees } = await supabase
    .from("grantees")
    .select(`
      grantee_id,
      application_id,
      scholarship_id,
      scholarships (
        scholarship_name
      )
    `)
    .eq("student_id", student.student_id);

  const grouped = {};

for (const g of grantees) {
  const scholarshipId = g.scholarship_id;
  const applicationId = g.application_id;

  const key = `${scholarshipId}-${applicationId}`;

  if (!grouped[key]) {
    grouped[key] = {
      scholarship_name: g.scholarships?.scholarship_name,
      application_id: applicationId,
      requirements: {},
    };
  }

  const { data: reqLinks } = await supabase
    .from("scholarship_requirements")
    .select(`
      application_requirements (
        requirement_name
      )
    `)
    .eq("scholarship_id", scholarshipId);

  const { data: docs } = await supabase
    .from("application_documents")
    .select("*")
    .eq("application_id", applicationId);
    
    console.log("Requirements for", g.scholarships?.scholarship_name);
console.log(reqLinks);

  reqLinks?.forEach((r) => {
  const reqName = r.application_requirements?.requirement_name;

  // Skip null or empty requirement names
  if (!reqName) return;

  const existing = docs?.find(
    (d) => d.requirement_name === reqName
  );

  grouped[key].requirements[reqName] = {
    requirement_name: reqName,
    file_url: existing?.file_url || null,
  };
});

}
  setRows(Object.values(grouped));
  setLoading(false);
};

  const uploadFile = async (e, row) => {
    if (!row.application_id || !row.requirement_name) {
  alert("Missing application ID or requirement name");
  console.log("UPLOAD ERROR ROW:", row);
  return;
}
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const safeRequirement = row.requirement_name.replace(/\s+/g, "_");

const filePath = `${row.application_id}/${safeRequirement}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("application-documents")
      .upload(filePath, file, { upsert: true });

    if (error) {
      alert(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("application-documents")
      .getPublicUrl(filePath);

    const fileUrl = data.publicUrl;

    await supabase.from("application_documents").upsert({
      application_id: row.application_id,
      requirement_name: row.requirement_name,
      file_url: fileUrl,
    });

    setUploading(false);
    load();
  };

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Compliance Requirements</h1>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Scholarship</th>
              <th>Requirement</th>
              <th>Status</th>
              <th>File</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
  {rows.map((r) => (
  <React.Fragment key={r.application_id}>
      {/* SCHOLARSHIP HEADER ROW */}
      <tr key={`sch-${r.application_id}`}>
        <td colSpan="5" style={{ fontWeight: "bold", background: "#f3f4f6" }}>
          📌 {r.scholarship_name}
        </td>
      </tr>

      {/* REQUIREMENTS */}
      {Object.values(r.requirements).map((req, idx) => (
        <tr key={`${r.application_id}-${req.requirement_name}`}>
          <td></td>
          <td>{req.requirement_name}</td>

          <td>
            {req.file_url ? (
              <span style={styles.badge}>Submitted</span>
            ) : (
              <span style={styles.missing}>Missing</span>
            )}
          </td>

          <td>
            {req.file_url && (
              <a href={req.file_url} target="_blank" rel="noreferrer">
                View
              </a>
            )}
          </td>

          <td>
            <input
              type="file"
              onChange={(e) => uploadFile(e, {
                application_id: r.application_id,
                requirement_name: req.requirement_name,
              })}
              disabled={uploading}
            />
          </td>
        </tr>
      ))}
    </React.Fragment>
  ))}
</tbody>
        </table>
      </div>
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
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 20,
  },

  tableWrapper: {
    background: "#fff",
    borderRadius: 12,
    padding: 10,
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },

  badge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
  },

  missing: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: 600,
  },
};