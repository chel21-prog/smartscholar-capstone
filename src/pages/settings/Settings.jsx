import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
export default function Settings() {
  const [email, setEmail] = useState("");
const navigate = useNavigate();
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [showNew, setShowNew] = useState(false);
const [saving, setSaving] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    getRole();

    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            window.location.href = "/login";
        }
    });

    return () => subscription.unsubscribe();
}, []);

  const getRole = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        navigate("/login");
        return;
    }

    setEmail(user.email);

    const { data } = await supabase
        .from("users")
        .select("role")
        .eq("auth_id", user.id)
        .single();

    setRole(data?.role);
};

  // LOGOUT (ALL ROLES)
  const logout = async () => {
    await supabase.auth.signOut();
     navigate("/login");
  };

  // CHANGE PASSWORD (ALL ROLES)
  const changePassword = async () => {
  setSaving(true);

  try {
    // Validate fields
    if (
  !newPassword.trim() ||
  !confirmPassword.trim()
) {
  alert("Please complete all password fields.");
  return;
}

    if (newPassword !== confirmPassword) {
      alert("New password and Confirm Password do not match.");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (!passwordRegex.test(newPassword)) {
      alert(
        "Password must contain:\n\n" +
          "• At least 6 characters\n" +
          "• One uppercase letter\n" +
          "• One lowercase letter\n" +
          "• One number"
      );
      return;
    }

   
    const { error } = await supabase.auth.updateUser({
  password: newPassword,
});

if (error) {
  alert(error.message);
  return;
}


alert("Password changed successfully!");

setNewPassword("");
setConfirmPassword("");

  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  } finally {
    setSaving(false);
  }
};

const passwordValid =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(newPassword);

const formValid =
    newPassword &&
    confirmPassword &&
    passwordValid &&
    newPassword === confirmPassword;
  return (
    <div style={styles.container}>
      <div style={styles.header}>
  <div>
    <h1 style={styles.title}>Settings</h1>
    <p style={styles.subtitle}>
      Manage your account, security, and session preferences.
    </p>
  </div>
</div>

     <div style={styles.content}>
       <div style={styles.card}>
  <h2 style={styles.cardTitle}>Account Information</h2>

<div style={styles.infoItem}>
    <span style={styles.infoLabel}>Email</span>
    <span style={styles.infoValue}>{email}</span>
</div>

<div style={styles.infoItem}>
    <span style={styles.infoLabel}>Role</span>

    <span style={styles.roleBadge}>
        {role}
    </span>
</div>
      </div>
      {/* SECURITY */}
      <div style={styles.card}>
        <h3>Security</h3>

<div style={styles.field}>
    <label style={styles.label}>
        New Password
    </label>

    <div style={styles.passwordRow}>
<input
    type={showNew ? "text" : "password"}
        placeholder="Enter a new password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    disabled={saving}
    style={styles.input}
/>

<button
    type="button"
    disabled={saving}
    style={{
        ...styles.eyeButton,
        opacity: saving ? .6 : 1,
    }}
    onClick={() => setShowNew(!showNew)}
>
    {showNew ? "Hide" : "Show"}
</button>

</div>
</div>

<div style={styles.field}>
    <label style={styles.label}>
        Confirm Password
    </label>
    <div style={styles.passwordRow}>
<input
    type={showConfirm ? "text" : "password"}
    placeholder="Re-enter your new password"
    value={confirmPassword}
    onChange={(e)=>setConfirmPassword(e.target.value)}
    disabled={saving}
    style={styles.input}
/>

<button
    type="button"
    disabled={saving}
    style={{
        ...styles.eyeButton,
        opacity: saving ? .6 : 1,
    }}
    onClick={() => setShowConfirm(!showConfirm)}
>
    {showConfirm ? "Hide" : "Show"}
</button>

</div>
<div style={styles.tipBox}>
    Password must contain:

    <ul style={{ marginTop: 10 }}>
        <li>At least 6 characters</li>
        <li>One uppercase letter</li>
        <li>One lowercase letter</li>
        <li>One number</li>
    </ul>
</div>
</div>
    <button
    onClick={changePassword}
    disabled={saving || !formValid}
    style={{
        ...styles.primaryButton,
        opacity: saving || !formValid ? 0.6 : 1,
        cursor: saving || !formValid ? "not-allowed" : "pointer",
    }}
>
    {saving ? "Updating Password..." : "Change Password"}
</button>
      </div>

      {/* ACCOUNT */}
      <div style={styles.card}>
     <h2 style={styles.cardTitle}>Session</h2>

<p style={styles.logoutText}>
Session Management

Sign out of your current session. You'll need to log in again to access your account.
</p>

<button
style={styles.logoutButton}
onClick={logout}
>
Logout
</button>
      </div>
      </div>
    </div>
  );
}

const styles = {
  container:{
padding:"20px",
background:"#f4f6f8",
minHeight:"100vh",
},
tipBox:{
    background:"#fff8e8",
    border:"1px solid #eed7a1",
    padding:15,
    borderRadius:10,
    color:"#8a8583",
    fontSize:13,
    marginBottom:20,
},
content:{
display:"flex",
flexDirection:"column",
gap:"24px",
maxWidth:"800px",
},
logoutText:{
    color:"#8a8583",
    marginBottom:20,
},
  card:{
    background:"#fff",
    padding:24,
    borderRadius:16,
    boxShadow:"0 10px 24px rgba(0,0,0,.06)",
},

  input:{
    flex:1,
    padding:"12px 14px",
    border:"1px solid #d9d9d9",
    borderRadius:8,
    outline:"none",
    fontSize:14,
    background:"#fff",
    color:"#475c6c",
},

  role: {
    color: "#555",
  },
  infoCard:{
    background:"#fff",
    padding:"24px",
    borderRadius:16,
    boxShadow:"0 10px 24px rgba(0,0,0,.06)",
},
passwordRow:{
    display:"flex",
    gap:10,
    alignItems:"center",
    marginBottom:15,
},
eyeButton:{
    minWidth:70,
    padding:"12px",
    border:"1px solid #d8d8d8",
    background:"#fff",
    color:"#475c6c",
    borderRadius:8,
    cursor:"pointer",
    fontWeight:600,
},
primaryButton:{
    width:"100%",
    padding:"14px",
    background:"#475c6c",
    color:"#fff",
    border:"none",
    borderRadius:10,
    fontWeight:700,
    fontSize:15,
    cursor:"pointer",
    transition:"0.2s",
},

cardTitle:{
    marginTop:0,
    marginBottom:20,
    color:"#475c6c",
},

infoItem:{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    padding:"14px 0",
    borderBottom:"1px solid #eee",
},

infoLabel:{
    color:"#8a8583",
    fontWeight:600,
},

infoValue:{
    color:"#475c6c",
    fontWeight:600,
},

roleBadge:{
    background:"#eed7a1",
    color:"#475c6c",
    padding:"6px 14px",
    borderRadius:999,
    fontWeight:600,
},
logoutButton:{
    width:"100%",
    padding:"12px",
    background:"#dc2626",
    color:"#fff",
    border:"none",
    borderRadius:10,
    fontWeight:600,
    cursor:"pointer",
},
field:{
    display:"flex",
    flexDirection:"column",
    gap:8,
    marginBottom:18,
},

label:{
    color:"#475c6c",
    fontWeight:600,
    fontSize:14,
},
header: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 30,
},

title: {
  margin: 0,
  fontSize: 30,
  fontWeight: 700,
  color: "#475c6c",
},

subtitle: {
  marginTop: 6,
  color: "#8a8583",
  fontSize: 14,
},
};