const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    domain: {
  type: String,
  unique: true,
  sparse: true,   // ⭐ VERY IMPORTANT
  lowercase: true,
  trim: true,
},
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;