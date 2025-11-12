// client/src/api/playlist.js
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

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Playlist creation failed:", err);
    throw new Error("Playlist creation failed");
  }

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

export async function deletePlaylist(id, token) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
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
