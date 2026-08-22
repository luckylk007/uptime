const fs = require('fs');
const path = require('path');
const target = process.argv[2];
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data, 'utf8');
  console.log('Successfully wrote to: ' + target);
});
