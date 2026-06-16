// Carrega variáveis do .env local para os testes (ex.: ANTHROPIC_API_KEY do eval),
// sem sobrescrever o que já estiver no ambiente e ignorando placeholders (<...>).
// Em CI, as chaves vêm do ambiente real e este arquivo é um no-op.
import { readFileSync } from "node:fs";

try {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!value || /^<.*>$/.test(value)) continue; // pula vazios e placeholders
    if (process.env[key] === undefined) process.env[key] = value;
  }
} catch {
  // sem .env — segue; CI provê via ambiente real.
}
