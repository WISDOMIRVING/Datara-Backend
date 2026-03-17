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
import {
  airtimeSchema,
  dataSchema,
  electricitySchema,
  cableSchema,
  examSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.use(auth);

router.post("/airtime", validate(airtimeSchema), airtime);
router.post("/data", validate(dataSchema), data);
router.post("/electricity", validate(electricitySchema), electricity);
router.post("/cable", validate(cableSchema), cable);
router.post("/exam", validate(examSchema), exam);

export default router;
