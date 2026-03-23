const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

router.post("/", groupController.createGroup);
router.get("/", groupController.getGroups);
router.get("/:id", groupController.getGroupById);
router.put("/:id", groupController.updateGroup);
router.delete("/:id", groupController.deleteGroup);
router.post("/:id/users", groupController.addUserToGroup);
router.delete("/:id/users/:userId", groupController.removeUserFromGroup);
router.get("/:id/users", groupController.getGroupUsers);

module.exports = router;
