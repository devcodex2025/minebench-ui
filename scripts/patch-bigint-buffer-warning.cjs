const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'node_modules', 'bigint-buffer', 'dist', 'node.js');
if (!fs.existsSync(file)) {
  throw new Error(`bigint-buffer entrypoint not found: ${file}`);
}

const source = fs.readFileSync(file, 'utf8');
const warning = "console.warn('bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)');";
const replacement = "if (process.env.BIGINT_BUFFER_DEBUG) console.warn('bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)');";

if (source.includes(warning)) {
  fs.writeFileSync(file, source.replace(warning, replacement));
}
