import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(root, 'dist');
const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
  throw new Error('SUPABASE_URL must be a Supabase HTTPS project origin.');
}
if (key && !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(key)) {
  throw new Error('Use a publishable client key, never a Supabase secret or service-role key.');
}
if (process.env.VERCEL_ENV === 'production' && (!url || !key)) {
  throw new Error('Production account pages require SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && /\.(html|css|js|mp4)$/.test(entry.name)) {
    await cp(resolve(root, entry.name), resolve(out, entry.name));
  }
}
for (const dir of ['assets', 'assests']) {
  await cp(resolve(root, dir), resolve(out, dir), { recursive: true });
}
await mkdir(resolve(out, 'assets/vendor'), { recursive: true });
await build({
  stdin: { contents: "export { createClient } from '@supabase/supabase-js';", resolveDir: root },
  outfile: resolve(out, 'assets/vendor/supabase.js'),
  bundle: true, minify: true, format: 'iife', globalName: 'PaseroSupabase',
  platform: 'browser', target: ['es2020'], legalComments: 'eof',
});
const config = { supabaseUrl: url, supabasePublishableKey: key, siteUrl: 'https://pasero.app' };
await writeFile(resolve(out, 'pasero-config.js'),
  `window.PASERO_CONFIG = Object.freeze(${JSON.stringify(config)});\n`);
console.log('Built static site and account pages; public client configuration only.');
