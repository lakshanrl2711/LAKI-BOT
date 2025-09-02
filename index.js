const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const express = require('express');
const axios = require('axios');
const path = require('path');
const qrcode = require('qrcode-terminal');

const config = require('./config');
const { sms, downloadMediaMessage } = require('./lib/msg');
const {
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson
} = require('./lib/functions');
const { File } = require('megajs');
const { commands, replyHandlers } = require('./command');

const app = express();
const port = process.env.PORT || 8000;

const prefix = '.';
const ownerNumber = ['94779439309'];
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

async function ensureSessionFile() {
  if (!fs.existsSync(credsPath)) {
    if (!config.SESSION_ID) {
      console.error('❌ 𝚂𝙴𝚂𝚂𝙸𝙾𝙽_𝙸𝙳 𝚎𝚗𝚟 𝚟𝚊𝚛𝚒𝚊𝚋𝚕𝚎 𝚒𝚜 𝚖𝚒𝚜𝚜𝚒𝚗𝚐. 𝙲𝚊𝚗𝚗𝚘𝚝 𝚛𝚎𝚜𝚝𝚘𝚛𝚎 𝚜𝚎𝚜𝚜𝚝𝚒𝚘𝚗...🚫');
      process.exit(1);
    }

    console.log("🔄 creds.json not found. Downloading session from MEGA...");

    const sessdata = config.SESSION_ID;
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);

    filer.download((err, data) => {
      if (err) {
        console.error("✖𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚜𝚎𝚜𝚜𝚝𝚒𝚘𝚗 🆔 𝚏𝚒𝚕𝚎 𝚏𝚛𝚘𝚖 𝚖𝚎𝚐𝚊...😕:", err);
        process.exit(1);
      }

      fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });
      fs.writeFileSync(credsPath, data);
      console.log("✅➫ 𝚂𝚎𝚜𝚜𝚝𝚒𝚘𝚗 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚎𝚍 𝚊𝚗𝚍 𝚜𝚊𝚟𝚎𝚍. 𝚁𝚎𝚜𝚝𝚊𝚛𝚝𝚒𝚗𝚐 𝙻𝙰𝙺𝙸 𝙱𝙾𝚃🍂💯");
      setTimeout(() => {
        connectToWA();
      }, 2000);
    });
  } else {
    setTimeout(() => {
      connectToWA();
    }, 1000);
  }
}

async function connectToWA() {
  console.log("☑𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚗𝚐 𝙻𝙰𝙺𝙸 𝙱𝙾𝚃🍂🔵");
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '/auth_info_baileys/'));
  const { version } = await fetchLatestBaileysVersion();

  const laki = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    auth: state,
    version,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  laki.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('☑ 𝙻𝙰𝙺𝙸 𝙱𝙾𝚃 𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚗𝚐 𝚃𝚘 𝚆𝚑𝚊𝚝𝚜𝚊𝚙𝚙❤🍂');

      const up = `☑ 𝙻𝙰𝙺𝙸 𝙱𝙾𝚃 𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍🤟🏻😉\n\nPREFIX: ${prefix}`;
      await laki.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
        image: { url: `https://github.com/lakshanrl2711/LAKI-BOT/blob/main/img/WhatsApp%20Image%202025-08-31%20at%2003.00.40_d9f7105e.jpg?raw=true` },
        caption: up
      });

      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require(`./plugins/${plugin}`);
        }
      });
    }
  });

  laki.ev.on('creds.update', saveCreds);

  laki.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.messageStubType === 68) {
        await laki.sendMessageAck(msg.key);
      }
    }

    const mek = messages[0];
    if (!mek || !mek.message) return;

    mek.message = getContentType(mek.message) === 'ephemeralMessage' ? mek.message.ephemeralMessage.message : mek.message;
    if (mek.key.remoteJid === 'status@broadcast') return;

    const m = sms(laki, mek);
    const type = getContentType(mek.message);
    const from = mek.key.remoteJid;
    const body = type === 'conversation' ? mek.message.conversation : mek.message[type]?.text || mek.message[type]?.caption || '';
    const isCmd = body.startsWith(prefix);
    const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');

    const sender = mek.key.fromMe ? laki.user.id : (mek.key.participant || mek.key.remoteJid);
    const senderNumber = sender.split('@')[0];
    const isGroup = from.endsWith('@g.us');
    const botNumber = laki.user.id.split(':')[0];
    const pushname = mek.pushName || 'Sin Nombre';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const botNumber2 = await jidNormalizedUser(laki.user.id);

    const groupMetadata = isGroup ? await laki.groupMetadata(from).catch(() => {}) : '';
    const groupName = isGroup ? groupMetadata.subject : '';
    const participants = isGroup ? groupMetadata.participants : '';
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

    const reply = (text) => laki.sendMessage(from, { text }, { quoted: mek });

    if (isCmd) {
      const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
      if (cmd) {
        if (cmd.react) laki.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
        try {
          cmd.function(laki, mek, m, {
            from, quoted: mek, body, isCmd, command: commandName, args, q,
            isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
            isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
            isBotAdmins, isAdmins, reply,
          });
        } catch (e) {
          console.error("[PLUGIN ERROR]", e);
        }
      }
    }

    const replyText = body;
    for (const handler of replyHandlers) {
      if (handler.filter(replyText, { sender, message: mek })) {
        try {
          await handler.function(laki, mek, m, {
            from, quoted: mek, body: replyText, sender, reply,
          });
          break;
        } catch (e) {
          console.log("Reply handler error:", e);
        }
      }
    }
  });
}

ensureSessionFile();

app.get("/", (req, res) => {
  res.send("🤗𝙷𝚎𝚢, 𝙻𝙰𝙺𝙸 𝙱𝙾𝚃 𝚂𝚃𝙰𝚁𝚃𝙴𝙳❤🍂");
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
