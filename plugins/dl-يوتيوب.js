/*
- PLUGINS YTMP4
- Scrape by: daffa
- Source: https://whatsapp.com/channel/0029VakezCJDp2Q68C61RH2C
*/
//const axios = require("axios");
//const FormData = require("form-data");
//const WebSocket = require("ws");
//const cheerio = require("cheerio");
//const crypto = require("crypto");
import axios from "axios";
import FormData from "form-data";
import WebSocket from "ws";
import cheerio from "cheerio";
import crypto from "crypto";

async function Ytdll(url, quality = "720p") {
    const api = {
        base: "https://amp4.cc",
    };
    const headers = {
        Accept: "application/json",
        "User-Agent": "Postify/1.0.0",
    };
    const cookies = {};

    const parse_cookies = (set_cookie_headers) => {
        if (set_cookie_headers) {
            set_cookie_headers.forEach((cookie) => {
                const [key_value] = cookie.split(";");
                const [key, value] = key_value.split("=");
                cookies[key] = value;
            });
        }
    };

    const get_cookie_string = () =>
        Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; ");

    const client_get = async (url) => {
        const res = await axios.get(url, {
            headers: { ...headers, Cookie: get_cookie_string() },
        });
        parse_cookies(res.headers["set-cookie"]);
        return res;
    };

    const client_post = async (url, data, custom_headers = {}) => {
        const res = await axios.post(url, data, {
            headers: { ...headers, Cookie: get_cookie_string(), ...custom_headers },
        });
        parse_cookies(res.headers["set-cookie"]);
        return res;
    };

    const yt_regex =
        /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/;

    const hash_challenge = async (salt, number, algorithm) => {
        return crypto.createHash(algorithm.toLowerCase()).update(salt + number).digest("hex");
    };

    const verify_challenge = async (challenge_data, salt, algorithm, max_number) => {
        for (let i = 0; i <= max_number; i++) {
            if ((await hash_challenge(salt, i, algorithm)) === challenge_data) {
                return { number: i, took: Date.now() };
            }
        }
        throw new Error("Captcha verification failed");
    };

    const solve_captcha = async (challenge) => {
        const { algorithm, challenge: challenge_data, salt, maxnumber, signature } = challenge;
        const solution = await verify_challenge(challenge_data, salt, algorithm, maxnumber);
        return Buffer.from(
            JSON.stringify({ algorithm, challenge: challenge_data, number: solution.number, salt, signature, took: solution.took })
        ).toString("base64");
    };

    const connect_ws = async (id) => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`wss://amp4.cc/ws`, ["json"], {
                headers: { ...headers, Origin: `https://amp4.cc` },
                rejectUnauthorized: false,
            });

            let file_info = {};
            let timeout_id = setTimeout(() => {
                ws.close();
            }, 30000);

            ws.on("open", () => ws.send(id));
            ws.on("message", (data) => {
                const res = JSON.parse(data);
                if (res.event === "query" || res.event === "queue") {
                    file_info = { thumbnail: res.thumbnail, title: res.title, duration: res.duration, uploader: res.uploader };
                } else if (res.event === "file" && res.done) {
                    clearTimeout(timeout_id);
                    ws.close();
                    resolve({ ...file_info, ...res });
                }
            });
            ws.on("error", (err) => {
                clearTimeout(timeout_id);
            });
        });
    };

    try {
        const link_match = url.match(yt_regex);
        if (!link_match) throw new Error("URL tidak valid.");

        const fixed_url = `https://youtu.be/${link_match[3]}`;
        const page_data = await client_get(`${api.base}/`);
        const $ = cheerio.load(page_data.data);
        const csrf_token = $('meta[name="csrf-token"]').attr("content");

        const form = new FormData();
        form.append("url", fixed_url);
        form.append("format", "mp4");
        form.append("quality", quality);
        form.append("service", "youtube");
        form.append("_token", csrf_token);

        const captcha_data = await client_get(`${api.base}/captcha`);
        if (captcha_data.data) {
            const solved_captcha = await solve_captcha(captcha_data.data);
            form.append("altcha", solved_captcha);
        }

        const res = await client_post(`${api.base}/convertVideo`, form, form.getHeaders());

        const ws = await connect_ws(res.data.message);
        const dlink = `${api.base}/dl/${ws.worker}/${res.data.message}/${encodeURIComponent(ws.file)}`;

        return {
            title: ws.title || "-",
            uploader: ws.uploader,
            duration: ws.duration,
            quality: quality,
            format: "mp4",
            thumbnail: ws.thumbnail || `https://i.ytimg.com/vi/${link_match[3]}/maxresdefault.jpg`,
            download: dlink,
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

const handler = async (m, { conn, text }) => {
    if (!text) return m.reply("Masukkan URL YouTube dan resolusi.\nEX: *ytmp4 https://youtube.com/xxxxx 1080*\n\nResolusi yang tersedia\n*360*\n*480*\n*720*\n*1080*");

    try {
        const args = text.split(" ");
        const url = args[0];
        const quality = ["360", "480", "720", "1080"].includes(args[1]) ? `${args[1]}p` : "720p";

        const result = await Ytdll(url, quality);
        if (!result) return m.reply("Gagal mendapatkan data video.");

        const { title, download, thumbnail } = result;
          await conn.sendMessage(
            m.chat,
            {
                document: { url: download },
                mimetype: "video/mp4",
                fileName: `${title}.mp4`,
                caption: `*Judul:* ${title}\n*Resolusi:* ${quality}\n> Request By ${m.pushName}`,
                thumbnail: await (await axios.get(thumbnail, { responseType: "arraybuffer" })).data,
            },
            { quoted: m }
            //versi video lngsung ini
        /*await conn.sendMessage(
            m.chat,
            {
                video: { url: download },
                caption: `*Judul:* ${title}\n*Resolusi:* ${quality}\n> Request By ${m.pushName}`,
                mimetype: "video/mp4",
                thumbnail: await (await axios.get(thumbnail, { responseType: "arraybuffer" })).data,
            },
            { quoted: m }*/
        );
    } catch (error) {
        console.error(error);
        m.reply("Terjadi kesalahan, coba lagi nanti.");
    }
};

handler.help = ["ytmp4"];
handler.tags = ["downloader"];
handler.command = /^(يوتيوب)$/i;

export default handler;
//module.exports = handler;