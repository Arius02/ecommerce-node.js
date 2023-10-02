import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.DATA_BASE_URL;

export const connectionDB = async () => {
  return await mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log("Connected to MongoDB successfully!");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });
};
