const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function loginUser(credentials) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) return { message: data.message || "Login failed" };
    return data;
  } catch (err) {
    console.error("Login error:", err);
    return { message: "Login failed" };
  }
}

export async function registerUser(data) {
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error("Register error:", err);
    return { message: "Registration failed" };
  }
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user");

    const user = await res.json();
    // ensure role & preferences are included
    return {
      ...user,
      role: user.role || "user",
      preferences: user.preferences || {},
    };
  } catch (err) {
    console.error("Error fetching current user:", err);
    return null;
  }
}
