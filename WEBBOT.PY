import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from flask import Flask
import json
import os

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

app = Flask(__name__)

# Bot configuration
BOT_TOKEN = "7909216903:AAGJXAo1nWT0Wqs6ohOdNaWwtejUEKcHtZs"
WEBAPP_URL = "https://wormgpt-frontend.onrender.com"
PORT = int(os.environ.get('PORT', 8443))
WEBAPP_HOST = '0.0.0.0'

@app.route('/health')
def health():
    return {'status': 'alive'}

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a message with the web app button."""
    keyboard = [[InlineKeyboardButton(
        "🤖 Open Flash 2.0", 
        web_app=WebAppInfo(url=WEBAPP_URL)
    )]]

    await update.message.reply_text(
        "Welcome! Click the button below to open Flash 2.0:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

def init_bot():
    """Initialize the bot."""
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    return application

# Initialize bot in a background thread
def run_bot():
    app = init_bot()
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    import threading
    bot_thread = threading.Thread(target=run_bot)
    bot_thread.start()
    app.run(host=WEBAPP_HOST, port=PORT)
