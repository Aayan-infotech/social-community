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
  updateAddressSchema,
  addToCartSchema,
  orderPlaceSchema,
  updateOrderStatusSchema,
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
  getAddress,
  updateAddress,
  removeAddress,
  addToCart,
  updateProductQuantity,
  getAllCustomers,
  addCard,
  deleteMarketplaceCategory,
  getSubCategories,
  deleteMarketplaceSubCategory,
  doKYC,
  getCards,
  getCartProducts,
  getMarketplaceProducts,
  orderPlace,
  placeOrder,
  confirmPaymentFn,
  removeProductFromCart,
  refreshUrl,
  myOrders,
  updateOrderStatus,
  getAllOrders,

  checkKYCStatus,
  loginExpress,
  getAllCategorires,
  getAllProducts
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

router.delete(
  "/delete-marketplace-category/:id",
  verifyJWT,
  errorHandler,
  deleteMarketplaceCategory
);

router.get("/get-category", verifyJWT, getCategory);
router.get('/get-all-category',verifyJWT, getAllCategorires);
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
router.get("/get-subcategories", verifyJWT, getSubCategories);
router.get("/get-subcategory/:category_id", verifyJWT, getSubCategory);
router.delete(
  "/delete-subcategory/:id",
  verifyJWT,
  errorHandler,
  deleteMarketplaceSubCategory
);
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
router.get("/my-products", verifyJWT, getProductList);
router.get('/products', verifyJWT, getMarketplaceProducts);
router.get("/product-details/:product_id", verifyJWT, getProductDetails);
router.delete("/remove-product/:product_id", verifyJWT, removeProduct);
router.post(
  "/add-to-cart",
  verifyJWT,
  validateRequest(addToCartSchema),
  errorHandler,
  addToCart
);
router.put(
  "/update-quantity",
  verifyJWT,
  validateRequest(addToCartSchema),
  errorHandler,
  updateProductQuantity
);
router.get("/get-cart", verifyJWT, getCartProducts);
router.delete("/remove-from-cart/:product_id", verifyJWT, removeProductFromCart);

// delivery address routes
router.post(
  "/add-address",
  verifyJWT,
  validateRequest(addAddressSchema),
  errorHandler,
  addAddress
);
router.get("/get-address", verifyJWT, getAddress);
router.put(
  "/update-address",
  verifyJWT,
  validateRequest(updateAddressSchema),
  errorHandler,
  updateAddress
);
router.delete("/delete-address/:addressId", verifyJWT, removeAddress);

router.post("/add-card", verifyJWT, addCard);
router.get("/card-list", verifyJWT, getCards);

router.get("/complete-kyc", verifyJWT, doKYC);
router.get('/refresh-url', refreshUrl);
router.get("/kyc-status", checkKYCStatus);
router.post('/place-order', verifyJWT, validateRequest(orderPlaceSchema), errorHandler, placeOrder);
router.put('/update-order-status', verifyJWT, validateRequest(updateOrderStatusSchema), errorHandler, updateOrderStatus);
router.get("/my-orders", verifyJWT, myOrders);
router.get("/get-orders", verifyJWT, getAllOrders);

router.get("/confirm-payment", verifyJWT, confirmPaymentFn);
router.get('/login-express', verifyJWT, loginExpress);

// web apis
router.get('/get-all-products',verifyJWT,getAllProducts);


export default router;
