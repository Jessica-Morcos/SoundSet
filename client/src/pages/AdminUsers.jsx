import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) refreshUsers();
  }, [token]);

  async function refreshUsers() {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(await res.json());
  }

  async function toggleActive(id) {
    await fetch(`${BASE_URL}/users/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    refreshUsers();
  }

  async function toggleRole(id) {
    await fetch(`${BASE_URL}/users/${id}/role`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    refreshUsers();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete ${name}?`)) return;

    await fetch(`${BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    refreshUsers();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 text-white p-10">
      <h1 className="text-4xl font-bold text-center mb-8">User Management</h1>

      <div className="bg-white text-gray-900 rounded-2xl shadow-xl w-full max-w-6xl mx-auto p-6">

        {/* ✅ MOBILE SAFE SCROLL WRAPPER */}
        <div className="overflow-x-auto">

          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-indigo-100 text-indigo-700 font-semibold">
                <th className="p-3">Username</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Role Action</th>
                <th className="p-3">Active</th>
                <th className="p-3">Delete</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b">

                  <td className="p-3">{u.username}</td>
                  <td className="p-3 capitalize">{u.role}</td>

                  <td className="p-3">
                    {u.isActive ? (
                      <span className="text-green-600 font-semibold">Active</span>
                    ) : (
                      <span className="text-red-500 font-semibold">Inactive</span>
                    )}
                  </td>

                  {/* ROLE ACTION BUTTON */}
                  <td className="p-3">
                    <button
                      onClick={() => toggleRole(u._id)}
                      className="block w-full px-3 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm"
                    >
                      {u.role === "admin"
                        ? "Demote to DJ"
                        : u.role === "dj"
                        ? "Promote to Admin"
                        : "Promote to DJ"}
                    </button>
                  </td>

                  {/* ACTIVE / DEACTIVATE BUTTON */}
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(u._id)}
                      className={`block w-full px-3 py-1 rounded-lg text-sm ${
                        u.isActive
                          ? "bg-yellow-300 hover:bg-yellow-400 text-gray-900"
                          : "bg-green-300 hover:bg-green-400 text-gray-900"
                      }`}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>

                  {/* DELETE BUTTON */}
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(u._id, u.username)}
                      className="block w-full px-3 py-1 rounded-lg bg-red-400 hover:bg-red-500 text-white text-sm"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
