const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('apispec.json'));
function dump(obj, depth = 0) {
    if (depth > 5) return '...';
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(x => dump(x, depth + 1));
    const result = {};
    for (const key in obj) {
        if (key === '$ref') {
            const defName = obj[key].split('/').pop();
            return dump(spec.definitions[defName], depth + 1);
        }
        result[key] = dump(obj[key], depth + 1);
    }
    return result;
}

const response = spec.paths['/api/doctor/{doctor_id}/patients'].get.responses['200'];
console.log(JSON.stringify(dump(response), null, 2));
