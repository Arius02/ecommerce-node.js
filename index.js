import express from "express";
import { bootstrap } from "./src/utils/bootstrap.js";
import { config } from "dotenv";
import cors from "cors";
const app = express();
config();
app.use(cors());

bootstrap(app, express);
