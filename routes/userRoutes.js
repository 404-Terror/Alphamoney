import express from 'express';
import {
    getChallenge,
    getUserInfo,
    checkIsRegistered,
    registerNewUsers,
    register,
    verifyRegistrationPayload,
    verifyUserAuthentication,
    logoutUser,
    postActionInfo,
    generateOTP,
    verifyOTP,
    getTransaction,
    getBudgetingDetails
} from '../controller/userController.js';
import isAuthenticated from "../middleware/authMiddleware.js"

const userRoutes = express.Router();

// Requesting challenge
userRoutes.get('/getChallenge', getChallenge);

// Checking if user is registered
userRoutes.get('/checkIsRegistered', checkIsRegistered);

// Registering new device for existing user
userRoutes.post('/register', register);

// Registering new user
userRoutes.post('/registernewusers', registerNewUsers);

// generate otp
userRoutes.post('/generate-otp', generateOTP);

//verify otp
userRoutes.post('/verify-otp', verifyOTP);

// Verifying registration payload
userRoutes.post('/verifyRegistration', verifyRegistrationPayload);

// Authenticating user
userRoutes.post('/verifyAuthentication', verifyUserAuthentication);

// Logging out user
userRoutes.post('/logout', logoutUser);

// Get User Info
userRoutes.post('/info', getUserInfo);


//Post Action Info
userRoutes.post('/chat', isAuthenticated, postActionInfo);

userRoutes.get('/transactions', isAuthenticated, getTransaction);

userRoutes.post('/budgeting', isAuthenticated, getBudgetingDetails);


export { userRoutes };
