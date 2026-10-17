import { cp, mkdir, rm } from 'node:fs/promises';
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'main.js', 'foods.json', 'assets']) {
  await cp(new URL(`../app/${file}`, import.meta.url), new URL(file, output), { recursive: true });
}
console.log('Static app built in dist/');
