import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const boxRef = useRef();

  useEffect(() => {
  let channel;

  const initialize = async () => {
    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: dbUser } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) return;

    await loadNotifications();

    channel = supabase
      .channel(`notifications-${dbUser.user_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          // Only reload if this notification belongs to this user
          if (payload.new.user_id === dbUser.user_id) {
            loadNotifications();
          }
        }
      )
      .subscribe();
  };

  initialize();

  const handleClick = (e) => {
    if (boxRef.current && !boxRef.current.contains(e.target)) {
      setOpen(false);
    }
  };

  window.addEventListener("click", handleClick);

  return () => {
    window.removeEventListener("click", handleClick);

    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, []);

const loadNotifications = async () => {
  // Get the currently logged-in Supabase user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("No authenticated user.", authError);
    return;
  }

  // Get your application's user_id from the users table
  const { data: dbUser, error: userError } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_id", user.id)
    .single();

  if (userError || !dbUser) {
    console.error("Unable to find user record.", userError);
    return;
  }

  // Load notifications for this user
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", dbUser.user_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setNotifications(data || []);
};

  const unread = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id) => {
    await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("notification_id", id);

    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === id
          ? { ...n, is_read: true }
          : n
      )
    );
  };

  return (
    <div
      ref={boxRef}
      style={styles.wrapper}
    >
      <button
        style={styles.bell}
        onClick={() => setOpen(!open)}
      >
        🔔

        {unread > 0 && (
          <span style={styles.badge}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <h4 style={{ marginTop: 0 }}>
            Notifications
          </h4>

          {notifications.length === 0 && (
            <p>No notifications.</p>
          )}

          {notifications.map((n) => (
            <div
              key={n.notification_id}
              style={{
                ...styles.item,
                background: n.is_read
                  ? "#fff"
                  : "#eef6ff",
              }}
              onClick={() =>
                markRead(n.notification_id)
              }
            >
              <strong>{n.title}</strong>

              <p>{n.message}</p>

              <small>
                {new Date(
                  n.created_at
                ).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
  },

  bell: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    background: "#fff",
    fontSize: 22,
    position: "relative",
    boxShadow: "0 4px 10px rgba(0,0,0,.08)",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#ef4444",
    color: "#fff",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  dropdown: {
    position: "absolute",
    right: 0,
    top: 55,
    width: 360,
    maxHeight: 450,
    overflowY: "auto",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 15px 40px rgba(0,0,0,.15)",
    padding: 15,
    zIndex: 9999,
  },

  item: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    cursor: "pointer",
    border: "1px solid #eee",
  },
};