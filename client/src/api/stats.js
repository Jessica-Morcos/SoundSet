const BASE_URL = "http://localhost:3000/api/stats";

export async function logPlay(songId, token) {
  const res = await fetch(`${BASE_URL}/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ songId }),
  });
  return res.json();
}
