import stripe from "stripe";

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

const createCustomer = async (email, name) => {
  try {
    const customer = await stripeClient.customers.create({
      email,
      name,
    });
    return customer;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw new Error("Failed to create Stripe customer");
  }
};

// Add Card to Customer
const addCardToCustomer = async (customerId) => {
  try {
    const customerSource =
      await stripeClient.customers.createSource(customerId);
  } catch (error) {
    console.error("Error adding card to customer:", error);
    throw new Error("Failed to add card to customer");
  }
};

// const getAllCustomersList = async () =>{
//     try {
//         const customers = await stripeClient.customers.list();
//         return customers;
//     } catch (error) {
//         console.error("Error fetching customers:", error);
//         throw new Error("Failed to fetch customers");
//     }
// }

export { createCustomer, addCardToCustomer };
