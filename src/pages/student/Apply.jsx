import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function Apply() {
  const [data, setData] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("scholarships").select("*");
    setData(data);
  };

  return (
    <div>
      <h1>Apply for Scholarships</h1>

      {data?.map((s) => (
        <div key={s.scholarship_id} style={card}>
          <h3>{s.scholarship_name}</h3>

          <Link to={`/student/apply/${s.scholarship_id}`}>
            Apply Now
          </Link>
        </div>
      ))}
    </div>
  );
}

const card = {
  background: "white",
  padding: 15,
  margin: 10,
};