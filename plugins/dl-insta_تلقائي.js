/*
بيشتغل ب global تعينه باسم
global.AutoInsta
عينو ب true من ال config او بكود > 
وظيفتو مستشعر روابط انستا اول ما تبعتها فالشات هتتحمل من غير command 
*/
import fetch from 'node-fetch'

const instagramRegex = /(?:https?:\/)?(?:www\.)?(?:instagram\.com\/(reel|v|stories)\/|instagr\.am\/)([w-]+)(?:\?utm_source=ig_web_copy_link)?/i

export async function before(m, { conn }) {
    if (!global.AutoInsta) return

    if (instagramRegex.test(m.text)) {
        try {
            await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })
            
            const encodedURL = encodeURICompont(m.text.trim())
            const apiUrl = `https://the-end-api.vercel.app/home/sections/Download/api/Instagram/ajax?url=${encodedURL}`
            
            const response = await fetch(apiUrl)
            if (!response.ok) throw new Error(`فشل الاتصال بالخادم: ${response.statusText}`)
            
            const data = await response.json()
            if (!data.status || !data.data?.[1]?.url) thr