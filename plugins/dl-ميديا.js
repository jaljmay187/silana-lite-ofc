
import fetch from 'node-fetch'
import cheerio from 'cheerio'

// الاستيراد لـ CJS
// const fetch = require('node-fetch')
// const cheerio = require('cheerio')

let handler = async (m, { conn, text }) => {
    conn.mediafire = conn.mediafire || {}

    if (m.sender in conn.mediafire) throw "❗ لا يزال هناك عملية قيد التنفيذ. يرجى الانتظار."

    if (!text) throw "❗ يرجى إدخال رابط MediaFire الذي تريد تنزيله."

    conn.mediafire[m.sender] = true
    await conn.sendMessage(m.chat, { react: { text: "🌀", key: m.key } })

    try {
        let result = await mediafireDownloader(text)

        if (!result.url) throw "❌ فشل في الحصول على رابط التنزيل."

        let caption = `✅ *تم تنزيل الملف من MediaFire بنجاح!*\n\n`
            + `📂 *اسم الملف:* ${result.filename}\n`
            + `📦 *الحجم:* ${result.size}\n`
            + `📅 *تاريخ الرفع:* ${result.date}\n`
            + `⏰ *وقت الرفع:* ${result.time}\n`
            + `🌍 *تم الرفع من:* ${result.from}\n\n`
            + `🔗 *الرابط:* ${result.url}`

        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
        await conn.sendMessage(m.chat, {
            document: { url: result.url },
            mimetype: 'application/octet-stream',
            fileName: result.filename,
            caption: caption
        }, { quoted: m })
    } catch (error) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
        m.reply(`❌ *فشل في تنزيل الملف:* ${error.message}`)
    }

    delete conn.mediafire[m.sender]
}

handler.help = ["mediafire"]
handler.tags = ["downloader"]
handler.command = /^(mediafire|ميديا|ميديافاير)$/i

export default handler

// Function Async di Bawah
async function mediafireDownloader(url) {
    const response = await fetch('https://r.jina.ai/' + url, {
        headers: { 'x-return-format': 'html' }
    })
    if (!response.ok) throw new Error("فشل في جلب البيانات من MediaFire!")

    const textHtml = await response.text()
    const $ = cheerio.load(textHtml)
    const TimeMatch = $('div.DLExtraInfo-uploadLocation div.DLExtraInfo-sectionDetails')
        .text()
        .match(/This file was uploaded from (.*?) on (.*?) at (.*?)\n/)

    const fileSize = $('a#downloadButton').text().trim().split('\n')[0].trim()
    return {
        title: $('div.dl-btn-label').text().trim() || "غير معروف",
        filename: $('div.dl-btn-label').attr('title') || "ملف",
        url: $('a#downloadButton').attr('href'),
        size: fileSize || "غير معروف",
        from: TimeMatch?.[1] || "غير معروف",
        date: TimeMatch?.[2] || "غير معروف",
        time: TimeMatch?.[3] || "غير معروف"
    }
}