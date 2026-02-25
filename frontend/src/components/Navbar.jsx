import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-primary-500">
          Aurahealth
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-slate-300">
                {user.name} <span className="text-slate-500">({user.role})</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-md border border-slate-700 rounded bg-slate-900 hover:bg-slate-800 text-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

