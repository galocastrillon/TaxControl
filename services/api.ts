
const API_URL = import.meta.env.VITE_API_URL;

export async function pingApi() {
  const response = await fetch(`${API_URL}/api/db-test`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
