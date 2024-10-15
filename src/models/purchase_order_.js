import pool from "../config/conn.js";
import moment from "moment";

export async function submitsale(data) {
  const { customer, receipt, invoice, item_list } = data;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingCustomer] = await connection.query(
      "SELECT id FROM customers WHERE fullname = ?",
      [customer]
    );

    let customerID;
    let currentReceiptID;

    if (existingCustomer.length > 0) {
      customerID = existingCustomer[0].id;
    } else {
      const [insertResult] = await connection.query(
        "INSERT INTO customers (fullname) VALUES (?)",
        [customer]
      );
      customerID = insertResult.insertId;
    }

    const totalAmount = item_list.reduce(
      (acc, current) => acc + current.price * current.quantity,
      0
    );

    const today = moment();
    const dataToday = today.format("YYYY-MM-DD");
    let new_PO;
    if (receipt) {
      await connection.query(
        "UPDATE purchase_order SET costumer_id = ?, invoice_id = ?, status = ?, total_amount = ?, date_of_purchased = ? WHERE receipt = ?",
        [
          customerID,
          invoice,
          "Completely Paid",
          totalAmount,
          dataToday,
          receipt,
        ]
      );

      const [result] = await connection.query(
        "SELECT id FROM purchase_order WHERE receipt = ?",
        [receipt]
      );
      currentReceiptID = result[0]?.id;
    } else {
      new_PO = await getNew_po();

      const [insertResult] = await connection.query(
        "INSERT INTO purchase_order (receipt, costumer_id, invoice_id, status, total_amount, date_of_purchased) VALUES (?,?,?,?,?,?)",
        [new_PO, customerID, invoice, "Completely Paid", totalAmount, dataToday]
      );

      currentReceiptID = insertResult.insertId;
    }

    await connection.query("DELETE FROM purchased_furnitures WHERE po_id = ?", [
      currentReceiptID,
    ]);

    for (const item of item_list) {
      await connection.query(
        "INSERT INTO purchased_furnitures (po_id, item_id, quantity, price) VALUES (?,?,?,?)",
        [currentReceiptID, item.item_id, item.quantity, item.price]
      );
      const deductedQuantity = item.stock - item.quantity;
      await connection.query("UPDATE items SET stock = ? WHERE id=?", [
        deductedQuantity,
        item.item_id,
      ]);
    }

    await connection.commit();

    return new_PO;
  } catch (error) {
    await connection.rollback();
    console.error("Error adding sales:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function reserve_po(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const last_receipt = await getNew_po();

    const totalAmount = data.reduce(
      (acc, current) => acc + current.price * current.quantity,
      0
    );
    const today = new Date().toISOString();

    const [insertResult] = await connection.query(
      "INSERT INTO purchase_order (receipt, status, total_amount, date_of_purchased) VALUES (?, ?, ?, ?)",
      [`${last_receipt}`, "Awaiting Payment", totalAmount, today]
    );
    const insertID = insertResult.insertId;

    for (const item of data) {
      await connection.query(
        "INSERT INTO purchased_furnitures (po_id, item_id, quantity, price, purchased_date) VALUES (?, ?, ?, ?, ?)",
        [insertID, item.id, item.quantity, item.price, today]
      );
    }

    await connection.commit();

    return last_receipt;
  } catch (error) {
    await connection.rollback();
    console.error("Error adding receipt:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getNew_po() {
  const [rows] = await pool.query(
    "SELECT MAX(id) AS lastId FROM purchase_order"
  );

  const lastId = rows[0].lastId || 0;

  const newId = lastId + 1;

  const today = moment();
  const monthDay = today.format("MM-DD");

  const receiptNumber = `FPSMS${monthDay}${String(1000000 + newId).padStart(
    7,
    "0"
  )}`;

  return receiptNumber;
}

export async function getAllPO() {
  const query = `
  SELECT 
    po.*, 
    pf.item_id,    -- Explicitly select pf.item_id
    pf.quantity, 
    pf.price AS item_price, 
    i.description AS item_description, 
    i.stock AS item_stock, 
    i.image AS item_image,
    c.fullname AS costumer_name 
  FROM 
    purchase_order po
  LEFT JOIN 
    purchased_furnitures pf ON po.id = pf.po_id
  LEFT JOIN 
    items i ON pf.item_id = i.id
  LEFT JOIN
    customers c ON po.costumer_id = c.id 
  ORDER BY 
  po.date_of_purchased ASC; -- Sort by date_of_purchased in ascending order
`;

  const [rows] = await pool.query(query);

  const purchaseOrders = rows.reduce((acc, row) => {
    let existingPO = acc.find((po) => po.id === row.id);

    if (!existingPO) {
      existingPO = {
        id: row.id,
        receipt: row.receipt,
        status: row.status,
        total_amount: row.total_amount,
        customer_name: row.costumer_name,
        date_of_purchased: row.date_of_purchased,
        itemlist: [],
      };
      acc.push(existingPO);
    }

    if (row.item_id) {
      existingPO.itemlist.push({
        item_id: row.item_id, // Use row.item_id instead of row.id
        quantity: row.quantity,
        price: row.item_price,
        description: row.item_description,
        stock: row.item_stock,
        image: row.item_image,
      });
    }

    return acc;
  }, []);

  return purchaseOrders;
}
