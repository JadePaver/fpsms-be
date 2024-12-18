import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import os from "os";
import userRoutes from "./routes/user_routes.js";
import itemRoutes from "./routes/items_routes.js";
import poRoutes from "./routes/purchase_order_routes.js";
import deliveryRoutes from "./routes/delivery_routes.js";

dotenv.config();

const app = express();

const networkInterfaces = os.networkInterfaces();
let localIp = null;

const exam = {
  exam_id: 99,
  questions: [
    {
      id: 23,
      label: "What is 1+1?",
      type: "multiple",
      correct_answer_id: 4,
      points:6,
      choices: [
        { id: 1, label: "1" },
        { id: 2, label: "4" },
        { id: 3, label: "3" },
        { id: 4, label: "2" },
      ],
    },
    {
      id: 24,
      label: "What is 2+2?",
      type: "multiple",
      correct_answer_id: 2,
      points:6,
      choices: [
        { id: 1, label: "1" },
        { id: 2, label: "4" },
        { id: 3, label: "3" },
        { id: 4, label: "2" },
      ],
    },
    {
      id: 25,
      label: "What is the next alphabet after b?",
      type: "fill_in",
      fill_in_ans: "c",
      points:6,
    },
    {
      id: 26,
      label: "Write 5 sentence paragraph about apples",
      type: "essay",
      points:10,
    },
  ],
};

for (const interfaceKey in networkInterfaces) {
  for (const network of networkInterfaces[interfaceKey]) {
    if (network.family === "IPv4" && !network.internal) {
      localIp = network.address;
      break;
    }
  }
}

console.log("IPADDRESS:", localIp);

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

app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});
