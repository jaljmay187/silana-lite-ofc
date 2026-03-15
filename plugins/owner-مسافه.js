/*
بيشيل المسافات من اسامي الملفات ويحط - عشان المسافات ممكن تعمل مشاكل 
https://whatsapp.com/channel/0029VaJxI9uJkK7BedTH0D11
*/

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn }) => {
    const folderPath = './plugins/';

    fs.readdir(folderPath, (err, files) => {
        if (err) return m.reply('حدث خطأ أثناء قراءة المجلد.');

        let renamedFiles = [];

        files.forEach(file => {
            const oldPath = path.join(folderPath, file);
            const newFileName = file.replace(/\s+/g, '-');
            const newPath = path.join(folderPath, newFileName);

            if (oldPath !== newPath) {
                fs.rename(oldPath, newPath, err => {
                    if (!err) renamedFiles.push(`${file} ➜ ${newFileName}`);
                });
            }
        });

        setTimeout(() => {
            if (renamedFiles.length > 0) {
                m.reply(`تم تعديل أسماء الملفات:\n\n${renamedFiles.join('\n')}`);
            } else {
                m.reply('لا يوجد ملفات تحتاج للتعديل.');
            }
        }, 1000);
    });
};

handler.command = ['مسافه'];
handler.help = ['renamefiles'];
handler.tags = ['tools'];

export default handler;