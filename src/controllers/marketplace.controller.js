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

const upsertCategory = asyncHandler(async (req, res) => {
  const { id, category_name } = req.body;
  const userId = req.user.userId;

  let category_image = "";
  if (req.files && req.files.category_image) {
    const businessCategory = await BusinessCategory.findById(id);
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

const upsertSubcategory = asyncHandler(async (req, res) => {
  const { id, category_id, subcategory_name } = req.body;
  const userId = req.user.userId;

  if (!isValidObjectId(category_id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  let subcategory_image = "";
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

  if (!isValidObjectId(category_id)) {
    throw new ApiError(400, "Invalid category ID");
  }
  if (!isValidObjectId(subcategory_id)) {
    throw new ApiError(400, "Invalid subcategory ID");
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
    },
  });

  const productList = await Product.aggregate(aggregation);
  if (!productList) {
    throw new ApiError(404, "No product found");
  }
  res.json(
    new ApiResponse(200, "Product list fetched successfully", productList)
  );
});

const getProductDetails = asyncHandler(async (req,res) =>{
  const {product_id} = req.params;

  if (!isValidObjectId(product_id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(product_id).populate("category_id").populate("subcategory_id");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json(
    new ApiResponse(200, "Product details fetched successfully", product)
  );
});

const removeProduct = asyncHandler(async (req,res) =>{
  const {product_id} = req.params;

  if (!isValidObjectId(product_id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findByIdAndDelete(product_id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json(
    new ApiResponse(200, "Product deleted successfully")
  );
});


// Delivery Address Management
const addAddress = asyncHandler(async (req,res) =>{
  const { name , mobile , alternate_mobile , pincode, city, state ,country , address } = req.body;
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
    userId
  };

  const newAddress = await DeliveryAddress.create(addressData);
  if (!newAddress) {
    throw new ApiError(500, "Failed to add address");
  }

  res.json(
    new ApiResponse(200, "Address added successfully", newAddress)
  );
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
};
