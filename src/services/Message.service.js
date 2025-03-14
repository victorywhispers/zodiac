//handles sending messages to the api

import { GoogleGenerativeAI } from "@google/generative-ai"
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import * as settingsService from "./Settings.service.js";
import * as personalityService from "./Personality.service.js";
import * as chatsService from "./Chats.service.js";
import * as helpers from "../utils/helpers.js";
import { supabaseService } from './database/SupabaseService';
import { redisService } from './database/RedisService';
import { userService } from './User.service.js';
import { weaviateService } from './database/WeaviateService';
import { chatLimitService } from './database/ChatLimitService.js';

async function generateEmbedding(text) {
    try {
        const model = new GoogleGenerativeAI(settingsService.getSettings().apiKey)
            .getGenerativeModel({ model: "embedding-001" });
        
        const result = await model.embedContent(text);
        // Ensure we get the values array
        const embedding = result.embedding.values;
        
        if (!embedding || !Array.isArray(embedding)) {
            console.error('Invalid embedding generated:', embedding);
            return null;
        }
        
        // Ensure all values are numbers
        if (!embedding.every(val => typeof val === 'number')) {
            console.error('Invalid embedding values:', embedding);
            return null;
        }
        
        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
}

export async function send(msg, db) {
    try {
        const { isDailyLimitReached, isMonthlyLimitReached } = await chatLimitService.isLimitReached();
        
        if (isDailyLimitReached) {
            throw new Error('Daily chat limit reached');
        }
        if (isMonthlyLimitReached) {
            throw new Error('Monthly chat limit reached');
        }

        await chatLimitService.incrementCount();
        await chatLimitService.updateDisplay();

        // Store in Supabase
        const userId = userService.getCurrentUserId();
        const stored = await supabaseService.storeChat({
            message: msg,
            timestamp: Date.now(),
            user_id: userId,
            metadata: { source: 'chat' }
        });

        if (!stored) {
            console.warn('Failed to store message in Supabase');
            // Continue with local storage even if remote storage fails
        }

        // Generate embedding and store in Weaviate
        const embedding = await generateEmbedding(msg);
        if (embedding) {
            await weaviateService.storeMessage(msg, embedding);
        }

        // Continue with your existing code...
        const selectedPersonality = await personalityService.getSelected();
        if (!selectedPersonality) {
            return;
        }
        const settings = settingsService.getSettings();
        if (settings.apiKey === "") {
            alert("Please enter an API key");
            return;
        }
        if (!msg) {
            return;
        }

        try {
            //model setup
            const generativeModel = new GoogleGenerativeAI(settings.apiKey).getGenerativeModel({
                model: settings.model,
                systemInstruction: settingsService.getSystemPrompt()
            });

            //user msg handling
            if (!await chatsService.getCurrentChat(db)) {
                const result = await generativeModel.generateContent('Please generate a short title for the following request from a user, only reply with the short title, nothing else: ' + msg);
                const title = result.response.text()
                const id = await chatsService.addChat(title, null, db);
                document.querySelector(`#chat${id}`).click();
            }

            await insertMessage("user", msg);

            const chat = generativeModel.startChat({
                generationConfig: {
                    maxOutputTokens: settings.maxTokens,
                    temperature: settings.temperature / 100
                },
                safetySettings: settings.safetySettings,
                history: [
                    {
                        role: "user",
                        parts: [{ text: `Personality Name: ${selectedPersonality.name}, Personality Description: ${selectedPersonality.description}, Personality Prompt: ${selectedPersonality.prompt}. Your level of aggression is ${selectedPersonality.aggressiveness} out of 3. Your sensuality is ${selectedPersonality.sensuality} out of 3.` }]
                    },
                    {
                        role: "model",
                        parts: [{ text: "okie dokie. from now on, I will be acting as the personality you have chosen" }]
                    },
                    ...(selectedPersonality.toneExamples ? selectedPersonality.toneExamples.map((tone) => {
                        return { role: "model", parts: [{ text: tone }] }
                    }) : []),
                    ...(await chatsService.getCurrentChat(db)).content.map((msg) => {
                        return { role: msg.role, parts: msg.parts }
                    })
                ]
            });

            // Generate stream response
            const stream = await chat.sendMessageStream(msg);

            // Create message container for model response
            const messageElement = await insertMessage("model", "", selectedPersonality.name, stream, db);

            // Get the response text from the message element
            const messageText = messageElement.querySelector('.message-text');

            // Save chat history
            const currentChat = await chatsService.getCurrentChat(db);
            currentChat.content.push(
                { role: "user", parts: [{ text: msg }] },
                { role: "model", personality: selectedPersonality.name, parts: [{ text: messageText.textContent }] }
            );
            await db.chats.put(currentChat);

            // Add refresh button functionality
            const refreshBtn = messageElement.querySelector('.btn-refresh');
            if (refreshBtn) {
                refreshBtn.onclick = async () => {
                    await regenerate(messageElement, db);
                };
            }

        } catch (error) {
            console.error('Error sending message:', error);
            await insertMessage("model", "Sorry, there was an error processing your request. Please try again.", selectedPersonality?.name);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

async function regenerate(responseElement, db) {
    //basically, we remove every message after the response we wish to regenerate, then send the message again.
    const message = responseElement.previousElementSibling.querySelector(".message-text").textContent;
    const elementIndex = [...responseElement.parentElement.children].indexOf(responseElement);
    const chat = await chatsService.getCurrentChat(db);

    chat.content = chat.content.slice(0, elementIndex - 1);
    await db.chats.put(chat);
    await chatsService.loadChat(chat.id, db);
    await send(message, db);
}

export async function insertMessage(sender, msg, selectedPersonalityTitle = null, netStream = null, db = null) {
    //create new message div for the user's message then append to message container's top
    const newMessage = document.createElement("div");
    newMessage.classList.add("message");
    const messageContainer = document.querySelector(".message-container");
    messageContainer.append(newMessage);

    //handle model's message
    if (sender != "user") {
        newMessage.classList.add("message-model");
        const messageRole = selectedPersonalityTitle;
        newMessage.innerHTML = `
            <div class="message-header">
                <h3 class="message-role">${messageRole}</h3>
                <button class="btn-refresh btn-textual material-symbols-outlined">refresh</button>
            </div>
            <div class="message-role-api" style="display: none;">${sender}</div>
            <div class="message-text"></div>
        `;

        const messageText = newMessage.querySelector('.message-text');

        // Add copy button to code blocks after markdown parsing
        const addCopyButtons = () => {
            const codeBlocks = messageText.querySelectorAll('pre code');
            codeBlocks.forEach(codeBlock => {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-code-button';
                copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span>';
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(codeBlock.textContent);
                    copyButton.innerHTML = '<span class="material-symbols-outlined">check</span>';
                    setTimeout(() => {
                        copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span>';
                    }, 2000);
                };

                codeBlock.parentNode.insertBefore(wrapper, codeBlock);
                wrapper.appendChild(copyButton);
                wrapper.appendChild(codeBlock);
            });
        };

        if (!netStream) {
            messageText.innerHTML = marked.parse(msg);
            addCopyButtons();
        } else {
            let rawText = "";
            for await (const chunk of netStream.stream) {
                try {
                    rawText += chunk.text();
                    messageText.innerHTML = marked.parse(rawText, { breaks: true });
                    addCopyButtons();
                    helpers.messageContainerScrollToBottom();
                } catch (error) {
                    console.error('Error processing chunk:', error);
                }
            }
        }
    } else {
        const messageRole = "You:";
        newMessage.innerHTML = `
            <div class="message-header">
                <h3 class="message-role">${messageRole}</h3>
            </div>
            <div class="message-role-api" style="display: none;">${sender}</div>
            <div class="message-text">${helpers.getDecoded(msg)}</div>
        `;
    }

    hljs.highlightAll();
    return newMessage;
}