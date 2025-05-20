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
    throw new ApiError(500, "Failed to create Stripe customer", error.message);
  }
};

// Add Card to Customer
const addCardToCustomer = async (customerId, token) => {
  try {
    const source = await stripeClient.customers.createSource(customerId, {
      source: token, // This is a token from frontend via Stripe.js or mobile SDK
    });
    return source;
  } catch (error) {
    console.error("Error adding card to customer:", error);
    throw new ApiError(500, "Failed to add card to customer", error.message);
  }
};

const createConnectAccount = async (email) => {
  try {
    const account = await stripeClient.accounts.create({
      type: "express",
      country: "US",
      email,
    });
    return account;
  } catch (error) {
    console.error("Error creating Stripe connect account:", error);
    throw new ApiError(
      500,
      "Failed to create Stripe connect account",
      error.message
    );
  }
};

const completeKYC = async (accountId) => {
  try {
    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: process.env.REFRESH_URL,
      return_url: process.env.RETURN_URL,
      type: "account_onboarding",
    });
    console.log("Account link created:", accountLink);
    return accountLink;
  } catch (error) {
    console.error("Error creating account link:", error);
    throw new ApiError(500, "Failed to create account link", error.message);
  }
};


const createPaymentIntent = async (customerId, amount, currency = "usd") => {
  try {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amount * 100, // amount in cents
      currency,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new ApiError(500, "Failed to create payment intent", error.message);
  }
};

const transferToConnectedAccount = async (amount, connectedAccountId) => {
  try {
    const transfer = await stripeClient.transfers.create({
      amount: amount * 100,
      currency: "usd",
      destination: connectedAccountId,
    });
    return transfer;
  } catch (error) {
    console.error("Error transferring to connected account:", error);
    throw new ApiError(
      500,
      "Failed to transfer to connected account",
      error.message
    );
  }
};

export {
  createCustomer,
  addCardToCustomer,
  createConnectAccount,
  completeKYC,
  createPaymentIntent,
  transferToConnectedAccount,
};
