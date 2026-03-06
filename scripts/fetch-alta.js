import fetch from 'node-fetch';

const url = 'https://www.alta.com/lift-terrain-status';
const res = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; RopeDropBot/1.0; +https://github.com/jstrain16/RopeDrop)',
  },
});
if (!res.ok) throw new Error(`Failed: ${res.status}`);
const html = await res.text();

// Find all script tags content
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
const scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scripts.push(match[1]);
}

// Look for any Alta-related data
const altaScripts = scripts.filter((s) => s.includes('Alta') || s.includes('lift') || s.includes('terrain'));
console.log(`Found ${altaScripts.length} Alta-related scripts`);
altaScripts.forEach((s, i) => {
  console.log(`--- Alta script ${i} (length ${s.length}) ---`);
  console.log(s.slice(0, 2000));
  console.log('\n');
});

// Also search for direct JSON blobs
const jsonRegex = /(\{[\s\S]*?"lifts"[\s\S]*?\})/g;
let jsonMatch;
const jsons = [];
while ((jsonMatch = jsonRegex.exec(html)) !== null) {
  jsons.push(jsonMatch[1]);
}
console.log(`Found ${jsons.length} candidate JSON blobs`);
jsons.forEach((j, i) => {
  console.log(`--- JSON ${i} ---`);
  console.log(j.slice(0, 1000));
});
