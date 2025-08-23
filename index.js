import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const sender = msg.key.remoteJid;
    const text =
      msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    // Reply only if tagged or replied
    if (text.includes("Sasuke") || msg.message?.extendedTextMessage?.contextInfo) {
      const reply = await askAI(text);
      await sock.sendMessage(sender, { text: reply }, { quoted: msg });
    }
  });
}

// Google API call
async function askAI(input) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${process.env.AI_API_KEY}`,
      {
        prompt: input,
        maxOutputTokens: 256
      }
    );
    return res.data.candidates[0].output;
  } catch (err) {
    console.log("Error:", err.response?.data || err.message);
    return "Hn.";
  }
}

// Start the bot
startBot();
