const express = require("express");
const teamController = require("../controllers/teamController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", teamController.getAllTeamMembers);
router.get("/:id", teamController.getTeamMemberById);

// Admin routes
router.post("/", authMiddleware, teamController.createTeamMember);
router.put("/:id", authMiddleware, teamController.updateTeamMember);
router.delete("/:id", authMiddleware, teamController.deleteTeamMember);

module.exports = router;
