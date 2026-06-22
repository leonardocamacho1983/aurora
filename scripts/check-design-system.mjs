import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const requiredFiles = [
  "docs/agent-guardrails/README.md",
  "docs/agent-guardrails/design-system.md",
  "docs/design-system/index.md",
  "docs/design-system/reference.md",
  "docs/design-system/component-inventory.md",
  "docs/design-system/ui-ux-creation-brief.md",
  "docs/design-system/tokens.md",
  "docs/design-system/qa-checklist.md",
  "app/design-system/page.tsx",
  "app/design-system/DesignSystem.module.css",
];

const requiredTokens = [
  "--bg-base",
  "--bg",
  "--surface",
  "--raised",
  "--overlay",
  "--ink",
  "--ink-soft",
  "--ink-faint",
  "--aurora-warm",
  "--aurora-pink",
  "--aurora-blue",
  "--aurora-mint",
  "--accent",
  "--accent-soft",
  "--hairline",
  "--glass-bg",
  "--shadow-panel",
  "--aurora",
];

const failures = [];
const warnings = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file))) failures.push(`Missing required file: ${file}`);
}

const parityPhrases = [
  "Entre no universo visual da Aurora.",
  "Um sistema íntimo, escuro e luminoso para escutar com calma.",
  "Crepúsculo como padrão. Amanhecer como abertura.",
  "O tamanho serve o conteúdo.",
  "Componentes com intenção. Cada um no seu lugar.",
  "Orbes animadas, estados e orçamento visual.",
  "A mesma marca, densidades diferentes.",
  "Exemplos em produto real, não mockup descartável.",
  "Aurora fala com calma. Nunca com urgência.",
  "Um orb. Quatro contextos. Zero distorções.",
  "IA, crescimento, privacidade e navegação.",
  "Três composições. Uma mesma identidade.",
  "A fala do usuário e a devolutiva da Aurora, frente e verso.",
  "Cada ação tem um botão certo.",
  "Movimento é respiração, não performance.",
  "Abstrato, luminoso, nunca literal.",
  "O produto responde com calma.",
  "Regras que agentes devem obedecer.",
  "Antes de publicar, compare.",
];

const requiredComponents = [
  "Orb",
  "Button",
  "Panel",
  "ReflectionCard",
  "TimelineEntryCard",
  "SegmentedTabs",
  "DataTable",
  "StreamingText",
  "BottomNav",
  "EmptyState",
  "WaitlistBlock",
  "FeedbackMicro",
  "PrivacyChip",
  "FlipCard",
];

const requiredOrbStates = ["idle", "recording", "reflecting", "saved", "disabled"];

function assertIncludes(relativePath, content, phrase) {
  if (!content.includes(phrase)) failures.push(`${relativePath} is missing required DS phrase: ${phrase}`);
}

function assertEvery(relativePath, content, phrases) {
  for (const phrase of phrases) assertIncludes(relativePath, content, phrase);
}

if (existsSync(path.join(root, "app/globals.css"))) {
  const globals = read("app/globals.css");
  for (const token of requiredTokens) {
    if (!globals.includes(token)) failures.push(`Missing global DS token: ${token}`);
  }
  if (!globals.includes("docs/agent-guardrails/design-system.md")) {
    warnings.push("app/globals.css does not point to the design-system guardrail.");
  }
} else {
  failures.push("Missing app/globals.css");
}

if (existsSync(path.join(root, ".env.example"))) {
  const envExample = read(".env.example");
  if (!envExample.includes("DESIGN_SYSTEM_ADMIN_TOKEN")) {
    failures.push("Missing DESIGN_SYSTEM_ADMIN_TOKEN in .env.example");
  }
} else {
  warnings.push("No .env.example found to document DESIGN_SYSTEM_ADMIN_TOKEN.");
}

if (existsSync(path.join(root, "docs/agent-guardrails/design-system.md"))) {
  const guardrail = read("docs/agent-guardrails/design-system.md");
  for (const phrase of ["Fraunces", "Inter", "prefers-reduced-motion", "/design-system", "reference.md", "component-inventory.md", "ui-ux-creation-brief.md"]) {
    if (!guardrail.includes(phrase)) warnings.push(`Design-system guardrail does not mention ${phrase}.`);
  }
}

if (existsSync(path.join(root, "app/design-system/page.tsx"))) {
  const page = read("app/design-system/page.tsx");
  assertEvery("app/design-system/page.tsx", page, parityPhrases);
  assertEvery("app/design-system/page.tsx", page, requiredComponents.filter((component) => component !== "FlipCard"));
  assertEvery("app/design-system/page.tsx", page, requiredOrbStates);
}

if (existsSync(path.join(root, "docs/design-system/reference.md"))) {
  const reference = read("docs/design-system/reference.md");
  assertEvery("docs/design-system/reference.md", reference, parityPhrases);
  assertEvery("docs/design-system/reference.md", reference, requiredComponents);
  assertEvery("docs/design-system/reference.md", reference, requiredOrbStates);
  for (const sourceFile of [
    "docs/design-system/component-inventory.md",
    "docs/design-system/ui-ux-creation-brief.md",
    "docs/design-system/tokens.md",
    "docs/design-system/qa-checklist.md",
    "docs/agent-guardrails/design-system.md",
  ]) {
    assertIncludes("docs/design-system/reference.md", reference, sourceFile);
  }
}

if (existsSync(path.join(root, "docs/design-system/component-inventory.md"))) {
  const inventory = read("docs/design-system/component-inventory.md");
  assertEvery("docs/design-system/component-inventory.md", inventory, requiredComponents);
  assertEvery("docs/design-system/component-inventory.md", inventory, requiredOrbStates);
}

if (existsSync(path.join(root, "docs/design-system/ui-ux-creation-brief.md"))) {
  const brief = read("docs/design-system/ui-ux-creation-brief.md");
  for (const phrase of [
    "Classifique a superfície antes de desenhar",
    "Regra do orb",
    "Escolha de componentes",
    "Layout por breakpoint",
    "Critério de rejeição",
    "Handoff esperado",
  ]) {
    assertIncludes("docs/design-system/ui-ux-creation-brief.md", brief, phrase);
  }
}

const textFilesToReview = requiredFiles.filter((file) => file.endsWith(".md") || file === "app/design-system/page.tsx");
const unaccentedPortuguese = [
  [/\bnao\b/i, "não"],
  [/\bvoce\b/i, "você"],
  [/\bdiagnostico\b/i, "diagnóstico"],
  [/\burgencia\b/i, "urgência"],
  [/\bdiario\b/i, "diário"],
  [/\bpadrao\b/i, "padrão"],
  [/\bproximo\b/i, "próximo"],
  [/\bacao\b/i, "ação"],
  [/\bsecoes\b/i, "seções"],
  [/\bsuperficie\b/i, "superfície"],
];

for (const file of textFilesToReview) {
  if (!existsSync(path.join(root, file))) continue;
  const content = read(file);
  for (const [pattern, expected] of unaccentedPortuguese) {
    if (pattern.test(content)) failures.push(`${file} contains an unaccented Portuguese term; expected ${expected}.`);
  }
}

for (const warning of warnings) {
  console.warn(`warn: ${warning}`);
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`error: ${failure}`);
  }
  process.exit(1);
}

console.log("Design system structure OK.");
