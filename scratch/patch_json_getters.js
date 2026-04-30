const fs = require('fs');
const path = require('path');

const modelsDir = '/home/bicrypto/bicrypto/backend/dist/models';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(modelsDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Pattern 1: return value ? JSON.parse(value) : null;
    const pattern1 = /return\s+([a-zA-Z0-9_]+)\s*\?\s*JSON\.parse\(\1\)\s*:\s*([^;]+);/g;
    if (content.match(pattern1)) {
        content = content.replace(pattern1, 'return (typeof $1 === "string") ? JSON.parse($1) : $1;');
        changed = true;
    }

    // Pattern 2: return JSON.parse(value);
    const pattern2 = /return\s+JSON\.parse\(([a-zA-Z0-9_]+)\);/g;
    if (content.match(pattern2)) {
        content = content.replace(pattern2, 'return (typeof $1 === "string") ? JSON.parse($1) : $1;');
        changed = true;
    }
    
    // Pattern 3: const json = JSON.parse(value);
    const pattern3 = /const\s+([a-zA-Z0-9_]+)\s*=\s*JSON\.parse\(([a-zA-Z0-9_]+)\);/g;
    if (content.match(pattern3)) {
        content = content.replace(pattern3, 'const $1 = (typeof $2 === "string") ? JSON.parse($2) : $2;');
        changed = true;
    }

    if (changed) {
        console.log(`Patching ${file}`);
        fs.writeFileSync(file, content, 'utf8');
    }
});
