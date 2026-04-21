import { useEffect, useState } from "react";

export default function Home() {
  const [dbStatus, setDbStatus] = useState<string>("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/db-test`)
      .then(res => res.json())
      .then(data => {
        setDbStatus(data.mariadb);
      })
      .catch(err => {
        console.error(err);
        setDbStatus("Error conectando al backend");
      });
  }, []);

  return (
    <div>
      <h1>TaxControl</h1>
      <p>Estado DB: {dbStatus}</p>
    </div>
  );
}

/* ✅ ESTA ES LA LÍNEA QUE FALTABA */
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
