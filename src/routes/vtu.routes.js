import express from "express";
import {
  airtime,
  data,
  electricity,
  cable,
  exam,
} from "../controllers/vtu.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.post("/airtime", airtime);
router.post("/data", data);
router.post("/electricity", electricity);
router.post("/cable", cable);
router.post("/exam", exam);

export default router;
