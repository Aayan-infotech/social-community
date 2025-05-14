import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";
import {
  upsertCategorySchema,
  upsertSubcategorySchema,
  addProductSchema,
  updateProductSchema,
  addAddressSchema,
} from "../validators/marketplaceValidator.js";
import {
  upsertCategory,
  getCategory,
  upsertSubcategory,
  getSubCategory,
  addProduct,
  updateProduct,
  getProductList,
  getProductDetails,
  removeProduct,
  addAddress,
} from "../controllers/marketplace.controller.js";

const router = Router();

router.post(
  "/upsert-category",
  verifyJWT,
  upload.fields([
    {
      name: "category_image",
      maxCount: 1,
    },
  ]),
  validateRequest(upsertCategorySchema),
  errorHandler,
  upsertCategory
);

router.get("/get-category", verifyJWT, getCategory);
router.post(
  "/upsert-subcategory",
  verifyJWT,
  upload.fields([
    {
      name: "subcategory_image",
      maxCount: 1,
    },
  ]),
  validateRequest(upsertSubcategorySchema),
  errorHandler,
  upsertSubcategory
);
router.get("/get-subcategory/:category_id", verifyJWT, getSubCategory);
router.post(
  "/add-product",
  verifyJWT,
  upload.fields([
    {
      name: "product_image",
      maxCount: 5,
    },
  ]),
  validateRequest(addProductSchema),
  errorHandler,
  addProduct
);
router.put(
  "/update-product",
  verifyJWT,
  upload.fields([
    {
      name: "product_image",
      maxCount: 5,
    },
  ]),
  validateRequest(updateProductSchema),
  errorHandler,
  updateProduct
);
router.get("/product-list", verifyJWT, getProductList);
router.get("/product-details/:product_id", verifyJWT, getProductDetails);
router.delete("/remove-product/:product_id", verifyJWT, removeProduct);

// delivery address routes
router.post('/add-address',verifyJWT,validateRequest(addAddressSchema),errorHandler,addAddress);
// router.get("/get-address/:userId", verifyJWT, getAddress);
// router.put("/update-address/:userId", verifyJWT, validateRequest(updateAddressSchema), errorHandler, updateAddress);
// router.delete("/remove-address/:userId", verifyJWT, removeAddress);

export default router;
