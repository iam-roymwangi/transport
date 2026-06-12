const express = require("express");
const router = express.Router();
const {
  getEditRequests,
  postEditRequest,
  approveEditRequest,
  rejectEditRequest,
} = require("../controllers/editRequestController");

router.get("/", getEditRequests);
router.post("/", postEditRequest);
router.post("/:id/approve", approveEditRequest);
router.post("/:id/reject", rejectEditRequest);

module.exports = router;
