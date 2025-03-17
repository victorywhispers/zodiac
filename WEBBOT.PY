import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters
from aiohttp import web
import json
from flask import Flask

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

app = Flask(__name__)

# Direct configuration
BOT_TOKEN = "7909216903:AAGJXAo1nWT0Wqs6ohOdNaWwtejUEKcHtZs"  # Your bot token
WEBAPP_URL = "https://wormgpt-frontend.onrender.com"  # Your frontend URL
PORT = 8443
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

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle data received from the web app."""
    data = json.loads(update.effective_message.web_app_data.data)
    await update.message.reply_text(f"Received data from web app: {data}")

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors."""
    logging.error(f"Update {update} caused error {context.error}")

def run_bot():
    """Start the bot."""
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))
    application.add_error_handler(error_handler)
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    import threading
    bot_thread = threading.Thread(target=run_bot)
    bot_thread.start()
    app.run(host=WEBAPP_HOST, port=PORT)
