import { readFileSync } from 'fs';

const content = readFileSync('src/app/components/RoomScreen.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const char of line) {
    if (char === '{') depth++;
    if (char === '}') depth--;
  }
}

console.log('Final brace depth:', depth);
console.log('Total lines:', lines.length);

// Check for common issues
const issues = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Check for unclosed style objects
  const styleMatches = line.match(/style=\{\{/g);
  if (styleMatches) {
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Line ${i+1}: Possible unclosed braces (${openBraces} open, ${closeBraces} close)`);
    }
  }
}

if (issues.length > 0) {
  console.log('\nPotential issues:');
  issues.forEach(issue => console.log(issue));
}
