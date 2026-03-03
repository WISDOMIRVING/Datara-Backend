import express from "express";
import {
  airtime,
  data,
  electricity,
  cable,
  exam,
} from "../controllers/vtu.controller.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { vtuPurchaseSchema } from "../validations/schemas.js";

const router = express.Router();

router.use(auth);

router.post("/airtime", validate(vtuPurchaseSchema), airtime);
router.post("/data", validate(vtuPurchaseSchema), data);
router.post("/electricity", validate(vtuPurchaseSchema), electricity);
router.post("/cable", validate(vtuPurchaseSchema), cable);
router.post("/exam", validate(vtuPurchaseSchema), exam);


export default router;
