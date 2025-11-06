import { useEffect, useState } from "react";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");

  // ✅ Load all users
  useEffect(() => {
    fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setUsers)
      .catch((err) => console.error("Error loading users:", err));
  }, [token]);

  // ✅ Toggle active/inactive
  const toggleUser = async (id) => {
    await fetch(`${BASE_URL}/users/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers((prev) =>
      prev.map((u) => (u._id === id ? { ...u, isActive: !u.isActive } : u))
    );
  };

  // ✅ Delete user
  const handleDelete = async (id, username) => {
    const confirmed = confirm(`Are you sure you want to delete ${username}?`);
    if (!confirmed) return;

    await fetch(`${BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setUsers((prev) => prev.filter((u) => u._id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 text-white p-10">
      <h1 className="text-4xl font-bold text-center mb-6">User Management</h1>

      <div className="bg-white text-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-5xl mx-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-indigo-100 text-indigo-700">
              <th className="py-3 px-4 text-left">Username</th>
              <th className="py-3 px-4 text-left">Role</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className={`border-b ${
                  user.isActive ? "bg-white" : "bg-gray-100 opacity-70"
                }`}
              >
                <td className="py-3 px-4">{user.username}</td>
                <td className="py-3 px-4 capitalize">{user.role}</td>
                <td className="py-3 px-4">
                  {user.isActive ? (
                    <span className="text-green-600 font-semibold">Active</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Inactive</span>
                  )}
                </td>
                <td className="py-3 px-4 flex gap-2">
                  <button
                    onClick={() => toggleUser(user._id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      user.isActive
                        ? "bg-yellow-400 hover:bg-yellow-500 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(user._id, user.username)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium"
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
  );
}
