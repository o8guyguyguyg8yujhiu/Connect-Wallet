import express from "express";
import bodyParser from "body-parser";
import { createClient } from "redis";

const app = express();
const port = 5000;

// Настройка Redis
const redisClient = createClient();
redisClient.on("connect", () => {
  console.log("Connected to Redis");
});
redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});
await redisClient.connect();

// Middleware для парсинга JSON
app.use(bodyParser.json());

// Endpoint для сохранения адреса кошелька
app.post("/save-wallet", async (req, res) => {
  const { walletAddress, userId } = req.body;

  if (!walletAddress || !userId) {
    return res.status(400).json({ error: "walletAddress and userId are required" });
  }

  try {
    // Сохраняем адрес кошелька в Redis
    await redisClient.set(`user:${userId}:wallet`, walletAddress);

    // Логируем данные, которые были сохранены
    console.log(`Saved to Redis -> userId: ${userId}, walletAddress: ${walletAddress}`);

    return res.status(200).json({ message: "Wallet address saved successfully" });
  } catch (error) {
    console.error("Error saving wallet address to Redis:", error);
    return res.status(500).json({ error: "Failed to save wallet address" });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
