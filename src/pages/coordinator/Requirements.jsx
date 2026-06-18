import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Requirements() {
  const [appReq, setAppReq] = useState([]);
  const [eligReq, setEligReq] = useState([]);

  const [appName, setAppName] = useState("");
  const [eligName, setEligName] = useState("");

  const [appType, setAppType] = useState("Document");
  const [eligType, setEligType] = useState("Other");

  const [appDesc, setAppDesc] = useState("");
  const [eligDesc, setEligDesc] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: app } = await supabase
      .from("application_requirements")
      .select("*");

    const { data: elig } = await supabase
      .from("eligibility_requirements")
      .select("*");

    setAppReq(app || []);
    setEligReq(elig || []);
  };

  const addApp = async () => {
    if (!appName.trim()) return;

    await supabase.from("application_requirements").insert({
      requirement_name: appName,
      requirement_type: appType,
      description: appDesc || null,
    });

    setAppName("");
    setAppDesc("");
    load();
  };

  const addElig = async () => {
    if (!eligName.trim()) return;

    await supabase.from("eligibility_requirements").insert({
      requirement_name: eligName,
      requirement_type: eligType,
      description: eligDesc || null,
    });

    setEligName("");
    setEligDesc("");
    load();
  };

  return (
    <div style={page}>
      <h1 style={title}> Requirement Library</h1>

      <div style={grid}>
        {/* APPLICATION */}
        <div style={box}>
          <h2 style={h2}> Application Requirements</h2>

          <input
            style={input}
            value={appName}
            placeholder="Requirement name *"
            onChange={(e) => setAppName(e.target.value)}
          />

          <div style={row}>
            <label style={label}>
              <input
                type="checkbox"
                checked={appType === "Document"}
                onChange={() => setAppType("Document")}
              />
              Document
            </label>

            <label style={label}>
            <input
                type="checkbox"
                checked={appType === "Grade"}
                onChange={() => setAppType("Grade")}
              />
              Grade
            </label>

            <label style={label}>
              <input
                type="checkbox"
                checked={appType === "Income"}
                onChange={() => setAppType("Income")}
              />
              Income
            </label>

            <label style={label}>
              <input
                type="checkbox"
                checked={appType === "Other"}
                onChange={() => setAppType("Other")}
              />
              Other
            </label>
          </div>

          <textarea
            style={textarea}
            value={appDesc}
            placeholder="Description (optional)"
            onChange={(e) => setAppDesc(e.target.value)}
          />

          <button style={button} onClick={addApp}>
            Add Requirement
          </button>

          <div>
            {[...appReq]
              .sort((a, b) =>
                a.requirement_name.localeCompare(b.requirement_name)
              )
               .map((r) => (
                <div key={r.application_requirement_id} style={item}>
                  <b>{r.requirement_name}</b>
              </div>
            ))}
         </div>
        </div>

        {/* ELIGIBILITY */}
        <div style={box}>
          <h2 style={h2}> Eligibility Requirements</h2>

          <input
            style={input}
            value={eligName}
            placeholder="Requirement name *"
            onChange={(e) => setEligName(e.target.value)}
          />

          <div style={row}>
            <label style={label}>
              <input
                type="checkbox"
                checked={eligType === "Status"}
                onChange={() => setEligType("Status")}
              />
              Status
            </label>

            <label style={label}>
              <input
                type="checkbox"
                checked={eligType === "Other"}
                onChange={() => setEligType("Other")}
              />
              Other
            </label>
          </div>

          <textarea
            style={textarea}
            value={eligDesc}
            placeholder="Description (optional)"
            onChange={(e) => setEligDesc(e.target.value)}
          />

          <button style={button} onClick={addElig}>
            Add Requirement
          </button>

          <div>
            {[...eligReq]
              .sort((a, b) =>
                a.requirement_name.localeCompare(b.requirement_name)
              )
               .map((r) => (
                <div key={r.eligibility_requirement_id} style={item}>
                  <b>{r.requirement_name}</b>
              </div>
            ))}
         </div>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  padding: "20px",
  background: "#f4f6f8",
  minHeight: "100vh",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#111827",
};

const title = {
  fontSize: "22px",
  fontWeight: "700",
  marginBottom: "20px",
  color: "#1f1f1f",
};

const h2 = {
  fontSize: "16px",
  marginBottom: "10px",
  color: "#1f1f1f",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};

const box = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "14px",
};

const textarea = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "14px",
  minHeight: "70px",
  resize: "none",
};

const row = {
  display: "flex",
  gap: "15px",
  marginBottom: "10px",
  flexWrap: "wrap",
};

const label = {
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: "5px",
};

const button = {
  width: "100%",
  padding: "10px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

const list = {
  marginTop: "15px",
};

const item = {
  padding: "10px",
  borderBottom: "1px solid #eee",
};

const meta = {
  fontSize: "12px",
  color: "#6b7280",
};