import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

// GitHub Pages serves 404.html for unknown paths. Reusing the app shell lets
// React Router resolve deep links such as /mannerbund/mapa on a hard refresh.
await copyFile(join(dist, 'index.html'), join(dist, '404.html'));
