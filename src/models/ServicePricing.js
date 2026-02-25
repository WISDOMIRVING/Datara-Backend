import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
  serviceType: String,
  provider: String,
  buyPrice: Number,
  sellPrice: Number,
  active: { type: Boolean, default: true }
});

export default mongoose.model("ServicePricing", pricingSchema);


