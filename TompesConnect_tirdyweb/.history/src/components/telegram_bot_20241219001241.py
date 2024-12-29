from telegram import Update, Bot
from telegram.ext import Updater, CommandHandler, CallbackContext
from fastapi import FastAPI, Request
import redis
import uvicorn

# Настройки
TELEGRAM_TOKEN = "7836466566:AAGPBD_PvhOovgk3P5_4kXOVxAYvTtbnEW0"
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REACT_URL = "https://90a9-24-150-119-126.ngrok-free.app"

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
def start(update: Update, context: CallbackContext) -> None:
    telegram_id = update.effective_user.id
    react_link = f"{REACT_URL}?telegram_id={telegram_id}"

    # Сохранение Telegram ID в Redis
    redis_client.set(telegram_id, "PENDING")  # Статус PENDING до получения кошелька

    # Отправка ссылки пользователю
    update.message.reply_text(
        f"Привет! Перейди по этой ссылке для верификации кошелька: {react_link}"
    )

# Главная функция для запуска Telegram-бота
def run_telegram_bot():
    updater = Updater(TELEGRAM_TOKEN, use_context=True)
    dp = updater.dispatcher

    # Регистрация команды /start
    dp.add_handler(CommandHandler("start", start))

    # Запуск бота
    print("Telegram bot is running...")
    updater.start_polling()
    updater.idle()

# Запуск FastAPI и Telegram-бота
if __name__ == "__main__":
    import threading

    # Запуск Telegram-бота в отдельном потоке
    bot_thread = threading.Thread(target=run_telegram_bot)
    bot_thread.start()

    # Запуск FastAPI
    print("FastAPI server is running...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

