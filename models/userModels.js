import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    username: { type: "String", required: true, unique: true },
    name: { type: "String", required: true },
    email: { type: "String", required: true, unique: true },
    pic: {
      type: "String",
      required: true,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    Investments: {
      type: Number,
      default: 0,
    },
    Savings: {
      type: Number,
      default: 0,
    },
    Income: {
      type: Number,
      default: 0,
    },
    Expenses: {
      type: Number,
      default: 0,
    },
    verifyRegistrationData: { type: mongoose.Schema.Types.Mixed },
    credentialKeys: [{ type: String }],
  },
  { timestaps: true }
);
const transactionSchema = mongoose.Schema(
  {
    type: { type: "String", required: true },
    amount: { type: "Number", required: true },
    date: { type: "Date", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    statement: { type: "String", required: true }
  },
  { timestaps: true }
);
const Transaction = mongoose.model("Transaction", transactionSchema);

const User = mongoose.model("User", userSchema);

export default User;
export { Transaction };
