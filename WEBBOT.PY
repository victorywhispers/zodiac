import os
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters
from aiohttp import web
import json

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Bot configuration 
BOT_TOKEN = os.getenv('BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
PORT = int(os.getenv('PORT', '8443'))
WEBAPP_HOST = '0.0.0.0'
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://wormgpt-frontend.onrender.com')

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a message with the Flash 2.0 web app button."""
    keyboard = [[InlineKeyboardButton(
        "🤖 Open Flash 2.0", 
        web_app=WebAppInfo(url=WEBAPP_URL)
    )]]

    await update.message.reply_text(
        "Welcome! Click the button below to start using Flash 2.0:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

def main():
    """Start the bot."""
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    application.run_polling(allowed_updates=Update.ALL_TYPES)
    logging.info("Bot started")

if __name__ == '__main__':
    main()
