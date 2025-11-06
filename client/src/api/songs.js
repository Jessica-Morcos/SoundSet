// src/api/songs.js
const BASE_URL = "http://localhost:3000/api/songs";

export async function getAllSongs(token) {
  try {
    const res = await fetch(BASE_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch songs");
    return await res.json();
  } catch (err) {
    console.error("Error fetching songs:", err);
    return [];
  }
}

export async function addSong(songData, token) {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(songData),
    });
    return await res.json();
  } catch (err) {
    console.error("Error adding song:", err);
  }
}

export async function updateSong(id, data, token) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error("Error updating song:", err);
  }
}

export async function deleteSong(id, token) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.error("Error deleting song:", err);
  }
}

export async function toggleRestricted(id, token) {
  try {
    const res = await fetch(`${BASE_URL}/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.error("Error toggling restriction:", err);
  }
}
