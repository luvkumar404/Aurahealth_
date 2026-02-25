import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    specialization: ""
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.role !== "doctor") {
        delete payload.specialization;
      }
      const user = await register(payload);
      if (user.role === "doctor") navigate("/doctor");
      else if (user.role === "admin") navigate("/admin");
      else navigate("/patient");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl font-semibold mb-1">Create an account</h1>
        <p className="text-sm text-slate-400 mb-6">
          Register as a patient, doctor, or admin.
        </p>
        {error && (
          <p className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 focus:border-primary-500"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === "doctor" && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Specialization</label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 focus:border-primary-500"
                required={form.role === "doctor"}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-primary-500 hover:bg-green-500 text-slate-950 font-medium disabled:bg-slate-700"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

