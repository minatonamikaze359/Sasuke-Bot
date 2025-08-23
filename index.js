// Enable ES Modules by default in Replit (package.json "type": "module")

import makeWASocket, { useSingleFileAuthState, DisconnectReason } from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";

// Auth state file
const { state, saveState } = useSingleFileAuthState("./auth_info.json");

// Create WhatsApp connection
const sock = makeWASocket({
    printQRInTerminal: true, // Shows QR code in Replit console
    auth: state
});

// Save auth credentials when updated
sock.ev.on('creds.update', saveState);

// Listen to incoming messages
sock.ev.on('messages.upsert', async (m) => {
    console.log(JSON.stringify(m, null, 2));

    // Example: reply to a message
    const msg = m.messages[0];
    if (!msg.key.fromMe && msg.message?.conversation) {
        await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! This is Sasuke Bot ✅' });
    }
});

// Listen to connection updates
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error).output.statusCode;
        console.log('Connection closed:', reason);
        if (reason !== DisconnectReason.loggedOut) {
            startSock(); // reconnect automatically
        }
    } else if (connection === 'open') {
        console.log('Connected successfully!');
    }
});

// Optional: reconnect function
function startSock() {
    // Re-run makeWASocket if disconnected
    sock.ev.removeAllListeners(); // Remove old listeners
    return makeWASocket({ printQRInTerminal: true, auth: state });
          }
