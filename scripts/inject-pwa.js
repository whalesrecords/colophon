#!/usr/bin/env node
/**
 * Post-build step for the web export. Expo SDK 56's `output: "single"` web build
 * emits a fixed index.html shell and ignores `+html.tsx`, so it never links the
 * PWA manifest. We serve the manifest + icons from public/ and inject the head
 * tags here so the site is installable (Mac Dock, iOS/iPad home screen, desktop
 * Chrome/Edge). Idempotent. Runs in vercel.json's buildCommand after `expo export`.
 */
const fs = require('fs');
const path = require('path');

const dist = process.argv[2] || 'dist';
const file = path.join(process.cwd(), dist, 'index.html');

let html = fs.readFileSync(file, 'utf8');

if (html.includes('rel="manifest"')) {
  console.log('[inject-pwa] manifest link already present — skipping');
  process.exit(0);
}

const tags = [
  '<link rel="manifest" href="/manifest.webmanifest" />',
  '<meta name="theme-color" content="#2B3A55" />',
  '<meta name="application-name" content="Colophon" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="Colophon" />',
  '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />',
].join('\n    ');

html = html.replace('<html lang="en">', '<html lang="fr">');
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);
html = html.replace('</head>', `    ${tags}\n  </head>`);

fs.writeFileSync(file, html);
console.log('[inject-pwa] PWA head tags injected into ' + dist + '/index.html');
