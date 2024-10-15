import dotenv from "dotenv";
import pool from "../config/conn.js";

export async function createUser(data) {
  const { username, password, role } = data;
  const result = await pool.query(
    `INSERT INTO users ( username, password, role) VALUES (?,?,?)`,
    [username, password, role]
  );
  const rows = result[0];
  return rows;
}

export async function editUser(data) {
  const { id, username, password, role } = data;
  
  // Assuming you don't want to update the password if it's not provided
  const query = password 
    ? `UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?`
    : `UPDATE users SET username = ?, role = ? WHERE id = ?`;

  const values = password 
    ? [username, password, role, id]
    : [username, role, id];

  const result = await pool.query(query, values);
  const rows = result[0];
  
  return rows;
}


export async function removeUser(user) {
  const result = await pool.query("DELETE FROM users WHERE id =?", [user.id]);
  return;
}

export async function getUsers() {
  const result = await pool.query("SELECT id,username,role FROM users");
  const rows = result[0];
  return rows;
}

export async function getUser(id) {
  const result = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);
  const rows = result[0];
  return rows;
}
