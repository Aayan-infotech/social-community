import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";
import {
  jobValidationSchema,
  applyJobSchema,
  editJobValidationSchema,
} from "../validators/jobValidator.js";
import {
  addJob,
  getAllJobs,
  applyJob,
  uploadResume,
  getResume,
  getJobDetails,
  getApplicantList,
  editJob,
  deleteJob,
  getApplicantDetails,
  updateApplicantStatus,
  getSkillsSuggestion,
  professionalHomeFeed
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
router.put(
  "/edit-job",
  verifyJWT,
  upload.fields([
    {
      name: "jobImage",
      maxCount: 1,
    },
  ]),
  errorHandler,
  validateRequest(editJobValidationSchema),
  editJob
);
router.delete("/delete-job/:jobId", verifyJWT, deleteJob);
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
router.get("/job-details/:jobId", verifyJWT, getJobDetails);
router.get("/get-applicant-list", verifyJWT, getApplicantList);
router.get("/get-applicant-details", verifyJWT, getApplicantDetails);
router.put("/update-applicant-status", verifyJWT, updateApplicantStatus);

router.get('/get-skills-suggestion', verifyJWT, getSkillsSuggestion);

router.get('/professional-home-feed', verifyJWT, professionalHomeFeed);

export default router;
