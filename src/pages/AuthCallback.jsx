import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const saveGoogleUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/Login");
        return;
      }

      // Check if already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!existingUser) {
        // Insert into users
        const { data: newUser, error } = await supabase
          .from("users")
          .insert({
            auth_id: user.id,
            email: user.email,
            first_name: user.user_metadata.full_name?.split(" ")[0] || "",
            last_name:
              user.user_metadata.full_name?.split(" ").slice(1).join(" ") || "",
            role: "Student",
            status: "active",
          })
          .select()
          .single();

        if (!error) {
          await supabase.from("students").insert({
            user_id: newUser.user_id,
            school_id: `TEMP-${Date.now()}`,
            status: "Enrolled",
          });
        }
      }

      navigate("/student/dashboard");
    };

    saveGoogleUser();
  }, []);

  return <h2>Signing in...</h2>;
}