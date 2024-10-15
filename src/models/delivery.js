import dotenv from "dotenv";
import pool from "../config/conn.js";

export async function addDelivery(data) {
    const {delivery,recieve_item,remarks,date} =data;
      
    await pool.query(`INSERT INTO delivery_events (delivery_name, expected_item, remarks, date_of_delivery) VALUES (?, ?, ?, ? )`,[delivery,recieve_item,remarks,date])

    return
}

export async function getEvents() {
    const result = await pool.query("SELECT * FROM delivery_events");
    const rows = result[0];
    return rows;
}