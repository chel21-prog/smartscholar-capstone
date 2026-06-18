import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);

  useEffect(() => {
    getRole();
  }, []);

  const getRole = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", userData.user.id)
      .single();

    setRole(data?.role);
  };

  // LOGOUT (ALL ROLES)
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // CHANGE PASSWORD (ALL ROLES)
  const changePassword = async () => {
    if (!password) return;

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully");
      setPassword("");
    }
  };

  return (
    <div style={styles.container}>
      <h1>Settings</h1>

      {/* ROLE DISPLAY (OPTIONAL) */}
      <p style={styles.role}>
        Current Role: <b>{role}</b>
      </p>

      {/* SECURITY */}
      <div style={styles.card}>
        <h3>Security</h3>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={changePassword}>
          Change Password
        </button>
      </div>

      {/* ACCOUNT */}
      <div style={styles.card}>
        <h3>Account</h3>

        <button onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    maxWidth: "400px",
  },

  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  },

  role: {
    color: "#555",
  },
};