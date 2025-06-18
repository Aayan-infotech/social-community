import stripe from "stripe";
import { loadConfig } from "../config/loadConfig.js";
import { ApiError } from "../utils/ApiError.js";

const secret = await loadConfig();

const stripeClient = stripe(secret.STRIPE_SECRET_KEY);

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
      refresh_url: "http://18.209.91.97:3030/api/marketplace/refresh-url" + "?id=" + accountId,
      return_url: "http://18.209.91.97:3030/api/marketplace/kyc-status" + "?id=" + accountId,
      type: "account_onboarding",
    });

    return accountLink;
  } catch (error) {
    console.error("Error creating account link:", error);
    throw new Error(500, "Failed to create account link", error.message);
  }
};

const handleKYCStatus = async (accountId) => {
  try {
    const account = await stripeClient.accounts.retrieve(accountId);
    return account.capabilities.transfers;
  } catch (error) {
    console.error("Error retrieving account KYC status:", error);
    throw new ApiError(500, "Failed to retrieve KYC status", error.message);
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

const paymentMethod = async (customerId) => {
  try {
    const paymentMethods = await stripeClient.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    return paymentMethods;
  } catch (error) {
    console.error("Error retrieving payment methods:", error);
    throw new ApiError(
      500,
      "Failed to retrieve payment methods",
      error.message
    );
  }
};

const paymentSheet = async (customerId, amount, currency, AccountId) => {
  try {
    const ephemeralKey = await stripeClient.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: "2020-08-27" }
    );

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amount * 100,
      currency: currency,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: 123,
      transfer_data: {
        destination: AccountId,
      },
    });

    return {
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
      publishableKey: secret.STRIPE_PUBLIC_KEY,
    };
  } catch (error) {
    console.error("Error creating payment sheet:", error);
    throw new ApiError(500, "Please Complete the KYC First", error.message);
  }
};

const confirmPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripeClient.paymentIntents.confirm(
      paymentIntentId,
      {
        payment_method: "pm_card_visa",
        return_url: secret.RETURN_URL,
      }
    );
    return paymentIntent;
  } catch (error) {
    console.error("Error confirming payment:", error);
  }
};

// Add Card to Customer
const addCardToCustomer = async (customerId, token) => {
  try {
    const source = await stripeClient.customers.createSource(customerId, {
      source: token,
    });
    return source;
  } catch (error) {
    console.error("Error adding card to customer:", error);
    throw new ApiError(500, "Failed to add card to customer", error.message);
  }
};

const createCardToken = async (cardNumber, expMonth, expYear, cvc) => {
  try {
    const token = await stripeClient.tokens.create({
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc,
      },
    });
    return token;
  } catch (error) {
    console.error("Error creating card token:", error);
    throw new Error("Failed to create card token");
  }
};

const getCardList = async (customerId) => {
  try {
    const cards = await stripeClient.customers.listSources(customerId, {
      object: "card",
    });
    return cards;
  } catch (error) {
    console.error("Error retrieving card list:", error);
    throw new ApiError(500, "Failed to retrieve card list", error.message);
  }
};


const createLoginLink = async (accountId) => {
  try {
    const loginLink = await stripeClient.accounts.createLoginLink(accountId);
    return loginLink;
  } catch (error) {
    console.error("Error creating login link:", error);
    throw new ApiError(500, "Failed to create login link", error.message);
  }
};


export {
  createCustomer,
  addCardToCustomer,
  createConnectAccount,
  completeKYC,
  createPaymentIntent,
  transferToConnectedAccount,
  createCardToken,
  getCardList,
  paymentMethod,
  paymentSheet,
  confirmPayment,
  handleKYCStatus,
  createLoginLink
};
