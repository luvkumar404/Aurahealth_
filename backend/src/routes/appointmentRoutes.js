import express from "express";
import {
  createAppointment,
  getMyAppointments,
  updateAppointmentStatus
} from "../controllers/appointmentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", roleMiddleware(["patient"]), createAppointment);
router.get("/mine", roleMiddleware(["doctor", "patient"]), getMyAppointments);
router.patch("/:id/status", roleMiddleware(["doctor", "admin"]), updateAppointmentStatus);

export default router;

