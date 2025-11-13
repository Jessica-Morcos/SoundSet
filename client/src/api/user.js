// client/src/api/user.js
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/users`;

// 🔹 Get current user's saved preferences
export async function getMyPreferences(token) {
  const res = await fetch(`${BASE_URL}/preferences/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load preferences");
  return res.json();
}

// 🔹 Update current user's preferences
export async function updateMyPreferences(data, token) {
  const res = await fetch(`${BASE_URL}/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update preferences");
  return res.json();
}
