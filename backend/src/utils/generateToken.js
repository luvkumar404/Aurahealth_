import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  const payload = {
    id: user._id,
    role: user.role
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

