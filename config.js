const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "v8AVWSJA#-1bMslZhNe5kqTzOi06_LsaB84GF-F1nYn1MuDe_0ug",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/lakshanrl2711/LAKI-BOT/blob/main/image/WhatsApp%20Image%202025-08-31%20at%2003.39.35_2e246770.jpg?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 🌺𝙇αкι 𝘽σƚ🍀 Is Alive Now😍*",
BOT_OWNER: '94760341817',  // Replace with the owner's phone number



};
