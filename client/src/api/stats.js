const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/stats`;

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

// ✅ stats for a specific song (all users)
export async function getSongStats(songId, token) {
  const res = await fetch(`${BASE_URL}/song/${songId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

// ✅ timeline for a specific song (for relative frequency graph)
export async function getSongTimeline(songId, token) {
  const res = await fetch(`${BASE_URL}/song/${songId}/timeline`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

// ✅ access another user's logs (kept for compatibility)
export async function getUserLogs(userId, token) {
  const res = await fetch(`${BASE_URL}/user/${userId}/logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

// ✅ NEW: all users' most recent activity (Spotify-style)
export async function getRecentActivity(token) {
  const res = await fetch(`${BASE_URL}/users/recent`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}
