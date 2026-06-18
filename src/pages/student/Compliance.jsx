import { useEffect, useState } from "react";
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

    // STEP 1: auth user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // STEP 2: user profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_id", user.id)
      .single();

    // STEP 3: student
    const { data: student } = await supabase
      .from("students")
      .select("student_id")
      .eq("user_id", userProfile.user_id)
      .single();

    // STEP 4: approved applications
    const { data: applications } = await supabase
      .from("scholarship_applications")
      .select(
        `
        application_id,
        scholarship_id,
        scholarships (
          scholarship_name
        )
      `
      )
      .eq("student_id", student.student_id)
      .eq("status", "Approved");

    if (!applications) {
      setRows([]);
      setLoading(false);
      return;
    }

    // STEP 5: requirements
    const { data: reqs } = await supabase
      .from("scholarship_requirements")
      .select(
        `
        scholarship_id,
        application_requirements (
          requirement_name
        )
      `
      );

    // STEP 6: uploaded docs
    const { data: docs } = await supabase
      .from("application_documents")
      .select("*");

    const merged = [];

    applications.forEach((app) => {
      const scholarshipReqs = reqs.filter(
        (r) => r.scholarship_id === app.scholarship_id
      );

      scholarshipReqs.forEach((r) => {
        const req = r.application_requirements;

        const existing = docs.find(
          (d) =>
            d.application_id === app.application_id &&
            d.requirement_name === req?.requirement_name
        );

        merged.push({
          application_id: app.application_id,
          scholarship_name: app.scholarships?.scholarship_name,
          requirement_name: req?.requirement_name,
          file_url: existing?.file_url || null,
        });
      });
    });

    setRows(merged);
    setLoading(false);
  };

  const uploadFile = async (e, row) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const filePath = `${row.application_id}/${row.requirement_name}/${file.name}`;

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
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.scholarship_name}</td>
                <td>{r.requirement_name}</td>

                <td>
                  {r.file_url ? (
                    <span style={styles.badge}>Submitted</span>
                  ) : (
                    <span style={styles.missing}>Missing</span>
                  )}
                </td>

                <td>
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  )}
                </td>

                <td>
                  <input
                    type="file"
                    onChange={(e) => uploadFile(e, r)}
                    disabled={uploading}
                  />
                </td>
              </tr>
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