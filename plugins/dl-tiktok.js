/*

- PLUGINS TIKTOK

- Thanks penyedia scrape

- Source: https://whatsapp.com/channel/0029VakezCJDp2Q68C61RH2C

*/

//const fetch = require('node-fetch');

import fetch from 'node-fetch';

const LoveTik = {

    async dapatkan(url) {

        const response = await fetch('https://lovetik.com/api/ajax/search', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',

            },

            body: `query=${encodeURIComponent(url)}`

        });

        const data = await response.json();

        if (!data.links || data.links.length === 0) throw new Error("Gagal mengambil data!");

        let videos = [];

        let audios = [];

        data.links.forEach(item => {

            if (!item.a) return;

            const formatted = {

                format: item.t.replace(/<.*?>|♪/g, '').trim(),

                resolution: item.s || 'Audio Only',

                link: item.a

            };

            if (item.ft == 1) {

                videos.push(formatted);

            } else {

                audios.push(formatted);

            }

        });

        videos.sort((a, b) => {

            let resA = parseInt(a.resolution.replace(/\D/g, '')) || 0;

            let resB = parseInt(b.resolution.replace(/\D/g, '')) || 0;

            return resB - resA;

        });

        return { 

            videos, 

            audios, 

            desc: data.desc, 

            author: data.author

        };

    }

};

let handler = async (m, { args, conn, usedPrefix, command }) => {

    try {

        if (!args[0]) return m.reply(`مثال: ${usedPrefix + command} https://vt.tiktok.com/maki`);

        if (!/^https?:\/\/(.*\.)?tiktok\.com\//.test(args[0])) {

            return m.reply("Masukkan URL TikTok yang valid!");

        }

        await conn.sendMessage(m.chat, { react: { text: '⬇️', key: m.key } });

        let response = await LoveTik.dapatkan(args[0]);

        let caption = `Request By ${m.pushName}`;

        if (response.videos.length > 0) {

            let bestVideo = response.videos[0];

            await conn.sendFile(m.chat, bestVideo.link, 'Ar-sens.mp4', caption, m);

        }

        if (response.audios.length > 0) {

            let bestAudio = response.audios[0];

            await conn.sendFile(m.chat, bestAudio.link, 'Ar-sens.mp3', '', m);

        }

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (error) {

        m.reply(`Terjadi kesalahan: ${error.message || error.toString()}`);

        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

    }

};

handler.help = ['tiktok'].map((v) => v + ' <url>');

handler.tags = ['downloader'];

handler.command = /^(tiktok|تيك|تيك-توك)$/i;





export default handler;

//module.exports = handler;