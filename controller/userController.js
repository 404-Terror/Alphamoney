import asyncHandler from "express-async-handler";
import User, { Transaction } from "../models/userModels.js";
import { server } from "@passwordless-id/webauthn";
import nodemailer from "nodemailer";
import { Configuration, OpenAIApi } from "openai";

const postActionInfo = asyncHandler(async (req, res) => {
  const body = req?.body?.action; // action passed from frontend
  const username = req?.body?.username; //username passed from frontend
  if (body) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    });
    const openai = new OpenAIApi(configuration);
    try {
      // console.log(configuration)
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `The following is an action. Return both the category the action falls into among categories of [Investments, Savings, Income, Expenses] and the money:${body}\n\nCategory: \nMoney:`,
        temperature: 0,
        max_tokens: 64,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });
      // console.log(response.data.choices[0].text);
      const remain = response.data.choices[0].text.split("\n")[1];
      const category = remain.split(", ")[0];
      const money = remain.split("$")[1];

      const user = await User.findOneAndUpdate(
        { credentialKeys: username },
        { $inc: { [category]: money } },
        { new: true }
      );

      if (user) {
        await Transaction.create({
          type: category,
          amount: money,
          date: new Date(),
          user: user._id,
          statement: body
        });
        return res.status(200).json({ category, money });
      }
      return res.status(500).json({ message: "User not found" });
    } catch (e) {
      console.log(e);
    }
  }
  return res.json("No action provided");
});

let challenge = "a7c61ef9-dc23-4806-b486-2428938a547e";

// Requesting challenge
const getChallenge = (req, res) => {
  res.json({ challenge });
};

const getTransaction = asyncHandler(async (req, res) => {
  const user = req.query.user; // Get the user ID from the query parameter
  try {
    const transactions = await Transaction.find().limit(10);
    // console.log(transactions)
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const getBudgetingDetails = asyncHandler(async (req, res) => {
  const { credentialId } = req.body;
  try {
    const user = await User.findOne({ credentialKeys: credentialId });
    const transactions = await Transaction.find({type: "Expenses", user:user._id});
    const rent = transactions.filter((transaction) => transaction.statement.includes("rent")).reduce((a, b) => a + b.amount, 0);
    const shopping = transactions.filter((transaction) => transaction.statement.includes("shopping")).reduce((a, b) => a + b.amount, 0);
    const food = transactions.filter((transaction) => transaction.statement.includes("food")).reduce((a, b) => a + b.amount, 0);
    const miscellaneous = transactions.filter((transaction) => transaction.statement.includes("miscellaneous")).reduce((a, b) => a + b.amount, 0);
    const emi = transactions.filter((transaction) => transaction.statement.includes("emi")).reduce((a, b) => a + b.amount, 0);
    // console.log(transactions)
    res.json({rent, shopping, food, miscellaneous, emi, user});
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Checking if user is registered
const checkIsRegistered = asyncHandler(async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    res.json({ isRegistered: !!user });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Get User info
const getUserInfo = asyncHandler(async (req, res) => {
  const { credentialId } = req.body;

  try {
    const user = await User.findOne({ credentialKeys: credentialId });
    if (user) {
      res.status(200).json({ user });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// Generate OTP
function generateOTPcode() {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return "658712";
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  try {
    // Create a transporter using your email service provider credentials
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "rishitashaw00@gmail.com",
        pass: "Harvard123",
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Rishita Shaw" <rishitashaw00@gmail.com>', // Replace with your email address
      to: email,
      subject: "OTP Verification",
      text: `Your OTP: ${otp}`,
      html: `<p>Your OTP: <strong>${otp}</strong></p>`,
    });
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
  }
}

//verify email otp
const verifyOTP = asyncHandler(async (req, res) => {
  const { username, otp } = req.body;
  const storedOTP = req.session.otp;

  if (storedOTP && storedOTP === otp) {
    // OTP is correct
    req.session.otp = null; // Clear the OTP from session after successful verification

    // Perform additional actions here (e.g., update user data, grant access, etc.)
    res.json({ success: true, message: "OTP verification successful" });
  } else {
    // OTP is incorrect
    res.status(401).json({ success: false, message: "Invalid OTP" });
  }
});

//generate otp
const generateOTP = asyncHandler(async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user) {
      const otp = generateOTPcode();

      // Store the OTP in the session
      req.session.otp = otp;

      // Send OTP email
      sendOTPEmail(user.email, otp);

      res.json({ message: "OTP generated and email sent successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Failed to generate OTP:", error);
    res.status(500).json({ message: "Failed to generate OTP" });
  }
});

// Registering new device for an existing user
const register = asyncHandler(async (req, res) => {
  const { username, verifyRegistrationData, otp } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { username },
      {
        $set: { verifyRegistrationData },
        $push: { credentialKeys: verifyRegistrationData.credential.id },
      },
      { new: true }
    );

    if (user) {
      req.session.isAuthenticated = true;
      res.redirect("/user");
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Verifying registration payload
const verifyRegistrationPayload = asyncHandler(async (req, res) => {
  const { registration } = req.body;

  try {
    const registrationData = await server.verifyRegistration(registration, {
      challenge,
      origin: "http://localhost:5000",
      // origin: "http://localhost:5000"
    });
    res.json(registrationData);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

const verifyUserAuthentication = asyncHandler(async (req, res) => {
  const { authentication } = req.body;

  try {
    const user = await User.findOne({
      credentialKeys: authentication.credentialId,
    });

    if (user) {
      const credential = user.verifyRegistrationData.credential;
      const expected = {
        challenge: challenge,
        origin: "http://localhost:5000",
        // origin: "http://localhost:5000",
        userVerified: true,
        counter: 0,
      };

      await server.verifyAuthentication(authentication, credential, expected);
      req.session.isAuthenticated = true;
      res.redirect("/user");
    } else {
      res.status(401).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Register new users
const registerNewUsers = asyncHandler(async (req, res) => {
  const { username, email, verifyRegistrationData, name } = req.body;

  try {
    const userExist = await User.findOne({ email });
    const usernameExist = await User.findOne({ username });

    if (userExist) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (usernameExist) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = new User({
      username,
      email,
      verifyRegistrationData,
      name,
      credentialKeys: [verifyRegistrationData.credential.id],
    });

    await user.save();
    req.session.isAuthenticated = true;
    res.redirect("/user");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logging out user
const logoutUser = asyncHandler(async (req, res) => {
  req.session = null;
  res.redirect("/");
});

export {
  getChallenge,
  checkIsRegistered,
  getUserInfo,
  generateOTP,
  verifyOTP,
  register,
  verifyRegistrationPayload,
  verifyUserAuthentication,
  registerNewUsers,
  logoutUser,
  postActionInfo,
  getTransaction,
  getBudgetingDetails
};
