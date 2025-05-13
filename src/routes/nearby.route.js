import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  upsertBussinessCategorySchema,
  addBusinessSchema,
} from "../validators/nearbyBussinessValidator.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";
import {
  upsertBussinessCategory,
  getBusinessCategory,
  addBusiness,
  getBusiness,
  updateBusinessStatus,
  getNearByBusiness,
} from "../controllers/nearby.controller.js";
const router = Router();

router.post(
  "/upsert-bussiness-category",
  verifyJWT,
  upload.fields([
    {
      name: "category_image",
      maxCount: 1,
    },
  ]),
  validateRequest(upsertBussinessCategorySchema),
  errorHandler,
  upsertBussinessCategory
);
router.get("/get-business-category", verifyJWT, getBusinessCategory);
router.post(
  "/add-business",
  verifyJWT,
  upload.fields([
    {
      name: "businessImages",
      maxCount: 5,
    },
  ]),
  validateRequest(addBusinessSchema),
  errorHandler,
  addBusiness
);
router.get("/get-business", verifyJWT, getBusiness);
router.put("/update-business-status", verifyJWT, updateBusinessStatus);
router.get("/get-nearby-business-marker", verifyJWT, getNearByBusiness);

export default router;
