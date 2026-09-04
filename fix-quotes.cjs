const fs = require('fs');
const path = 'src/app/components/RoomScreen.tsx';
let s = fs.readFileSync(path, 'utf8');
s = s.replace(/\u201c/g, '"');
s = s.replace(/\u201d/g, '"');
fs.writeFileSync(path, s);
console.log('Fixed curly quotes');
