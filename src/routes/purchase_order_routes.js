import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/conn.js";

import { reserve_po, getAllPO, submitsale } from "../models/purchase_order_.js";

const router = express.Router();

router.post("/submit_sale", async (req, res, next) => {
  try {
    const data = req.body;

    const result = await submitsale(data)
    res.status(200).send(result);

  } catch (error) {
    next(error);
  }
});

router.post("/checkout", async (req, res, next) => {
  try {
    const data = req.body;

    const reciept = await reserve_po(data);
    res.status(200).send(reciept);
  } catch (error) {
    next(error);
  }
});

router.get("/get_all", async (req, res, next) => {
  try {
    const data = await getAllPO();
    res.status(200).send(data);
  } catch (error) {
    next(error);
  }
});

export default router;
