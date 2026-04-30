const fs = require('fs');
const content = fs.readFileSync('.env.example', 'utf8');
const newContent = content.replace(/=".*?"/g, '=""').replace(/=([^\n"].*)$/gm, '=');
fs.writeFileSync('frontend/.env.example', newContent);
fs.writeFileSync('backend/.env.example', newContent);
console.log('done');
