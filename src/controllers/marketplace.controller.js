import mongoose from "mongoose";
import BusinessCategory from "../models/nearByBussinessCategory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteObject, uploadImage } from "../utils/awsS3Utils.js";
import { isValidObjectId } from "../utils/isValidObjectId.js";
import MarketPlaceCategory from "../models/marketPlaceCategory.model.js";
import MarketPlaceSubCategory from "../models/marketplaceSubCategory.model.js";
import DeliveryAddress from "../models/deliveryAddress.model.js";
import Product from "../models/product.model.js";
import Cart from "../models/addtocart.model.js";
import { updateOrderStatus, updateVirtualEventStatus } from "../utils/webhookUtils.js";
import {
  addCardToCustomer,
  completeKYC,
  getCardList,
  createPaymentIntent,
  paymentSheet,
  confirmPayment,
  handleKYCStatus,
  createLoginLink,
  productOrder,
} from "../services/stripeService.js";
import Card from "../models/userCard.model.js";
import { User } from "../models/user.model.js";
import { generateUniqueOrderId } from "../utils/HelperFunctions.js";
import Order from "../models/orders.model.js";
import { FRONTEND_URL } from "../constants.js";

const upsertCategory = asyncHandler(async (req, res) => {
  const { id, category_name } = req.body;
  const userId = req.user.userId;

  let category_image = "";

  let existingCategory = null;
  if (id) {
    if (!isValidObjectId(id)) {
      throw new ApiError(400, "Invalid category ID");
    }
    existingCategory = await MarketPlaceCategory.findById(id);
    if (!existingCategory) {
      throw new ApiError(404, "Business category not found");
    }
  }

  if (req.files && req.files.category_image) {
    const businessCategory = await MarketPlaceCategory.findById(id);
    if (businessCategory && businessCategory.category_image) {
      const deleteImage = await deleteObject(businessCategory.category_image);
      if (!deleteImage) {
        throw new ApiError(500, "Failed to delete old image");
      }
    }

    const file = req.files.category_image[0];
    const saveUpload = await uploadImage(file);
    if (!saveUpload.success) {
      throw new ApiError(500, "Failed to upload image");
    }
    category_image = saveUpload?.fileUrl;
  } else {
    category_image = existingCategory?.category_image || "";
  }

  let updateData = {
    category_name,
    category_image,
    userId,
  };

  const mCategory = await MarketPlaceCategory.findByIdAndUpdate(
    id || new mongoose.Types.ObjectId(),
    { $set: updateData },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, "Category updated successfully", mCategory));
});

const deleteMarketplaceCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid category ID");
  }
  const category = await MarketPlaceCategory.findByIdAndDelete(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  const subCategory = await MarketPlaceSubCategory.deleteMany({
    category_id: id,
  });
  if (!subCategory) {
    throw new ApiError(404, "Subcategory not found");
  }
  res.json(
    new ApiResponse(200, "Category and subcategory deleted successfully")
  );
});

const getCategory = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const mCategory = await MarketPlaceCategory.find({
    category_name: { $regex: search ? search : "", $options: "i" },
  }).select("-__v -userId");
  if (!mCategory) {
    throw new ApiError(404, "No business category found");
  }
  res.json(
    new ApiResponse(200, "Business category fetched successfully", mCategory)
  );
});

const getAllCategorires = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const role = req.user.role;
  if (!role.includes("admin")) {
    throw new ApiError(403, "You do not have permission to access this resource");
  }
  const { sortBy = "createdAt", sortOrder = "desc", search } = req.query;


  const aggregation = [];
  if (search) {
    aggregation.push({
      $match: {
        category_name: { $regex: search, $options: "i" },
      },
    });
  }

  aggregation.push({
    $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
  });

  aggregation.push({
    $facet: {
      categories: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            category_name: 1,
            category_image: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const categoryList = await MarketPlaceCategory.aggregate(aggregation);
  const categories = categoryList[0]?.categories || [];
  const totalCount = categoryList[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(200, "Categories fetched successfully", {
      categories,
      total_page: totalPages,
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
  );
});

const upsertSubcategory = asyncHandler(async (req, res) => {
  const { id, category_id, subcategory_name } = req.body;
  const userId = req.user.userId;

  if (!isValidObjectId(category_id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  let subcategory_image = "";

  let existingSubCategory = null;
  if (id) {
    if (!isValidObjectId(id)) {
      throw new ApiError(400, "Invalid subcategory ID");
    }
    existingSubCategory = await MarketPlaceSubCategory.findById(id);
    if (!existingSubCategory) {
      throw new ApiError(404, "Subcategory not found");
    }
  }

  if (req.files && req.files.subcategory_image) {
    const businessCategory = await BusinessCategory.findById(id);
    if (businessCategory && businessCategory.subcategory_image) {
      const deleteImage = await deleteObject(
        businessCategory.subcategory_image
      );
      if (!deleteImage) {
        throw new ApiError(500, "Failed to delete old image");
      }
    }

    const file = req.files.subcategory_image[0];
    const saveUpload = await uploadImage(file);
    if (!saveUpload.success) {
      throw new ApiError(500, "Failed to upload image");
    }
    subcategory_image = saveUpload?.fileUrl;
  } else {
    subcategory_image = existingSubCategory?.subcategory_image || "";
  }

  let updateData = {
    category_id,
    subcategory_name,
    subcategory_image,
    userId,
  };

  const mSubCategory = await MarketPlaceSubCategory.findByIdAndUpdate(
    id || new mongoose.Types.ObjectId(),
    { $set: updateData },
    { new: true, upsert: true }
  );

  res.json(
    new ApiResponse(200, "Subcategory updated successfully", mSubCategory)
  );
});

const getSubCategory = asyncHandler(async (req, res) => {
  const { category_id } = req.params;

  if (!isValidObjectId(category_id)) {
    throw new ApiError(400, "Invalid category ID");
  }
  const subCategory = await MarketPlaceSubCategory.find({
    category_id,
  });
  if (!subCategory) {
    throw new ApiError(404, "No subcategory found");
  }
  res.json(
    new ApiResponse(200, "Subcategory fetched successfully", subCategory)
  );
});

const addProduct = asyncHandler(async (req, res) => {
  const {
    product_name,
    category_id,
    subcategory_id,
    product_discount,
    product_price,
    product_quantity,
    product_description,
  } = req.body;
  const userId = req.user.userId;

  const isKYCCompleted = req.user?.isKYCVerified;
  if (!isKYCCompleted) {
    throw new ApiError(403, "KYC verification is required to add a product");
  }

  if (!isValidObjectId(category_id)) {
    throw new ApiError(400, "Invalid category ID");
  }
  if (!isValidObjectId(subcategory_id)) {
    throw new ApiError(400, "Invalid subcategory ID");
  }

  const role = req.user?.role;

  if (!role.includes("vendor")) {
    req.user.role.push("vendor");
    await req.user.save();
  }

  let product_image = [];
  if (req.files && req.files.product_image) {
    const files = req.files.product_image;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const saveUpload = await uploadImage(file);
      if (!saveUpload.success) {
        throw new ApiError(500, "Failed to upload image");
      }
      product_image.push(saveUpload?.fileUrl);
    }
  }

  const product = new Product({
    product_name,
    category_id,
    subcategory_id,
    product_discount,
    product_price,
    product_quantity,
    product_image,
    product_description,
    userId,
  });
  await product.save();
  if (!product) {
    throw new ApiError(500, "Failed to add product");
  }
  res.json(new ApiResponse(200, "Product added successfully", product));
});

const updateProduct = asyncHandler(async (req, res) => {
  const {
    id,
    product_name,
    category_id,
    subcategory_id,
    product_discount,
    product_price,
    product_quantity,
    product_description,
    remove_images,
  } = req.body;
  const userId = req.user.userId;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid product ID");
  }
  if (!isValidObjectId(category_id)) {
    throw new ApiError(400, "Invalid category ID");
  }
  if (!isValidObjectId(subcategory_id)) {
    throw new ApiError(400, "Invalid subcategory ID");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  let product_image = product.product_image;

  if (remove_images !== "") {
    const removeImages = remove_images.split(",");
    for (let i = 0; i < removeImages.length; i++) {
      const imageUrl = removeImages[i];
      const deleteImage = await deleteObject(imageUrl);
      if (!deleteImage) {
        throw new ApiError(500, "Failed to delete old image");
      }
    }
    product_image = product_image.filter(
      (image) => !removeImages.includes(image)
    );
  }

  if (req.files && req.files.product_image) {
    const files = req.files.product_image;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const saveUpload = await uploadImage(file);
      if (!saveUpload.success) {
        throw new ApiError(500, "Failed to upload image");
      }
      product_image.push(saveUpload?.fileUrl);
    }
  }

  const updateData = {
    product_name,
    category_id,
    subcategory_id,
    product_discount,
    product_price,
    product_quantity,
    product_image,
    product_description,
    userId,
  };

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );

  if (!updatedProduct) {
    throw new ApiError(500, "Failed to update product");
  }

  res.json(
    new ApiResponse(200, "Product updated successfully", updatedProduct)
  );
});

const getProductList = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const userId = req.query.userId || req.user.userId;

  const aggregation = [];

  aggregation.push({
    $match: {
      userId: userId,
    },
  });
  aggregation.push({
    $lookup: {
      from: "marketplacecategories",
      localField: "category_id",
      foreignField: "_id",
      as: "category",
    },
  });

  aggregation.push({
    $unwind: {
      path: "$category",
      preserveNullAndEmptyArrays: true,
    },
  });

  aggregation.push({
    $lookup: {
      from: "marketplacesubcategories",
      localField: "subcategory_id",
      foreignField: "_id",
      as: "subcategory",
    },
  });
  aggregation.push({
    $unwind: {
      path: "$subcategory",
      preserveNullAndEmptyArrays: true,
    },
  });

  aggregation.push({
    $facet: {
      products: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            product_name: 1,
            product_image: 1,
            product_price: 1,
            product_discount: 1,
            product_description: 1,
            product_quantity: 1,
            category_name: "$category.category_name",
            subcategory_name: "$subcategory.subcategory_name",
            status: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const productList = await Product.aggregate(aggregation);
  const products = productList[0]?.products || [];
  const totalCount = productList[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      products.length > 0
        ? "Products fetched successfully"
        : "No products found",
      products.length > 0
        ? {
          products,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const getMarketplaceProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const { category_id, subcategory_id } = req.query;

  if (category_id && !isValidObjectId(category_id)) {
    throw new ApiError(400, "Invalid category ID");
  }
  if (subcategory_id && !isValidObjectId(subcategory_id)) {
    throw new ApiError(400, "Invalid subcategory ID");
  }

  const aggregation = [];
  aggregation.push({
    $match: {
      status: "approved",
      userId: { $ne: req.user.userId },
    },
  });
  // get the category or subcategory id from the query

  if (category_id && subcategory_id) {
    aggregation.push({
      $match: {
        $and: [
          {
            category_id: category_id
              ? new mongoose.Types.ObjectId(category_id)
              : null,
          },
          {
            subcategory_id: subcategory_id
              ? new mongoose.Types.ObjectId(subcategory_id)
              : null,
          },
        ],
      },
    });
  } else if (category_id) {
    aggregation.push({
      $match: {
        category_id: category_id
          ? new mongoose.Types.ObjectId(category_id)
          : null,
      },
    });
  }

  aggregation.push({
    $facet: {
      products: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            product_name: 1,
            product_image: 1,
            product_price: 1,
            product_discount: 1,
            product_quantity: 1,
            product_description: 1,
            category_id: 1,
            subcategory_id: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const productList = await Product.aggregate(aggregation);

  const products = productList[0]?.products || [];
  const totalCount = productList[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(
      200,
      products?.length > 0
        ? "Products fetched successfully"
        : "No products found",
      products?.length > 0
        ? {
          products,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});

const getProductDetails = asyncHandler(async (req, res) => {
  const { product_id } = req.params;

  if (!isValidObjectId(product_id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(product_id)
    .populate("category_id")
    .populate("subcategory_id");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json(
    new ApiResponse(200, "Product details fetched successfully", product)
  );
});

const removeProduct = asyncHandler(async (req, res) => {
  const { product_id } = req.params;

  if (!isValidObjectId(product_id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findByIdAndDelete(product_id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json(new ApiResponse(200, "Product deleted successfully"));
});

// Delivery Address Management
const addAddress = asyncHandler(async (req, res) => {
  const {
    name,
    mobile,
    alternate_mobile,
    pincode,
    city,
    state,
    country,
    address,
  } = req.body;
  const userId = req.user.userId;

  const addressData = {
    name,
    mobile,
    alternate_mobile,
    pincode,
    city,
    state,
    country,
    address,
    userId,
  };

  const newAddress = await DeliveryAddress.create(addressData);
  if (!newAddress) {
    throw new ApiError(500, "Failed to add address");
  }

  res.json(new ApiResponse(200, "Address added successfully", newAddress));
});

const getAddress = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const addressList = await DeliveryAddress.find({ userId });
  if (!addressList) {
    throw new ApiError(404, "No address found");
  }
  res.json(
    new ApiResponse(200, "Address list fetched successfully", addressList)
  );
});

const updateAddress = asyncHandler(async (req, res) => {
  const {
    id,
    name,
    mobile,
    alternate_mobile,
    pincode,
    city,
    state,
    country,
    address,
  } = req.body;
  const userId = req.user.userId;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid address ID");
  }

  const addressData = {
    name,
    mobile,
    alternate_mobile,
    pincode,
    city,
    state,
    country,
    address,
    userId,
  };

  const updatedAddress = await DeliveryAddress.findByIdAndUpdate(
    id,
    addressData,
    { new: true }
  );
  if (!updatedAddress) {
    throw new ApiError(500, "Failed to update address");
  }

  res.json(
    new ApiResponse(200, "Address updated successfully", updatedAddress)
  );
});

const removeAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  if (!isValidObjectId(addressId)) {
    throw new ApiError(400, "Invalid address ID");
  }

  const address = await DeliveryAddress.findByIdAndDelete(addressId);
  if (!address) {
    throw new ApiError(404, "Address not found");
  }
  res.json(new ApiResponse(200, "Address deleted successfully"));
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check if the product is already in the cart
  const existingCartItem = await Cart.findOne({ userId, productId });
  if (existingCartItem) {
    // If it exists, update the quantity
    existingCartItem.quantity += quantity;
    await existingCartItem.save();
  } else {
    const cartData = {
      userId,
      productId,
      quantity,
    };

    // Add to cart logic here
    const addToCart = await Cart.create(cartData);
    if (!addToCart) {
      throw new ApiError(500, "Failed to add product to cart");
    }
  }

  res.json(new ApiResponse(200, "Product added to cart successfully", product));
});

const updateProductQuantity = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const cartItem = await Cart.findOne({ userId, productId });
  if (!cartItem) {
    throw new ApiError(404, "Product not found in cart");
  }

  cartItem.quantity = quantity;
  await cartItem.save();

  res.json(new ApiResponse(200, "Product quantity updated successfully"));
});

const removeProductFromCart = asyncHandler(async (req, res) => {
  const { product_id } = req.params;

  if (!isValidObjectId(product_id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const cartItem = await Cart.findOneAndDelete({
    userId: req.user.userId,
    productId: product_id,
  });
  if (!cartItem) {
    throw new ApiError(404, "Product not found in cart");
  }
  res.json(new ApiResponse(200, "Product removed from cart successfully"));
});

const getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await getAllCustomersList();
  if (!customers) {
    throw new ApiError(404, "No customers found");
  }
  res.json(
    new ApiResponse(200, "Customer list fetched successfully", customers)
  );
});

const addCard = asyncHandler(async (req, res) => {
  const { cardToken } = req.body;
  if (!cardToken) {
    throw new ApiError(400, "Card token not provided");
  }

  const customerId = req.user.stripeCustomerId;
  if (!customerId) {
    throw new ApiError(400, "Customer ID not found");
  }
  const response = await addCardToCustomer(customerId, cardToken);

  const cardData = {
    userId: req.user.userId,
    cardId: response.id,
    brand: response.brand,
    last4: response.last4,
    expMonth: response.exp_month,
    expYear: response.exp_year,
  };

  const card = await Card.create(cardData);
  if (!card) {
    throw new ApiError(500, "Failed to add card");
  }
  res.json(new ApiResponse(200, "Card added successfully", card));
});

const getCards = asyncHandler(async (req, res) => {
  const customerId = req.user.stripeCustomerId;
  if (!customerId) {
    throw new ApiError(400, "Customer ID not found");
  }
  const cards = await getCardList(customerId);
  if (!cards) {
    throw new ApiError(404, "No cards found");
  }
  res.json(new ApiResponse(200, "Card list fetched successfully", cards));
});

const getSubCategories = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const role = req.user.role;
  if (!role.includes("admin")) {
    throw new ApiError(403, "You do not have permission to access this resource");
  }
  const { sortBy = "createdAt", sortOrder = "desc", search } = req.query;

  const aggregation = [];
  aggregation.push({
    $lookup: {
      from: "marketplacecategories",
      localField: "category_id",
      foreignField: "_id",
      as: "category",
    },
  });
  aggregation.push({
    $unwind: {
      path: "$category",
      preserveNullAndEmptyArrays: true,
    },
  });
  if (search) {
    aggregation.push({
      $match: {
        $or: [
          { subcategory_name: { $regex: search, $options: "i" } },
          { "category.category_name": { $regex: search, $options: "i" } }
        ]
      },
    });
  }

  aggregation.push({
    $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
  });

  aggregation.push({
    $facet: {
      subcategories: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            subcategory_name: 1,
            subcategory_image: 1,
            category_id: 1,
            category_name: "$category.category_name",
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const subCategoryList = await MarketPlaceSubCategory.aggregate(aggregation);
  const subcategories = subCategoryList[0]?.subcategories || [];
  const totalCount = subCategoryList[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(200, "Subcategories fetched successfully", {
      subcategories,
      total_page: totalPages,
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
  );

});

const deleteMarketplaceSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid Subcategory ID");
  }
  const subcategory = await MarketPlaceSubCategory.findByIdAndDelete(id);
  if (!subcategory) {
    throw new ApiError(404, "Subcategory not found");
  }
  res.json(new ApiResponse(200, "Subcategory deleted successfully"));
});

const doKYC = asyncHandler(async (req, res) => {
  const { stripeAccountId } = req.user;
  if (!stripeAccountId) {
    throw new ApiError(400, "Stripe account ID not found");
  }
  const accountLink = await completeKYC(stripeAccountId);
  if (!accountLink) {
    throw new ApiError(500, "Failed to create account link");
  }
  res.json(
    new ApiResponse(200, "KYC process initiated successfully", accountLink)
  );
});

const refreshUrl = asyncHandler(async (req, res) => {
  const { id } = req.query;
  if (!id) {
    throw new ApiError(400, "Account ID not found");
  }
  const getUser = await User.findOne({ stripeAccountId: id });
  if (!getUser) {
    throw new ApiError(404, "User not found with the provided account ID");
  }
  const stripeAccountId = getUser.stripeAccountId;

  const accountLink = await completeKYC(stripeAccountId);
  if (!accountLink) {
    throw new ApiError(500, "Failed to create account link");
  }

  // res.json(
  //   new ApiResponse(200, "KYC process refreshed successfully", accountLink)
  // );
  res.redirect(accountLink.url);
});

const checkKYCStatus = asyncHandler(async (req, res) => {
  const { id } = req.query;
  if (!id) {
    throw new ApiError(400, "Account ID not found");
  }
  const getUser = await User.findOne({ stripeAccountId: id });
  if (!getUser) {
    throw new ApiError(404, "User not found with the provided account ID");
  }
  const stripeAccountId = getUser.stripeAccountId;
  const status = await handleKYCStatus(stripeAccountId);


  if (status === "active") {
    getUser.isKYCVerified = true;
    const saveStatus = await getUser.save();
    if (!saveStatus) {
      throw new ApiError(500, "Failed to update KYC status");
    }
    return res.redirect(`${FRONTEND_URL}kyc-success`);
  } else if (status === "pending") {
    return res.json(new ApiResponse(200, "KYC is pending", status));
  } else {
    return res.json(new ApiResponse(200, "KYC is not verified", status));
  }

});

const getCartProducts = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const aggregation = [];

  aggregation.push({
    $match: {
      userId: userId,
    },
  });

  aggregation.push({
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "product",
    },
  });

  aggregation.push({
    $unwind: {
      path: "$product",
      preserveNullAndEmptyArrays: true,
    },
  });

  // seller details
  aggregation.push({
    $lookup: {
      from: "users",
      localField: "product.userId",
      foreignField: "userId",
      as: "seller",
    },
  });
  aggregation.push({
    $unwind: {
      path: "$seller",
      preserveNullAndEmptyArrays: true,
    },
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "buyer",
    },
  });

  aggregation.push({
    $unwind: {
      path: "$buyer",
      preserveNullAndEmptyArrays: true,
    },
  });

  aggregation.push({
    $project: {
      _id: 1,
      productId: 1,
      quantity: 1,
      "product.product_name": 1,
      "product.product_price": 1,
      "product.product_image": 1,
      "product.product_discount": 1,
      "buyer.name": 1,
      "buyer.email": 1,
      "seller.name": 1,
      "seller.email": 1,
    },
  });

  const cartProducts = await Cart.aggregate(aggregation);

  if (!cartProducts.length === 0) {
    throw new ApiError(404, "No products found in cart");
  }
  res.json(
    new ApiResponse(200, "Cart products fetched successfully", cartProducts)
  );
});

const orderPlace = asyncHandler(async (req, res) => {
  const { product_ids, address_id, payment_method, order_amount } = req.body;
  const userId = req.user.userId;

  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    throw new ApiError(400, "Invalid product IDs");
  }
  if (!isValidObjectId(address_id)) {
    throw new ApiError(400, "Invalid address ID");
  }

  const product = await Product.findById(product_ids[0]);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const address = await DeliveryAddress.findById(address_id);
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  const paymentIntent = await createPaymentIntent(
    req.user.stripeCustomerId,
    order_amount,
    "usd"
  );

  if (!paymentIntent) {
    throw new ApiError(500, "Failed to create payment intent");
  }

  const confirm = await confirmPayment(paymentIntent.id);

  // Order placement logic here

  res.json(new ApiResponse(200, "Order placed successfully", paymentIntent));
});

const placeOrder = asyncHandler(async (req, res) => {
  const { product_ids, quantity, address_id, order_amount } = req.body;
  const userId = req.user.userId;

  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    throw new ApiError(400, "Invalid product IDs");
  }
  if (!isValidObjectId(address_id)) {
    throw new ApiError(400, "Invalid address ID");
  }

  const aggregation = [
    {
      $match: {
        _id: { $in: product_ids.map(id => new mongoose.Types.ObjectId(id)) }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "userId",
        as: "user"
      }
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        product_name: 1,
        product_price: 1,
        product_discount: 1,
        product_quantity: 1,
        userId: 1,
        user: {
          name: "$user.name",
          email: "$user.email",
          stripeAccountId: "$user.stripeAccountId",
          stripeCustomerId: "$user.stripeCustomerId"
        }
      }
    }
  ];

  const products = await Product.aggregate(aggregation);
  if (products.length === 0) {
    throw new ApiError(404, "Product not found");
  }

  for (const item of products) {
    const index = product_ids.indexOf(item._id.toString());
    const qty = quantity[index];
    if (item.product_quantity < qty) {
      throw new ApiError(400, `Insufficient stock for product ${item.product_name}`);
    }
  }

  const orderItems = [];
  let totalAmount = 0;

  for (const item of products) {
    const index = product_ids.indexOf(item._id.toString());
    const qty = quantity[index];
    const discountedPrice = item.product_price - (item.product_price * item.product_discount) / 100;
    const itemTotal = discountedPrice * qty;

    totalAmount += itemTotal;

    orderItems.push({
      productId: item._id,
      sellerId: item.userId,
      quantity: qty,
      amount: discountedPrice,
      currency: "usd",
      status: "pending",
    });
  }

  if (Number(totalAmount.toFixed(2)) !== Number(order_amount)) {
    throw new ApiError(400, "Order amount does not match the total amount");
  }

  const address = await DeliveryAddress.findOne({ _id: address_id, userId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  const orderId = generateUniqueOrderId();

  // Group items by vendor
  const vendorGroups = orderItems.reduce((acc, item) => {
    if (!acc[item.sellerId]) acc[item.sellerId] = [];
    acc[item.sellerId].push(item);
    return acc;
  }, {});

  console.log(vendorGroups);



  // Create ONE Stripe PaymentIntent for full order
  const paySheet = await productOrder(
    req.user.stripeCustomerId,
    totalAmount,
    "usd",
    orderId,
    userId,
    JSON.stringify(product_ids)
  );


  const savedOrders = [];
  for (const [sellerId, items] of Object.entries(vendorGroups)) {
    console.log(`Processing orders for seller: ${sellerId}`);
    const vendorTotal = items.reduce((sum, i) => sum + i.amount * i.quantity, 0);
    console.log(`Total amount for seller ${sellerId}: ${vendorTotal}`);

    const orderDoc = new Order({
      orderId,                  // SAME for all vendors
      transferGroup: orderId,   // Used by Stripe
      buyerId: userId,
      sellerId,                 // NEW: store vendor-specific order
      shippingAddressId: address_id,
      items,
      totalAmount: vendorTotal,
      currency: "usd",
      paymentStatus: "pending",
      paymentIntentId: paySheet.id,
      isTransferred: false,
      transferAmount: 0
    });

    const saved = await orderDoc.save();
    if (!saved) throw new ApiError(500, "Failed to save vendor order");

    savedOrders.push(saved);
  }




  paySheet.orderId = orderId;
  paySheet.vendorOrders = savedOrders.map(o => ({
    orderDbId: o._id,
    sellerId: o.sellerId,
    vendorAmount: o.totalAmount
  }));

  return res.status(200).json(
    new ApiResponse(200, "Payment sheet created successfully", paySheet)
  );
});



const confirmPaymentFn = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    throw new ApiError(400, "Payment intent ID not provided");
  }

  const paymentIntent = await confirmPayment(paymentIntentId);
  if (!paymentIntent) {
    throw new ApiError(500, "Failed to confirm payment");
  }

  res.json(
    new ApiResponse(200, "Payment confirmed successfully", paymentIntent)
  );
});

const loginExpress = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user.stripeAccountId) {
    throw new ApiError(400, "Stripe account ID not found");
  }
  const loginLink = await createLoginLink(user.stripeAccountId);
  if (!loginLink) {
    throw new ApiError(500, "Failed to create login link");
  }
  res.json(new ApiResponse(200, "Login link created successfully", loginLink));
});

const myOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const userId = req.user.userId;


  const aggregation = [];

  aggregation.push({
    $match: { buyerId: userId },
  });

  aggregation.push({
    $lookup: {
      from: "products",
      localField: "items.productId",
      foreignField: "_id",
      as: "product"
    }
  });


  aggregation.push({
    $lookup: {
      from: "deliveryaddresses",
      localField: "shippingAddressId",
      foreignField: "_id",
      as: "shippingAddress"
    }
  });

  aggregation.push({
    $unwind: {
      path: "$shippingAddress",
      preserveNullAndEmptyArrays: true
    }
  });

  aggregation.push({
    $sort: {
      createdAt: -1
    }
  });

  aggregation.push({
    $facet: {
      orders: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            orderId: 1,
            buyerId: 1,
            sellerId: 1,
            shippingAddressId: {
              name: "$shippingAddress.name",
              mobile: "$shippingAddress.mobile",
              alternate_mobile: "$shippingAddress.alternate_mobile",
              address: "$shippingAddress.address",
              city: "$shippingAddress.city",
              state: "$shippingAddress.state",
              country: "$shippingAddress.country",
              pincode: "$shippingAddress.pincode"
            },
            items: {
              $map: {
                input: "$items",
                as: "item",
                in: {
                  $mergeObjects: [
                    "$$item",
                    {
                      product: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$product",
                              as: "prod",
                              cond: { $eq: ["$$prod._id", "$$item.productId"] }
                            }
                          },
                          0
                        ]
                      }
                    }
                  ]
                }
              }
            },
            totalAmount: 1,
            currency: 1,
            paymentStatus: 1,
            status: 1,
            trackingId: 1,
            carrierPartner: 1,
            cancellationRemark: 1,
            placeOrderDate: 1,
            shippingDate: 1,
            deliveryDate: 1,
            cancellationDate: 1,
            createdAt: 1,
            updatedAt: 1
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await Order.aggregate(aggregation);
  const orders = result[0]?.orders || [];
  const totalCount = result[0]?.totalCount?.[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return res.json(
    new ApiResponse(
      200,
      orders.length ? "Orders fetched successfully" : "No orders found",
      orders.length
        ? {
          orders,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit,
        }
        : null
    )
  );
});



const myOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { sellerId } = req.query;
  const userId = req.user.userId;

  if (!sellerId) {
    throw new ApiError(400, "Seller ID is required");
  }

  const aggregation = [];

  aggregation.push({ $match: { orderId, buyerId: userId, sellerId } });
  aggregation.push({
    $lookup: {
      from: "deliveryaddresses",
      localField: "shippingAddressId",
      foreignField: "_id",
      as: "shippingAddress"
    }
  });
  aggregation.push({
    $unwind: {
      path: "$shippingAddress",
      preserveNullAndEmptyArrays: true
    }
  });

  aggregation.push({
    $lookup: {
      from: "products",
      localField: "items.productId",
      foreignField: "_id",
      as: "product"
    }
  });


  aggregation.push({
    $lookup: {
      from: 'users',
      localField: 'sellerId',
      foreignField: 'userId',
      as: 'seller'
    }
  });

  aggregation.push({
    $unwind: {
      path: "$seller",
      preserveNullAndEmptyArrays: true
    }
  });

  aggregation.push({
    $project: {
      _id: 0,
      orderId: 1,
      buyerId: 1,
      shippingAddress: {
        name: "$shippingAddress.name",
        mobile: "$shippingAddress.mobile",
        alternate_mobile: "$shippingAddress.alternate_mobile",
        address: "$shippingAddress.address",
        city: "$shippingAddress.city",
        state: "$shippingAddress.state",
        country: "$shippingAddress.country",
        pincode: "$shippingAddress.pincode"
      },
      totalAmount: 1,
      currency: 1,
      paymentStatus: 1,
      status: 1,
      trackingId: 1,
      carrierPartner: 1,
      cancellationRemark: 1,
      placeOrderDate: 1,
      shippingDate: 1,
      deliveryDate: 1,
      cancellationDate: 1,
      createdAt: 1,
      updatedAt: 1,
      items: {
        $map: {
          input: "$items",
          as: "item",
          in: {
            $mergeObjects: [
              "$$item",
              {
                product: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$product",
                        as: "prod",
                        cond: { $eq: ["$$prod._id", "$$item.productId"] }
                      }
                    },
                    0
                  ]
                }
              }
            ]
          }
        }
      },
      seller: {
        name: "$seller.name",
        email: "$seller.email",
        mobile: "$seller.mobile",
        profile_image: { $ifNull: ["$seller.profile_image", `${process.env.APP_URL}/placeholder/person.png`] }
      },
    }
  });


  const order = await Order.aggregate(aggregation);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res.json(
    new ApiResponse(200, "Order details fetched successfully", order)
  );
});

// const updateOrderStatus = asyncHandler(async (req, res) => {
//   const { orderId, status, paymentStatus, productId } = req.body;
//   const userId = req.user.userId;

//   // ensure order exists for this buyer
//   const existing = await Order.findOne({ orderId, buyerId: userId });
//   if (!existing) {
//     throw new ApiError(404, "Order not found");
//   }

//   const updates = {};
//   if (paymentStatus) {
//     updates.paymentStatus = paymentStatus;
//   }

//   let updatedOrder;

//   if (status && productId) {
//     const result = await Order.updateOne(
//       { orderId, buyerId: userId, "items.productId": productId },
//       { $set: { "items.$.status": status, ...updates } }
//     );

//     if (result.modifiedCount === 0) {
//       throw new ApiError(400, "Product not found in order or no update made");
//     }
//   } else if (status) {
//     await Order.updateMany(
//       { orderId, buyerId: userId },
//       {
//         $set: {
//           "items.$[].status": status,
//           status,   // also update order-level status
//           ...updates
//         }
//       }
//     );
//   } else if (paymentStatus) {
//     await Order.updateMany(
//       { orderId, buyerId: userId },
//       { $set: updates }
//     );
//   }

//   updatedOrder = await Order.find({ orderId, buyerId: userId });

//   return res.json(
//     new ApiResponse(200, "Order status updated successfully", updatedOrder)
//   );
// });



const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const { sortBy = "createdAt", sortOrder = "desc", search, type } = req.query;

  const userId = req.user.userId;
  const role = req.user.role;

  const matchStage = {};

  if (!role.includes("admin")) {
    matchStage.sellerId = userId;
  }

  if (search) {
    matchStage.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { paymentStatus: { $regex: search, $options: "i" } }
    ];
  }

  if (type) {
    matchStage.status = type;
  }

  const pipeline = [
    { $match: matchStage },

    {
      $project: {
        _id: 1,
        orderId: 1,
        createdAt: 1,
        paymentStatus: 1,
        status: 1,
        items: 1,
        totalAmount: 1,
      }
    },
    {
      $addFields: {
        totalProducts: { $size: "$items" }
      }
    },

    { $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } },
    { $skip: skip },
    { $limit: limit }
  ];


  const countPipeline = [
    { $match: matchStage },
    {
      $count: "count"
    }
  ];

  const [orders, totalRes] = await Promise.all([
    Order.aggregate(pipeline),
    Order.aggregate(countPipeline)
  ]);

  const totalCount = totalRes[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return res.json(
    new ApiResponse(
      200,
      orders.length ? "Orders fetched successfully" : "No orders found",
      orders.length
        ? {
          orders,
          total_page: totalPages,
          current_page: page,
          total_records: totalCount,
          per_page: limit
        }
        : null
    )
  );
});


const orderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const matchStage = role.includes("admin")
    ? { orderId }
    : { orderId, "sellerId": userId };

  const pipeline = [
    { $match: matchStage },

    {
      $lookup: {
        from: "users",
        localField: "buyerId",
        foreignField: "userId",
        as: "buyer"
      }
    },
    { $unwind: { path: "$buyer", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "deliveryaddresses",
        localField: "shippingAddressId",
        foreignField: "_id",
        as: "shippingAddress"
      }
    },
    { $unwind: { path: "$shippingAddress", preserveNullAndEmptyArrays: true } },

    ...(role.includes("admin") ? [] : [{ $match: { "sellerId": userId } }]),

    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product"
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "sellerId",
        foreignField: "userId",
        as: "seller"
      }
    },
    { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id: 1,
        orderId: 1,
        createdAt: 1,
        totalAmount: 1,
        paymentStatus: 1,
        status: 1,
        transferGroup: 1,
        buyer: {
          name: "$buyer.name",
          email: "$buyer.email",
          mobile: "$buyer.mobile",
          profile_image: {
            $ifNull: ["$buyer.profile_image", `${process.env.APP_URL}/placeholder/image_place.png`]
          }
        },
        shippingAddress: 1,
        items: {
          $map: {
            input: "$items",
            as: "item",
            in: {
              $mergeObjects: [
                "$$item",
                {
                  product: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$product",
                          as: "prod",
                          cond: { $eq: ["$$prod._id", "$$item.productId"] }
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          }
        },
        seller: {
          name: "$seller.name",
          email: "$seller.email",
          mobile: "$seller.mobile",
          address: "$seller.address",
          profile_image: {
            $ifNull: ["$seller.profile_image", `${process.env.APP_URL}/placeholder/image_place.png`]
          }
        }
      }
    }
  ];

  const [order] = await Order.aggregate(pipeline);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res.json(new ApiResponse(200, "Order fetched successfully", order));
});

const getAllProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const role = req.user.role;

  const { sortBy = "createdAt", sortOrder = "desc", search } = req.query;

  const aggregation = [];

  if (role.includes("admin")) {
    aggregation.push({
      $match: {},
    });
  } else {
    aggregation.push({
      $match: {
        userId: req.user.userId,
      },
    });
  }


  aggregation.push({
    $lookup: {
      from: "marketplacecategories",
      localField: "category_id",
      foreignField: "_id",
      as: "category",
    },
  });

  aggregation.push({
    $unwind: {
      path: "$category",
      preserveNullAndEmptyArrays: true,
    },
  });

  aggregation.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "user",
    },
  });

  aggregation.push({
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true,
    },
  });

  aggregation.push({
    $lookup: {
      from: "marketplacesubcategories",
      localField: "subcategory_id",
      foreignField: "_id",
      as: "subcategory",
    },
  });

  aggregation.push({
    $unwind: {
      path: "$subcategory",
      preserveNullAndEmptyArrays: true,
    },
  });


  if (search) {
    aggregation.push({
      $match: {
        $or: [
          { product_name: { $regex: search, $options: "i" } },
          { product_description: { $regex: search, $options: "i" } },
          { "category.category_name": { $regex: search, $options: "i" } },
          { "subcategory.subcategory_name": { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  aggregation.push({
    $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
  });

  aggregation.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            product_name: 1,
            product_image: 1,
            product_price: 1,
            product_discount: 1,
            product_description: 1,
            product_quantity: 1,
            category_name: "$category.category_name",
            subcategory_name: "$subcategory.subcategory_name",
            user_id: "$user.userId",
            user_name: "$user.name",
            user_email: "$user.email",
            profile_image: "$user.profile_image" || `${process.env.APP_URL}/placeholder/image_place.png`,
            status: 1,
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await Product.aggregate(aggregation);
  const products = result[0].data;
  const totalCount = result[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.json(
    new ApiResponse(200, "Fetched all products successfully", {
      products,
      total_page: totalPages,
      current_page: page,
      total_records: totalCount,
      per_page: limit,
    })
  );
});

const updateProductStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { productId } = req.params;

  const role = req.user.role;
  if (!role.includes("admin")) {
    throw new ApiError(403, "You do not have permission to access this resource");
  }
  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }
  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }
  const product = await Product.findByIdAndUpdate(
    productId,
    { status },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res.json(new ApiResponse(200, "Product status updated successfully", product));


});

const updateOrderDeliveryStatus = asyncHandler(async (req, res) => {
  const { orderId, status, trackingId, carrierPartner, cancellationRemark } = req.body;
  const userId = req.user.userId;

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }
  console.log(orderId);
  console.log("Seller ID:", userId);

  const order = await Order.findOne({ orderId, sellerId: userId });
  if (!order) {
    throw new ApiError(404, "Order not found for this seller");
  }

  if (order.status === "delivered" || order.status === "cancelled") {
    throw new ApiError(400, "Cannot update delivery status , order is already delivered or cancelled");
  }

  const updateFields = {
    status,
    "items.$[].status": status,
  };

  if (status === "shipped") {
    updateFields["trackingId"] = trackingId;
    updateFields["carrierPartner"] = carrierPartner;
    updateFields["shippingDate"] = new Date();
  } else if (status === "cancelled") {
    updateFields["cancellationRemark"] = cancellationRemark;
    updateFields["cancellationDate"] = new Date();
  } else if (status === 'delivered') {
    updateFields["deliveryDate"] = new Date();
  } else if (status === "placed") {
    updateFields["placeOrderDate"] = new Date();
  }

  const updateResult = await Order.updateMany(
    { orderId, sellerId: userId },
    { $set: updateFields },
  );


  const updatedOrder = await Order.findOne({ orderId, "sellerId": userId });

  return res.json(new ApiResponse(200, "Order item status updated successfully", updatedOrder));
});



const testFun = asyncHandler(async (req, res) => {
  // Your test function logic here

  const result = await updateOrderStatus("ORDER_1755581543984YP21UFA4BU9", "paid", "placed", "pi_3Rxi9kQX56NWuV5X2U07B5on", "user-01010", ["68a409eef5502ea313e2893e"]);
  throw new ApiError(400, "Test function error");

});

export {
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
  checkKYCStatus,
  loginExpress,
  // updateOrderStatus,
  getAllOrders,
  getAllCategorires,
  getAllProducts,
  updateProductStatus,
  orderDetails,
  updateOrderDeliveryStatus,
  myOrderDetails,
  testFun
};
