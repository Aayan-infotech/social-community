import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";
import {
  upsertFamily,
  addFamilyMemberRequest,
  getFamilyMembersRequest,
  acceptFamilyMemberRequest,
  getFamilyTree,
} from "../controllers/family.controller.js";
import {
  familySchema,
  addFamilyMemberRequestSchema,
  acceptFamilyMemberRequestSchema,
} from "../validators/familyValidator.js";

const router = Router();

// router.post("/upsert",verifyJWT,validateRequest(familySchema),upsertFamily);
router.post(
  "/add-member-request",
  verifyJWT,
  validateRequest(addFamilyMemberRequestSchema),
  addFamilyMemberRequest
);

router.get("/get-requests-members",verifyJWT,getFamilyMembersRequest);
router.put("/accept-request-member-request",verifyJWT,validateRequest(acceptFamilyMemberRequestSchema),acceptFamilyMemberRequest);
router.get('/tree',verifyJWT,getFamilyTree);

export default router;
