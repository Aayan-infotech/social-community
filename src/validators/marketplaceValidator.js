import joi from "joi";

const upsertCategorySchema = joi.object({
  id: joi.string().allow("").messages({
    "string.empty": "ID is required",
    "any.required": "ID is required",
  }),
  category_name: joi.string().required().messages({
    "string.empty": "Category name is required",
    "any.required": "Category name is required",
  }),
  category_image: joi.string().allow("").messages({
    "string.empty": "Category image is required",
    "any.required": "Category image is required",
  }),
});

const upsertSubcategorySchema = joi.object({
  id: joi.string().allow("").messages({
    "string.empty": "ID is required",
    "any.required": "ID is required",
  }),
  category_id: joi.string().required().messages({
    "string.empty": "Category ID is required",
    "any.required": "Category ID is required",
  }),
  subcategory_name: joi.string().required().messages({
    "string.empty": "Subcategory name is required",
    "any.required": "Subcategory name is required",
  }),
  subcategory_image: joi.string().allow("").messages({
    "string.empty": "Subcategory image is required",
    "any.required": "Subcategory image is required",
  }),
});

const addProductSchema = joi.object({
  product_name: joi.string().required().messages({
    "string.empty": "Product name is required",
    "any.required": "Product name is required",
  }),
  category_id: joi.string().required().messages({
    "string.empty": "Category ID is required",
    "any.required": "Category ID is required",
  }),
  subcategory_id: joi.string().required().messages({
    "string.empty": "Subcategory ID is required",
    "any.required": "Subcategory ID is required",
  }),
  product_discount: joi.number().min(0).max(100).required().messages({
    "number.base": "Product discount must be a number",
    "number.min": "Product discount must be at least 0",
    "number.max": "Product discount must be at most 100",
    "any.required": "Product discount is required",
  }),
  product_price: joi.number().min(0).required().messages({
    "number.base": "Product price must be a number",
    "number.min": "Product price must be at least 0",
    "any.required": "Product price is required",
  }),
  product_quantity: joi.string().required().messages({
    "string.empty": "Product quantity is required",
    "any.required": "Product quantity is required",
  }),
  product_image: joi.string().allow("").messages({
    "string.empty": "Product image is required",
    "any.required": "Product image is required",
  }),
  product_description: joi.string().required().messages({
    "string.empty": "Product description is required",
    "any.required": "Product description is required",
  }),
});

const updateProductSchema = joi.object({
  id: joi.string().required().messages({
    "string.empty": "Product ID is required",
    "any.required": "Product ID is required",
  }),
  product_name: joi.string().required().messages({
    "string.empty": "Product name is required",
    "any.required": "Product name is required",
  }),
  category_id: joi.string().required().messages({
    "string.empty": "Category ID is required",
    "any.required": "Category ID is required",
  }),
  subcategory_id: joi.string().required().messages({
    "string.empty": "Subcategory ID is required",
    "any.required": "Subcategory ID is required",
  }),
  product_discount: joi.number().min(0).max(100).required().messages({
    "number.base": "Product discount must be a number",
    "number.min": "Product discount must be at least 0",
    "number.max": "Product discount must be at most 100",
    "any.required": "Product discount is required",
  }),
  product_price: joi.number().min(0).required().messages({
    "number.base": "Product price must be a number",
    "number.min": "Product price must be at least 0",
    "any.required": "Product price is required",
  }),
  product_quantity: joi.string().required().messages({
    "string.empty": "Product quantity is required",
    "any.required": "Product quantity is required",
  }),
  product_image: joi.string().allow("").messages({
    "string.empty": "Product image is required",
    "any.required": "Product image is required",
  }),
  product_description: joi.string().allow("").messages({
    "string.empty": "Product description is required",
    "any.required": "Product description is required",
  }),
  remove_images: joi.string().allow("").messages({
    "string.empty": "Remove images is required",
    "any.required": "Remove images is required",
  }),
});

const addAddressSchema = joi.object({
  name: joi.string().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),
  mobile: joi.string().required().messages({
    "string.empty": "Mobile number is required",
    "any.required": "Mobile number is required",
  }),
  alternate_mobile: joi.string().allow("").messages({
    "string.empty": "Alternate mobile number is required",
    "any.required": "Alternate mobile number is required",
  }),
  address: joi.string().required().messages({
    "string.empty": "Address is required",
    "any.required": "Address is required",
  }),
  city: joi.string().required().messages({
    "string.empty": "City is required",
    "any.required": "City is required",
  }),
  state: joi.string().required().messages({
    "string.empty": "State is required",
    "any.required": "State is required",
  }),
  country: joi.string().required().messages({
    "string.empty": "Country is required",
    "any.required": "Country is required",
  }),
  pincode: joi.string().required().messages({
    "string.empty": "Pincode is required",
    "any.required": "Pincode is required",
  }),
});

const updateAddressSchema = joi.object({
  id: joi.string().required().messages({
    "string.empty": "Address ID is required",
    "any.required": "Address ID is required",
  }),
  name: joi.string().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),
  mobile: joi.string().required().messages({
    "string.empty": "Mobile number is required",
    "any.required": "Mobile number is required",
  }),
  alternate_mobile: joi.string().allow("").messages({
    "string.empty": "Alternate mobile number is required",
    "any.required": "Alternate mobile number is required",
  }),
  address: joi.string().required().messages({
    "string.empty": "Address is required",
    "any.required": "Address is required",
  }),
  city: joi.string().required().messages({
    "string.empty": "City is required",
    "any.required": "City is required",
  }),
  state: joi.string().required().messages({
    "string.empty": "State is required",
    "any.required": "State is required",
  }),
  country: joi.string().required().messages({
    "string.empty": "Country is required",
    "any.required": "Country is required",
  }),
  pincode: joi.string().required().messages({
    "string.empty": "Pincode is required",
    "any.required": "Pincode is required",
  }),
});

const addToCartSchema = joi.object({
  productId: joi.string().required().messages({
    "string.empty": "Product ID is required",
    "any.required": "Product ID is required",
  }),
  quantity: joi.number().min(1).required().messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
});

const orderPlaceSchema = joi.object({
  address_id: joi.string().required().messages({
    "string.empty": "Address ID is required",
    "any.required": "Address ID is required",
  }),
  product_ids: joi.array().required().messages({
    "array.empty": "Product IDs are required",
    "any.required": "Product IDs are required",
  }),
  order_amount: joi.number().required().messages({
    "number.base": "Order amount must be a number",
    "any.required": "Order amount is required",
  }),
  quantity: joi.array().required().messages({
    "array.empty": "Quantity is required",
    "any.required": "Quantity is required",
  }),
});

const updateOrderStatusSchema = joi.object({
  orderId: joi.string().required().messages({
    "string.empty": "Order ID is required",
    "any.required": "Order ID is required",
  }),
  status: joi.string().valid("placed","shipped","completed", "cancelled").required().messages({
    "string.empty": "Status is required",
    "any.required": "Status is required",
    "any.only": "Status must be one of 'placed', 'shipped', 'completed', or 'cancelled'",
  }),
  paymentStatus: joi.string().valid("pending", "paid", "failed").required().messages({
    "string.empty": "Payment status is required",
    "any.required": "Payment status is required",
    "any.only": "Payment status must be one of 'pending', 'paid', or 'failed'",
  }),
});

export {
  upsertCategorySchema,
  upsertSubcategorySchema,
  addProductSchema,
  updateProductSchema,
  addAddressSchema,
  updateAddressSchema,
  addToCartSchema,
  orderPlaceSchema,
  updateOrderStatusSchema
};
