import express from "express";
import { getUsers, getDoctors, createUser, deleteUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", roleMiddleware(["admin"]), getUsers);
router.post("/", roleMiddleware(["admin"]), createUser);
router.delete("/:id", roleMiddleware(["admin"]), deleteUser);

router.get("/doctors", roleMiddleware(["admin", "doctor", "patient"]), getDoctors);

export default router;


