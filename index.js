import makeWASocket, { useSingleFileAuthState, DisconnectReason } from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";

const { state, saveState } = useSingleFileAuthState("./auth_info.json");

function startSock() {
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, null, 2));
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! This is Sasuke Bot ✅' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error).output.statusCode;
            console.log('Connection closed:', reason);
            if (reason !== DisconnectReason.loggedOut) {
                console.log('Reconnecting...');
                startSock(); // safely reconnect
            }
        } else if (connection === 'open') {
            console.log('Connected successfully!');
        }
    });

    return sock;
}

// Start the bot
startSock();
