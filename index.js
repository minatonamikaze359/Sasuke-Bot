import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info")
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const sender = msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""

    // ✅ Reply only if tagged or replied
    if (text.includes("Sasuke") || msg.message?.extendedTextMessage?.contextInfo) {
      const reply = await askAI(text)
      await sock.sendMessage(sender, { text: reply }, { quoted: msg })
    }
  })
}

// 🔹 AI API
async function askAI(input) {
  try {
    const res = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are Sasuke Uchiha, reply like Sasuke." },
        { role: "user", content: input }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json"
      }
    })

    return res.data.choices[0].message.content
  } catch (err) {
    return "Hn."
  }
}

startBot()
