from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from fastapi import FastAPI, Request
import redis
import uvicorn

# Настройки
TELEGRAM_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REACT_URL = "https://your-react-app-url.ngrok-free.app"

# Инициализация Redis
redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# Инициализация FastAPI
app = FastAPI()

# FastAPI для получения данных от React
@app.post("/wallet")
async def save_wallet(request: Request):
    data = await request.json()
    telegram_id = data.get("telegram_id")
    wallet_address = data.get("wallet_address")

    if telegram_id and wallet_address:
        # Сохранение данных в Redis
        redis_client.set(telegram_id, wallet_address)
        return {"status": "success", "message": "Wallet saved successfully"}
    return {"status": "error", "message": "Invalid data"}

# Функция обработки команды /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    telegram_id = update.effective_user.id
    react_link = f"{REACT_URL}?telegram_id={telegram_id}"

    # Сохранение Telegram ID в Redis
    redis_client.set(telegram_id, "PENDING")  # Статус PENDING до получения кошелька

    # Отправка ссылки пользователю
    await update.message.reply_text(
        f"Привет! Перейди по этой ссылке для верификации кошелька: {react_link}"
    )

# Главная функция для запуска Telegram-бота
def run_telegram_bot():
    # Используем ApplicationBuilder для управления ботом
    application = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    # Регистрация команды /start
    application.add_handler(CommandHandler("start", start))

    # Запуск бота
    print("Telegram bot is running...")
    application.run_polling()

# Запуск FastAPI и Telegram-бота
if __name__ == "__main__":
    import threading

    # Запуск Telegram-бота в отдельном потоке
    bot_thread = threading.Thread(target=run_telegram_bot)
    bot_thread.start()

    # Запуск FastAPI
    print("FastAPI server is running...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
