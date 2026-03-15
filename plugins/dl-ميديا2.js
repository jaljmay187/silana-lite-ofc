import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
    if (!text) return m.reply('Please provide a MediaFire link!');

    try {
        const response = await fetch(`https://api.agatz.xyz/api/mediafire?url=${text}`);
        const result = await response.json();

        if (result.status === 200) {
            const file = result.data[0];
            const mime = file.mime;

            let caption = `*File Name:* ${file.nama}\n*Size:* ${file.size}\n\nDownloading...`;

            await conn.sendMessage(m.chat, { text: caption }, m);
            await conn.sendMessage(m.chat, { document: { url: file.link }, mimetype: mime, fileName: file.nama }, m);
        } else {
            m.reply('Failed to fetch the MediaFire link. Please try again.');
        }
    } catch (error) {
        console.error(error);
        m.reply('An error occurred while fetching the download link.');
    }
};

handler.help = ['mediafire'];
handler.tags = ['downloader'];
handler.command = /^(ميديا2|mediafire2)$/i;

export default handler;