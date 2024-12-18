import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/conn.js";
import { addDelivery, getEvents } from "../models/delivery.js";

const router = express.Router();

router.post("/add", async (req, res, next) => {
  try {
    const data = req.body;

    await addDelivery(data);
    res.send("send");
  } catch (error) {
    next(error);
  }
});

router.get("/get_all", async (req, res, next) => {
  try {
    const data = await getEvents();
    res.status(200).send(data);
  } catch (error) {
    next(error);
  }
});

export default router;
