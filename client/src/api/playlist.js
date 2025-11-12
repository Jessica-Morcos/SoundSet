const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/playlist`;


export async function createPlaylist(data, token) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMyPlaylists(token) {
  const res = await fetch(`${BASE_URL}/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getPlaylistById(id, token) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// /src/api/playlist.js
export async function deletePlaylist(id, token) {
  console.log("🚀 Sending DELETE request:", `${BASE_URL}/${id}`);
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("📦 Response status:", res.status);
  try {
    const data = await res.json();
    console.log("📩 Response data:", data);
    return data;
  } catch {
    console.warn("⚠️ No JSON returned");
    return { message: "Playlist deleted successfully" };
  }
}

export async function updatePlaylist(id, data, token) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}





