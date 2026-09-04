import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/app/components/RoomScreen.tsx', 'utf8');
const lines = content.split('\n');

// Find the chat panel section and comment it out
const chatStart = lines.findIndex(l => l.includes('{/* Right: Chat panel */}'));
const searchStart = lines.findIndex(l => l.includes('{searchOpen && (') && l.trim() === '{searchOpen && (');

if (chatStart !== -1 && searchStart !== -1) {
  for (let i = chatStart; i < searchStart; i++) {
    if (!lines[i].trim().startsWith('//')) {
      lines[i] = '// ' + lines[i];
    }
  }
  writeFileSync('src/app/components/RoomScreen.tsx', lines.join('\n'));
  console.log('Commented out chat panel');
} else {
  console.log('Could not find chat panel section');
}
