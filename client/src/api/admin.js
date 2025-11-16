const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function toggleRole(userId, token) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/role`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}
