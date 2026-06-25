// Keeps the isbn-lookup edge function's shared modules in sync with the app's
// canonical source (src/lib/*). The modules are pure (no RN/Deno-specific
// imports), so the same code runs in jest, in the app, and in Deno.
//
// Deno requires explicit file extensions on relative imports, while the app
// (Metro/TS) omits them — so we add `.ts` to relative imports while copying.
// Run with: pnpm sync:functions
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const dest = 'supabase/functions/isbn-lookup/_shared';
const files = ['isbn.ts', 'book.ts', 'book-parsers.ts'];

function addTsExtensions(source) {
  return source.replace(/from\s+'(\.\.?\/[^']+)'/g, (full, path) =>
    /\.[a-z]+$/i.test(path) ? full : `from '${path}.ts'`,
  );
}

mkdirSync(dest, { recursive: true });
for (const file of files) {
  const content = addTsExtensions(readFileSync(`src/lib/${file}`, 'utf8'));
  writeFileSync(`${dest}/${file}`, content);
  console.log(`synced src/lib/${file} -> ${dest}/${file}`);
}
