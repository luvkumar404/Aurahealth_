import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

const AdminDashboard = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({ totalUsers: 0, doctors: 0, patients: 0 });

  useEffect(() => {
    const load = async () => {
      const res = await axios.get("/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users || []);
    };
    if (token) {
      load().catch((err) =>
        console.error("Failed to load admin data", err?.response?.data || err.message)
      );
    }
  }, [token]);

  useEffect(() => {
    const totalUsers = users.length;
    const doctors = users.filter((u) => u.role === "doctor").length;
    const patients = users.filter((u) => u.role === "patient").length;
    setAnalytics({ totalUsers, doctors, patients });
  }, [users]);

  const deleteUser = async (id) => {
    await axios.delete(`/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers((prev) => prev.filter((u) => u._id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <section className="grid grid-cols-3 gap-4">
        <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
          <p className="text-xs text-slate-400">Total users</p>
          <p className="text-2xl font-semibold">{analytics.totalUsers}</p>
        </div>
        <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
          <p className="text-xs text-slate-400">Doctors</p>
          <p className="text-2xl font-semibold">{analytics.doctors}</p>
        </div>
        <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
          <p className="text-xs text-slate-400">Patients</p>
          <p className="text-2xl font-semibold">{analytics.patients}</p>
        </div>
      </section>
      <section className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
        <h2 className="text-lg font-semibold mb-3">Manage Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Specialization</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-slate-900/60">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2 text-slate-400">{u.email}</td>
                  <td className="py-2 capitalize">{u.role}</td>
                  <td className="py-2 text-slate-400">{u.specialization || "-"}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => deleteUser(u._id)}
                      className="px-2 py-1 rounded-md bg-red-500/80 text-xs text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-slate-400 text-xs">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;

