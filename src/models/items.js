import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import pool from "../config/conn.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../fpsme-fe/public/item_images/"); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  },
});

export const upload = multer({ storage: storage });

export async function addItem(data) {
  const { description, stock, price, type, selectedDate, ingredients } = data;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const result = await connection.query(
      `INSERT INTO items (description, stock, price, type, batch_date) VALUES (?, ?, ?, ?, ?)`,
      [description, stock, price, type, selectedDate]
    );

    const newItemId = result[0].insertId;

    if (type === "Furniture") {
      for (const item of ingredients) {
        await connection.query(
          `INSERT INTO material_cost (product_item_id, material_item_id, quantity) VALUES (?, ?, ?)`,
          [newItemId, item.material.id, item.quantity]
        );

        const deductedStock = item.material.stock - item.quantity * stock;
        await connection.query(`UPDATE items SET stock = ? WHERE id = ?`, [
          deductedStock,
          item.material.id,
        ]);
      }
    }

    await connection.commit();
    return { success: true, itemId: newItemId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateItem(data) {
  const { id, description, stock, price, type, selectedDate, ingredients, imagePath } = data;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [previousItem] = await connection.query(`SELECT stock FROM items WHERE id = ?`, [id]);
    const previousStock = previousItem[0].stock;

    const updateQuery = `
      UPDATE items 
      SET description = ?, stock = ?, price = ?, type = ?, batch_date = ?
      ${imagePath ? ", image = ?" : ""}
      WHERE id = ?`;

    const params = [
      description,
      stock,
      price,
      type,
      selectedDate,
      ...(imagePath ? [imagePath] : []), 
      id,
    ];

    await connection.query(updateQuery, params);

    if (type === "Furniture") {
      const stockDifference = stock - previousStock;

      await connection.query(
        `DELETE FROM material_cost WHERE product_item_id = ?`,
        [id]
      );

      for (const item of ingredients) {

        await connection.query(
          `INSERT INTO material_cost (product_item_id, material_item_id, quantity) VALUES (?, ?, ?)`,
          [id, item.material.id, item.quantity]
        );

        const deductedStock = item.material.stock - (item.quantity * stockDifference);
        await connection.query(`UPDATE items SET stock = ? WHERE id = ?`, [
          deductedStock,
          item.material.id,
        ]);
      }
    }

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    return { success: false, error };
  } finally {
    connection.release();
  }
}



export async function saveItemImage(req, res, next) {
  const uploadSingle = upload.single("image");

  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: "Error uploading image" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    next();
  });
}

export async function updateItemImage(itemId, imagePath) {
  const connection = await pool.getConnection();
  try {
    const result = await connection.query(
      `UPDATE items SET image = ? WHERE id = ?`,
      [imagePath, itemId]
    );
    return result;
  } catch (error) {
    console.error("Error updating item image:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getItems() {
  const query = `
    SELECT i.*, mc.material_item_id, mc.quantity, m.description AS material_description, m.stock AS material_stock
    FROM items i
    LEFT JOIN material_cost mc ON i.id = mc.product_item_id
    LEFT JOIN items m ON mc.material_item_id = m.id
    WHERE i.is_remove=0
  `;

  try {
    const [rows] = await pool.query(query);

    const itemsWithMaterials = rows.reduce((acc, row) => {
      const existingItem = acc.find(item => item.id === row.id);

      if (existingItem) {
        existingItem.ingredients.push({
          material_item_id: row.material_item_id,
          material_description: row.material_description,
          quantity: row.quantity,
          material_stock: row.material_stock
        });
      } else {
        acc.push({
          ...row,
          ingredients: row.material_item_id ? [{
            material_item_id: row.material_item_id,
            material_description: row.material_description,
            quantity: row.quantity,
            material_stock: row.material_stock
          }] : []
        });
      }

      return acc;
    }, []);

    return itemsWithMaterials;
  } catch (error) {
    console.error("Error fetching items:", error);
    throw error;
  }
}

export async function getAllMaterials() {
  const result = await pool.query("SELECT * FROM items WHERE type ='Material'");
  const rows = result[0];
  return rows;
}

export async function removeItem(item) {
   await pool.query("UPDATE items SET is_remove=? WHERE id=?",[1,item.id]);
  return;
}

export async function getAllFurnitures() {
  const result = await pool.query("SELECT * FROM items WHERE type ='Furniture'");
  const rows = result[0];
  return rows;
}

export async function getItem(id) {
  const result = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);
  const rows = result[0];
  return rows;
}
