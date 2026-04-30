import fs from 'fs';
import path from 'path';

const baseDir = '/home/bicrypto/bicrypto/backend/dist/models';

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

const files = walk(baseDir);
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('DataTypes.JSON')) {
        // Find JSON fields
        const jsonFields = [];
        const lines = content.split('\n');
        let currentField = null;
        lines.forEach(line => {
            const fieldMatch = line.match(/^\s*(\w+):\s*{/);
            if (fieldMatch) {
                currentField = fieldMatch[1];
            }
            if (currentField && line.includes('DataTypes.JSON')) {
                jsonFields.push(currentField);
            }
        });

        if (jsonFields.length > 0) {
            // Check if any of these fields are in indexes
            jsonFields.forEach(field => {
                if (content.includes(`name: "${field}"`) || content.includes(`name: '${field}'`)) {
                    console.log(`Potential JSON index in ${file}: field "${field}"`);
                }
            });
        }
    }
});
