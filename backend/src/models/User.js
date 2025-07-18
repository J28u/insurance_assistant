const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, default: "", trim: true },
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
