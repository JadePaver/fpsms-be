import express from "express";
import pool from "../config/conn.js";
import { upload } from "../models/items.js";

import {
  addItem,
  getItems,
  updateItemImage,
  getAllMaterials,
  getAllFurnitures,
  updateItem, 
  removeItem

} from "../models/items.js"; 

const router = express.Router();



router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const itemData = JSON.parse(req.body.item);
    const ingredientsData = JSON.parse(req.body.ingredients);

    const newItem = {
      description: itemData.description,
      stock: itemData.stock,
      price: itemData.price,
      type: itemData.type,
      selectedDate: itemData.selectedDate,
      ingredients: ingredientsData,
    };

    const addItemResult = await addItem(newItem);

    if (addItemResult.success && req.file) {
      const imagePath = req.file.filename;
      await updateItemImage(addItemResult.itemId, imagePath);
      res.status(200).send("Item created successfully with image");
    } else {
      res.status(200).send("Item created successfully without image");
    }
  } catch (error) {
    res.status(500).send("Error creating item: " + error.message);
  }
});

router.post("/update",upload.single("image"), async (req, res) => {
  const itemData = JSON.parse(req.body.item);
    const ingredientsData = JSON.parse(req.body.ingredients);

    const newItem = {
      id:itemData.id,
      description: itemData.description,
      stock: itemData.stock,
      price: itemData.price,
      type: itemData.type,
      selectedDate: itemData.selectedDate,
      ingredients: ingredientsData,
      imagePath: req.file ? req.file.filename : null, 
    };

    const updateItemResult = await updateItem(newItem);
    
    if (updateItemResult.success && newItem.imagePath) {
      await updateItemImage(newItem.id, newItem.imagePath); 
    }

    res.status(200).send("Item updated successfully");

});

router.get("/get_all", async (req, res, next) => {
  try {
    const data = await getItems();
    res.status(200).send(data);
  } catch (error) {
    next(error);
  }
});

router.post("/remove", async (req, res, next) => {
  try {
    const data = req.body;
    console.log("data:",data)

    await removeItem(data);
    res.status(200).send("item removed");
  } catch (error) {
    next(error);
  }
});

router.get("/get_materials", async (req, res, next) => {
  try {
    const data = await getAllMaterials();
    res.status(200).send(data);
  } catch (error) {
    next(error);
  }
});

router.get("/get_furnitures", async (req, res, next) => {
  try {
    const data = await getAllFurnitures();
    res.status(200).send(data);
  } catch (error) {
    next(error);
  }
});

export default router;
