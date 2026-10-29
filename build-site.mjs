import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(root, 'dist');
if (dirname(output) !== root || (existsSync(output) && lstatSync(output).isSymbolicLink())) {
  throw new Error('Unexpected build output directory');
}
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
const extensions = new Set(['.html', '.css', '.js', '.mp4', '.svg']);
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && !entry.name.endsWith('.original.html') &&
      (extensions.has(extname(entry.name)) || entry.name === 'release-manifest.json')) {
    cpSync(join(root, entry.name), join(output, entry.name));
  }
}
for (const directory of ['assets', 'assests']) {
  if (existsSync(join(root, directory))) {
    cpSync(join(root, directory), join(output, directory), { recursive: true });
  }
}
for (const required of ['download.html', 'release-downloads.js', 'release-manifest.json', 'download-android-qr.svg']) {
  if (!existsSync(join(output, required))) throw new Error('Missing download asset: ' + required);
}
console.log('Static site built with download manifest and QR code.');
