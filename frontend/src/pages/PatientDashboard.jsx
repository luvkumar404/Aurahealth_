import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
import { getSocket } from "../services/socket.js";

const PatientDashboard = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctorId: "", scheduledAt: "" });
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [apptRes, doctorsRes] = await Promise.all([
        axios.get("/appointments/mine", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("/users/doctors", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAppointments(apptRes.data.appointments || []);
      setDoctors(doctorsRes.data.doctors || []);
    };
    if (token) {
      loadData().catch((err) =>
        console.error("Failed to load patient data", err?.response?.data || err.message)
      );
    }
  }, [token]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket(user.id);
    const handleStatusUpdate = ({ appointmentId, status }) => {
      setStatusUpdates((prev) => [...prev, { appointmentId, status }]);
      setAppointments((prev) =>
        prev.map((a) => (a._id === appointmentId ? { ...a, status } : a))
      );
    };
    const handlePrivateMessage = ({ fromUserId, message, timestamp }) => {
      setChatMessages((prev) => [...prev, { fromUserId, message, timestamp }]);
    };
    socket.on("appointment-status-updated", handleStatusUpdate);
    socket.on("private-message", handlePrivateMessage);
    return () => {
      socket.off("appointment-status-updated", handleStatusUpdate);
      socket.off("private-message", handlePrivateMessage);
    };
  }, [user?.id]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    await axios.post(
      "/appointments",
      {
        doctorId: form.doctorId,
        scheduledAt: form.scheduledAt
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const res = await axios.get("/appointments/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAppointments(res.data.appointments || []);
    setForm({ doctorId: "", scheduledAt: "" });
  };

  const joinCall = (appt) => {
    const roomId = appt.roomId || appt._id;
    window.open(`/video/${roomId}`, "_self");
  };

  const startChat = (appt) => {
    if (!appt.doctorId?._id) return;
    setChatTarget(appt.doctorId._id);
  };

  const sendChat = () => {
    if (!chatTarget || !chatInput.trim() || !user?.id) return;
    const socket = getSocket(user.id);
    if (!socket) return;
    const message = chatInput.trim();
    socket.emit("private-message", {
      toUserId: chatTarget,
      message
    });
    setChatMessages((prev) => [
      ...prev,
      { fromUserId: user.id, message, timestamp: new Date().toISOString() }
    ]);
    setChatInput("");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <section className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
        <h2 className="text-lg font-semibold mb-3">Book Appointment</h2>
        <form onSubmit={createAppointment} className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-300 mb-1">Doctor</label>
            <select
              name="doctorId"
              value={form.doctorId}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 focus:border-primary-500 text-sm"
              required
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} {d.specialization ? `(${d.specialization})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-300 mb-1">Schedule</label>
            <input
              type="datetime-local"
              name="scheduledAt"
              value={form.scheduledAt}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 focus:border-primary-500 text-sm"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-primary-500 text-slate-950 text-sm font-medium"
            >
              Book
            </button>
          </div>
        </form>
      </section>

      <section className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
        <h2 className="text-lg font-semibold mb-3">My Appointments</h2>
        <div className="space-y-3">
          {appointments.length === 0 && (
            <p className="text-sm text-slate-400">No appointments yet.</p>
          )}
          {appointments.map((appt) => (
            <div
              key={appt._id}
              className="border border-slate-800 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">
                  {appt.doctorId?.name || "Doctor"}{" "}
                  {appt.doctorId?.specialization && (
                    <span className="text-xs text-slate-400">
                      ({appt.doctorId.specialization})
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(appt.scheduledAt).toLocaleString()} •{" "}
                  <span className="uppercase">{appt.status}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {appt.status === "approved" && (
                  <button
                    onClick={() => joinCall(appt)}
                    className="px-3 py-1.5 rounded-md bg-primary-500 text-slate-950 text-sm"
                  >
                    Join Call
                  </button>
                )}
                <button
                  onClick={() => startChat(appt)}
                  className="px-3 py-1.5 rounded-md bg-slate-800 text-sm"
                >
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 flex flex-col">
        <h2 className="text-lg font-semibold mb-2">Chat</h2>
        {!chatTarget && (
          <p className="text-sm text-slate-400 mb-2">
            Select an appointment and click Chat to start talking with your doctor.
          </p>
        )}
        <div className="flex-1 border border-slate-800 rounded-md p-2 mb-3 overflow-y-auto space-y-1 text-sm">
          {chatMessages.length === 0 && (
            <p className="text-slate-500 text-xs">No messages yet.</p>
          )}
          {chatMessages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.fromUserId === user.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-2 py-1 rounded-md max-w-[80%] ${
                  m.fromUserId === user.id
                    ? "bg-primary-500 text-slate-950"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                <p>{m.message}</p>
                <p className="text-[10px] mt-0.5 text-slate-200/60">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={chatTarget ? "Type a message..." : "Select an appointment to chat"}
            disabled={!chatTarget}
            className="flex-1 px-3 py-2 rounded-md bg-slate-950 border border-slate-800 focus:border-primary-500 text-sm"
          />
          <button
            onClick={sendChat}
            disabled={!chatTarget || !chatInput.trim()}
            className="px-3 py-2 rounded-md bg-primary-500 text-slate-950 text-sm disabled:bg-slate-700"
          >
            Send
          </button>
        </div>
      </section>

      {statusUpdates.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-slate-300 mb-1">Recent updates</h3>
          <ul className="text-xs text-slate-400 list-disc list-inside space-y-0.5">
            {statusUpdates.slice(-5).map((s, idx) => (
              <li key={idx}>
                Appointment {s.appointmentId} status changed to {s.status}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default PatientDashboard;

