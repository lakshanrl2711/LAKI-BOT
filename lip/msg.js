const { proto, downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys')
const fs = require('fs')

const downloadMediaMessage = async (m, filename) => {
    if (m.type === 'viewOnceMessage') {
        m.type = m.msg.type
    }
    const writeFile = async (stream, name) => {
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        fs.writeFileSync(name, buffer)
        return fs.readFileSync(name)
    }

    if (m.type === 'imageMessage') {
        const nameJpg = filename ? `${filename}.jpg` : 'undefined.jpg'
        const stream = await downloadContentFromMessage(m.msg, 'image')
        return writeFile(stream, nameJpg)
    } else if (m.type === 'videoMessage') {
        const nameMp4 = filename ? `${filename}.mp4` : 'undefined.mp4'
        const stream = await downloadContentFromMessage(m.msg, 'video')
        return writeFile(stream, nameMp4)
    } else if (m.type === 'audioMessage') {
        const nameMp3 = filename ? `${filename}.mp3` : 'undefined.mp3'
        con
