import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/conn.js";
import { createUser, editUser, getUsers, removeUser } from "../models/users.js";

const router = express.Router();

router.get("/get_all", async (req, res, next) => {
  try {
    const users = await getUsers();
    res.status(200).send(users);
  } catch (error) {
    next(error);
  }
});

router.post("/create", async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    const result = await createUser({
      username: username,
      password: password,
      role: role,
    });

    res.send(result);
  } catch (error) {
    next(error);
  }
});

router.post("/edit", async (req, res, next) => {
  try {
    const { id, username, password, role } = req.body;

    const result = await editUser({
      id: id,
      username: username,
      password: password,
      role: role,
    });

    res.send(result);
  } catch (error) {
    next(error);
  }
});

router.post("/remove", async (req, res, next) => {
  try {
    const { user } = req.body;

    const result = await removeUser(user);

    res.send(result);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const [user] = await pool.query(`SELECT * FROM users WHERE username = ?`, [
      username,
    ]);

    if (user.length === 0) {
      return res.status(404).json({ error: "User does not exist" });
    }

    const dbpass = user[0].password;

    if (dbpass !== password) {
      return res.status(401).json({ error: "Incorrect Credentials" });
    }

    const refreshToken = jwt.sign({ user }, process.env.TOKEN_SECRET, {
      expiresIn: "1d",
    });

    delete user[0].password;

    res.status(200).json({ token: refreshToken, user: user[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
