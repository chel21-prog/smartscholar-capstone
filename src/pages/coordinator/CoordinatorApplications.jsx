import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CoordinatorApplications() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const HEADER_HEIGHT = 30;
const FOOTER_HEIGHT = 20;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 10;

  useEffect(() => {
    load();
  }, []);

  // =========================
  // LOAD APPLICATIONS
  // =========================
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
      users (
        first_name,
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

  const getStudentName = (app) => {
  const u = app?.students?.users;
  if (!u) return "Unknown Student";
  return `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
};

  const getBase64Image = async (url) => {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.warn("Image not found:", url);
      return null;
    }

    const blob = await res.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Image load failed:", err);
    return null;
  }
};

  // =========================
  // VIEW ANSWERS
  // =========================
  const viewAnswers = async (app) => {
    setSelectedApp(app);

    const { data } = await supabase
      .from("application_form_responses")
      .select(`
        answer,
        scholarship_form_fields ( label )
      `)
      .eq("application_id", app.application_id);

    setAnswers(data || []);
  };

  // =========================
  // APPROVE / REJECT
  // =========================
  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("scholarship_applications")
      .update({ status })
      .eq("application_id", id);

    if (error) return alert(error.message);

    setApplications((prev) =>
      prev.map((a) =>
        a.application_id === id ? { ...a, status } : a
      )
    );
  };

  const approveApplication = async (app) => {
    const { error } = await supabase
      .from("scholarship_applications")
      .update({ status: "Approved" })
      .eq("application_id", app.application_id);

    if (error) return alert(error.message);

    await supabase.from("grantees").insert({
      student_id: app.students.student_id,
      scholarship_id: app.scholarship_id,
      application_id: app.application_id,
      status: "Active",
    });

    setApplications((prev) =>
      prev.map((a) =>
        a.application_id === app.application_id
          ? { ...a, status: "Approved" }
          : a
      )
    );
  };

  // =========================
  // ⭐ EXPORT SINGLE APPLICATION
  // =========================
  const exportApplicationPDF = async (app) => {
  const headerImage = await getBase64Image("/header.png");
  const footerImage = await getBase64Image("/footer.png");

  const doc = new jsPDF();

  const { data } = await supabase
    .from("application_form_responses")
    .select(`
      answer,
      scholarship_form_fields ( label )
    `)
    .eq("application_id", app.application_id);

  const rows = (data || []).map((r) => [
    r.scholarship_form_fields?.label || "",
    r.answer || ""
  ]);

  autoTable(doc, {
    head: [["Field", "Answer"]],
    body: rows,

    startY: 80,

    didDrawPage: () => {
      addHeader(doc, app, headerImage);
      addFooter(doc, footerImage);
    },

    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  });

  doc.save(`application_${app.application_id}.pdf`);
};

const addHeader = (doc, app, headerImage) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  let headerHeight = 25;

  if (headerImage) {
    const imgProps = doc.getImageProperties(headerImage);

    // Preserve aspect ratio
    headerHeight = (imgProps.height * pageWidth) / imgProps.width;

    // Limit maximum height
    headerHeight = Math.min(headerHeight, 35);

    doc.addImage(
      headerImage,
      "PNG",
      0,
      0,
      pageWidth,
      headerHeight
    );
  }

  doc.setFontSize(14);
  doc.text("APPLICATION REPORT", 14, headerHeight + 10);

  doc.setFontSize(10);
  doc.text(`Application ID: ${app.application_id}`, 14, headerHeight + 18);
  doc.text(`Student: ${getStudentName(app)}`, 14, headerHeight + 26);
  doc.text(
    `Scholarship: ${app.scholarships?.scholarship_name}`,
    14,
    headerHeight + 34
  );
};

const addFooter = (doc, footerImage) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let footerHeight = 20;

  if (footerImage) {
    const imgProps = doc.getImageProperties(footerImage);

    footerHeight = (imgProps.height * pageWidth) / imgProps.width;

    // Limit footer height
    footerHeight = Math.min(footerHeight, 25);

    doc.addImage(
      footerImage,
      "PNG",
      0,
      pageHeight - footerHeight,
      pageWidth,
      footerHeight
    );
  }

  doc.setFontSize(8);

  doc.text(
    `Page ${doc.internal.getNumberOfPages()}`,
    pageWidth - 25,
    pageHeight - footerHeight - 5
  );
};

  const filtered =
    filter === "All"
      ? applications
      : applications.filter((a) => a.status === filter);

  if (loading) return <p>Loading...</p>;


  return (
    <div style={{ padding: 20 }}>

      <h2>Coordinator Applications</h2>

      {/* FILTER */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {["All", "Pending", "Approved", "Rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: 6,
              background: filter === f ? "#2563eb" : "#fff",
              color: filter === f ? "#fff" : "#000",
              border: "1px solid #ccc",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Student</th>
            <th>Scholarship</th>
            <th>Status</th>
            <th>Application Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((a) => (
            <tr key={a.application_id}>
              <td>{getStudentName(a)}</td>
              <td>{a.scholarships?.scholarship_name}</td>
              <td>{a.status}</td>
              <td>
                {new Date(a.application_date).toLocaleDateString()}
              </td>

              <td style={{ display: "flex", gap: 6 }}>

                <button onClick={() => viewAnswers(a)}>
                  View
                </button>

                <button onClick={() => exportApplicationPDF(a)}>
                  Export
                </button>

                {a.status === "Pending" && (
                  <>
                    <button onClick={() => approveApplication(a)}>
                      Approve
                    </button>

                    <button onClick={() => updateStatus(a.application_id, "Rejected")}>
                      Reject
                    </button>
                  </>
                )}

              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {selectedApp && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{ background: "#fff", padding: 20, width: 400 }}>

            <h3>Answers</h3>

            {answers.map((r, i) => (
              <div key={i}>
                <b>{r.scholarship_form_fields?.label}</b>
                <p>{r.answer}</p>
              </div>
            ))}

            <button onClick={() => setSelectedApp(null)}>
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}