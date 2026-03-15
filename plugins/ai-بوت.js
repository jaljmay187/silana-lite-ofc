/*
- PLUGINS GPT (riltem kayanya🐧)
- Thanks penyedia api
- Source: https://whatsapp.com/channel/0029VakezCJDp2Q68C61RH2C
*/
//const axios = require('axios');
import axios from 'axios';

const userSessions = {};
const sessionTimeouts = {};

const GPT = async (query, sessionId, prompt, model = "Yanzgpt-revolution-25b-v3.5") => {
    try {
        userSessions[sessionId] = userSessions[sessionId] || [{ role: "system", content: prompt }];
        userSessions[sessionId].push({ role: "user", content: query });

        if (sessionTimeouts[sessionId]) clearTimeout(sessionTimeouts[sessionId]);
        sessionTimeouts[sessionId] = setTimeout(() => {
            delete userSessions[sessionId];
            delete sessionTimeouts[sessionId];
        }, 60 * 60 * 1000);

        const response = await axios.post("https://api.yanzgpt.my.id/v1/chat", {
            messages: userSessions[sessionId],
            model
        }, {
            headers: { authorization: "Bearer yzgpt-sc4tlKsMRdNMecNy", "content-type": "application/json" }
        });

        const reply = response.data.choices?.[0]?.message?.content || "Tidak ada respons.";
        userSessions[sessionId].push({ role: "assistant", content: reply });

        return reply;
    } catch (error) {
        console.error("Error in GPT api.", error.message);
        throw new Error("Gagal terhubung ke GPT API.");
    }
};

const handler = async (m, { text, conn }) => {
    const userId = m.sender;
    let prompt = text.trim();
    const systemPrompt = "اسمك شعبوط ومطورك جلال الجماعي"; // prompt ganti aja bebas

    if (!prompt) {
        return m.reply("مرحبا كيف يمكنني مساعدتك اليوم?");
    }

    // ganti model disini yak (ganti sesuai kebutuhan)
       const selectedModel = "yanzgpt-revolution-25b-v3.5"; // Default
    // const selectedModel = "yanzgpt-legacy-72b-v3.5"; // Pro
    // const selectedModel = "yanzgpt-r1-70b-v3.5"; // Reasoning

    await conn.sendMessage(m.chat, { react: { text: '🌸', key: m.key } });

    try {
        const response = await GPT(prompt, userId, systemPrompt, selectedModel);
        await conn.sendMessage(m.chat, { text: response }, { quoted: m });
    } catch (error) {
        console.error("Error processing request:", error.message);
        await conn.sendMessage(m.chat, { text: 'Terjadi kesalahan saat memproses permintaan.' }, { quoted: m });
    }

    await conn.sendMessage(m.chat, { react: { text: null, key: m.key } });
};

handler.command = /^(gpt|بوت)$/i;
handler.help = ['gpt'];
handler.tags = ['ai'];



export default handler;
//module.exports = handler;