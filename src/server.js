import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import userRoutes from "./routes/user_routes.js";
import itemRoutes from "./routes/items_routes.js"
import poRoutes from "./routes/purchase_order_routes.js"
import deliveryRoutes from "./routes/delivery_routes.js"

dotenv.config();

const app = express();

app.use(
  cors({
    credentials: true,
  })
);
app.use(bodyParser.json());

// app.get("/", (req, res) => {
//   res.json({ message: "Welcome to the FPSMS Backend!" });
// });

app.use("/users", userRoutes);
app.use("/items", itemRoutes);
app.use("/po", poRoutes);
app.use("/delivery", deliveryRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});
