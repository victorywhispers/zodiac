//handles sending messages to the api

import { GoogleGenerativeAI } from "@google/generative-ai"
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import * as settingsService from "./Settings.service.js";
import * as personalityService from "./Personality.service.js";
import * as chatsService from "./Chats.service.js";
import * as helpers from "../utils/helpers.js";

// Add error toast function
function showErrorToast(message, isWarning = false) {
    const toast = document.createElement('div');
    toast.className = `error-toast ${isWarning ? 'warning' : ''}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${isWarning ? 'warning' : 'error'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Show animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Modify send function with better error handling
export async function send(msg, db) {
    try {
        const selectedPersonality = await personalityService.getSelected();
        if (!selectedPersonality) {
            showErrorToast('No personality selected');
            return;
        }

        if (!navigator.onLine) {
            showErrorToast('No internet connection. Please check your connection and try again.', true);
            return;
        }

        const settings = settingsService.getSettings();
        if (settings.apiKey === "") {
            showErrorToast('Please enter an API key');
            return;
        }

        if (!msg) {
            return;
        }

        try {
            const generativeModel = new GoogleGenerativeAI(settings.apiKey).getGenerativeModel({
                model: settings.model,
                systemInstruction: settingsService.getSystemPrompt()
            });

            // Handle chat creation
            if (!await chatsService.getCurrentChat(db)) {
                try {
                    const result = await generativeModel.generateContent('Please generate a short title for the following request from a user, only reply with the short title, nothing else: ' + msg);
                    const title = result.response.text()
                    const id = await chatsService.addChat(title, null, db);
                    document.querySelector(`#chat${id}`).click();
                } catch (error) {
                    showErrorToast('Failed to create new chat. Please try again.');
                    return;
                }
            }

            await insertMessage("user", msg);

            // Handle message stream with retry
            let retries = 3;
            while (retries > 0) {
                try {
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

                    const stream = await chat.sendMessageStream(msg);
                    const messageElement = await insertMessage("model", "", selectedPersonality.name, stream, db);
                    
                    // Success - break the retry loop
                    break;
                } catch (error) {
                    retries--;
                    if (retries === 0) {
                        throw error;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                }
            }

        } catch (error) {
            console.error('API Error:', error);
            showErrorToast('Failed to get response from AI. Please try again.');
            throw error;
        }

    } catch (error) {
        console.error('Error sending message:', error);
        await insertMessage("model", "Sorry, there was an error processing your request. Please try again.", selectedPersonality?.name);
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