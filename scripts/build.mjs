import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist/vendor', { recursive: true });
await cp('public', 'dist', { recursive: true });
