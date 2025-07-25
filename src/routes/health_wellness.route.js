import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";
import { healthWellnessSchema } from "../validators/healthWellnessValidator.js";
import { addResources,upsertResource,getResources , getResourcesDetails ,getAllResources ,updateResource } from "../controllers/headlthWellness.controller.js";

const router = Router();

router.post(
  "/upsert-resources",
  verifyJWT,
  upload.fields([
    {
      name: "resourceImage",
      maxCount: 1,
    },
  ]),
  errorHandler,
  validateRequest(healthWellnessSchema),
  upsertResource
);
router.get('/get-resources',verifyJWT,getResources);
router.get('/get-resource-details',verifyJWT,getResourcesDetails);
router.get('/get-all-resources',verifyJWT, getAllResources);
router.put('/updateResource/:id',verifyJWT,updateResource);

export default router;
