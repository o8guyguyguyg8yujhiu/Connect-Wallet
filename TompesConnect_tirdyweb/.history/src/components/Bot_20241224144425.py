from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes
import redis

# Настройки
API_TOKEN = "7836466566:AAGPBD_PvhOovgk3P5_4kXOVxAYvTtbnEW0"  # Замените на токен вашего бота
REDIS_HOST = "localhost"  # Хост Redis
REDIS_PORT = 6379  # Порт Redis
REDIS_DB = 0

# URL сайта через ngrok
NGROK_URL = "https://f2fa-24-150-119-126.ngrok-free.app"  # Замените на ваш ngrok адрес

# Настраиваем Redis
redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Обработчик команды /start.
    Создаёт инлайн-кнопку и сохраняет user_id в Redis.
    """
    user_id = update.effective_user.id
    first_name = update.effective_user.first_name

    # Сохраняем user_id в Redis
    redis_client.sadd("user_ids", user_id)

    # Создаём инлайн-кнопку
    button = InlineKeyboardButton(
        text="Перейти на сайт для верификации",
        url=f"{NGROK_URL}/?user_id={user_id}"  # Передаём user_id в URL
    )
    keyboard = InlineKeyboardMarkup([[button]])

    # Приветственное сообщение с кнопкой
    await update.message.reply_text(
        f"Привет, {first_name}! Нажмите на кнопку ниже, чтобы пройти верификацию.",
        reply_markup=keyboard
    )


async def get_user_ids(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Команда для просмотра всех сохранённых user_id.
    """
    user_ids = redis_client.smembers("user_ids")
    user_ids_list = ", ".join(user_ids)

    if not user_ids_list:
        user_ids_list = "Нет сохранённых пользователей."

    await update.message.reply_text(f"Сохранённые user_ids: {user_ids_list}")


def main():
    """
    Основная функция для запуска бота.
    """
    # Создаём приложение
    application = Application.builder().token(API_TOKEN).build()

    # Регистрируем команды
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("user_ids", get_user_ids))

    # Запуск бота
    application.run_polling()


if __name__ == "__main__":
    main()
