import { User } from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Get users error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-password");
    return res.status(200).json({ doctors });
  } catch (error) {
    console.error("Get doctors error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createUser = async (req, res) => {
  try {
    // For simplicity, delegate to auth/register on frontend; this is mainly for admin management extension.
    return res.status(501).json({ message: "Not implemented. Use /api/auth/register instead." });
  } catch (error) {
    console.error("Create user error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

