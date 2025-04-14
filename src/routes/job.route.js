import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";
import {
  jobValidationSchema,
  applyJobSchema,
} from "../validators/jobValidator.js";
import {
  addJob,
  getAllJobs,
  applyJob,
  uploadResume,
  getResume,
  getJobDetails,
} from "../controllers/jobs.controller.js";

const router = Router();

router.post(
  "/add-jobs",
  verifyJWT,
  upload.fields([
    {
      name: "jobImage",
      maxCount: 1,
    },
  ]),
  errorHandler,
  validateRequest(jobValidationSchema),
  addJob
);
router.get("/get-all-jobs", verifyJWT, getAllJobs);
router.post("/apply-job", verifyJWT, validateRequest(applyJobSchema), applyJob);
router.post(
  "/upload-resume",
  verifyJWT,
  upload.fields([
    {
      name: "resume",
      maxCount: 1,
    },
  ]),
  errorHandler,
  uploadResume
);
router.get("/get-resume", verifyJWT, getResume);
router.get("/job-details/:jobId",verifyJWT,getJobDetails);

export default router;
