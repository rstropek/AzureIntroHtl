import dotenv from "dotenv";
dotenv.config();

import { addTelemetry } from "./telemetry.js";
addTelemetry();

import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());

import Database from "./sql.js";
const db = new Database();

import KeyVault from "./keyvault.js";
const keyVault = new KeyVault();

import demoRouter from "./demoApi.js";
import cartApi from "./cartApi.js";
import openaiApi from "./openaiApi.js";
app.use("/", demoRouter);
app.use("/", cartApi(db));
app.use("/", openaiApi(db, keyVault));

const port = parseInt(process.env.PORT || "8080");
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
