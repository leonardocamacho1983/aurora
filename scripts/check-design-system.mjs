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
  "app/design-system/_shared.tsx",
  "app/design-system/page.tsx",
  "app/design-system/fundamentos/page.tsx",
  "app/design-system/biblioteca/page.tsx",
  "app/design-system/patterns/page.tsx",
  "app/design-system/roadmap/page.tsx",
  "app/design-system/referencia/page.tsx",
  "app/design-system/DesignSystem.module.css",
  "components/ui/Button.tsx",
  "components/ui/IconButton.tsx",
  "components/ui/CardSurface.tsx",
  "components/ui/Panel.tsx",
  "components/ui/Chip.tsx",
  "components/ui/SegmentedTabs.tsx",
  "components/ui/SegmentedTabs.module.css",
  "components/ui/index.ts",
  "components/product/ReflectionCard.tsx",
  "components/product/TimelineEntryCard.tsx",
  "components/product/ThreadCard.tsx",
  "components/product/ContinueThreadButton.tsx",
  "components/product/FlipCard.tsx",
  "components/product/FlipCard.module.css",
  "components/product/StreamingText.tsx",
  "components/product/BottomNav.tsx",
  "components/product/EmptyState.tsx",
  "components/product/FeedbackMicro.tsx",
  "components/product/PrivacyChip.tsx",
  "components/product/StateComponents.module.css",
  "components/product/index.ts",
  "components/patterns/DiaryCapturePattern.tsx",
  "components/patterns/ReflectionResultPattern.tsx",
  "components/patterns/TimelineListPattern.tsx",
  "components/patterns/OpenThreadPattern.tsx",
  "components/patterns/EmptyThreadPattern.tsx",
  "components/patterns/Patterns.module.css",
  "components/patterns/responsive/responsive-pattern-config.ts",
  "components/patterns/responsive/ResponsivePatternFrame.tsx",
  "components/patterns/responsive/PatternControls.tsx",
  "components/patterns/responsive/ResponsivePatternLab.tsx",
  "components/patterns/responsive/ResponsivePatterns.module.css",
  "components/patterns/responsive/index.ts",
  "components/patterns/index.ts",
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
  "--type-hero",
  "--type-screen-title",
  "--type-mobile-title",
  "--type-section-title",
  "--type-card-title",
  "--type-body",
  "--type-meta",
  "--type-reflection",
  "--type-reflection-feature",
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
  "Product UI System",
  "A tela nasce da camada certa.",
  "Biblioteca de Componentes",
  "Peças prontas para montar telas.",
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
  "IconButton",
  "CardSurface",
  "Panel",
  "OrbControl",
  "ReflectionCard",
  "TimelineEntryCard",
  "ThreadCard",
  "ContinueThreadButton",
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

const requiredTypeGuardrails = [
  "--type-screen-title",
  "--type-card-title",
  "--type-reflection",
  "escala de hero",
  "40px+",
  "Product UI System",
];

const requiredTypographyGuardrails = requiredTypeGuardrails.filter((phrase) => phrase !== "Product UI System");

const requiredRoutes = [
  "/design-system",
  "/design-system/fundamentos",
  "/design-system/biblioteca",
  "/design-system/patterns",
  "/design-system/referencia",
  "/design-system/roadmap",
];

const hubPhrases = [
  "Um hub para criar telas sem perder a identidade.",
  "A página principal fica curta.",
  "Fundamentos",
  "Biblioteca de Componentes",
  "Patterns de Tela",
  "Referência Completa",
  "Roadmap",
  "Regras críticas",
  "Migração vem depois dos patterns.",
  "Fase 4",
];

const fundamentalsPhrases = [
  "Base visual antes de componente.",
  "Crepúsculo como padrão. Amanhecer como abertura.",
  "O tamanho serve o conteúdo.",
  "O que a escala bloqueia.",
];

const libraryPhrases = [
  "Peças prontas para montar telas.",
  "Filtros de leitura",
  "Fase 2B pronta",
  "Fase 2B.1 pronta",
  "Fase 2C pronta",
  "Componentes reais, não só inventário.",
  "FlipCard como comportamento de produto.",
  "Estados, navegação e feedback de IA.",
  "Pronto 2B",
  "Pronto 2B.1",
  "Pronto 2C",
  "Biblioteca operacional.",
];

const roadmapPhrases = [
  "O encaixe dos próximos passos.",
  "Da organização à migração real.",
  "Fase 2B",
  "Concluída",
  "Fase 2B.1",
  "FlipCard como comportamento de card",
  "Fase 2C",
  "Concluída",
  "Fase 3",
  "Concluída",
  "Fase 3.1",
  "Responsive Screen Lab",
  "Fase 4",
  "Próxima",
  "Codificar a biblioteca mínima",
  "Completar estados e interação",
  "Criar patterns de tela",
  "Migrar telas reais em ondas",
];

const patternsPhrases = [
  "Responsive Screen Lab para montar telas complexas.",
  "Fase 3.1 pronta",
  "Patterns montam telas; pages coordenam dados.",
  "Mobile",
  "Tablet",
  "Desktop",
  "Diário começa sem botões",
  "Timeline usa FlipCard como padrão",
  "tipografia muda por área",
];

const phase2BFiles = [
  "components/ui/Button.tsx",
  "components/ui/IconButton.tsx",
  "components/ui/CardSurface.tsx",
  "components/ui/Panel.tsx",
  "components/ui/Chip.tsx",
  "components/product/ReflectionCard.tsx",
  "components/product/TimelineEntryCard.tsx",
  "components/product/ThreadCard.tsx",
  "components/product/ContinueThreadButton.tsx",
  "components/product/FlipCard.tsx",
];

const phase2CFiles = [
  "components/ui/SegmentedTabs.tsx",
  "components/product/StreamingText.tsx",
  "components/product/BottomNav.tsx",
  "components/product/EmptyState.tsx",
  "components/product/FeedbackMicro.tsx",
  "components/product/PrivacyChip.tsx",
];

const phase3Files = [
  "components/patterns/DiaryCapturePattern.tsx",
  "components/patterns/ReflectionResultPattern.tsx",
  "components/patterns/TimelineListPattern.tsx",
  "components/patterns/OpenThreadPattern.tsx",
  "components/patterns/EmptyThreadPattern.tsx",
];

const phase31Files = [
  "components/patterns/responsive/responsive-pattern-config.ts",
  "components/patterns/responsive/ResponsivePatternFrame.tsx",
  "components/patterns/responsive/PatternControls.tsx",
  "components/patterns/responsive/ResponsivePatternLab.tsx",
  "components/patterns/responsive/ResponsivePatterns.module.css",
  "components/patterns/responsive/index.ts",
];

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
  for (const phrase of ["Fraunces", "Inter", "prefers-reduced-motion", "/design-system", "/design-system/biblioteca", "/design-system/referencia", "reference.md", "component-inventory.md", "ui-ux-creation-brief.md"]) {
    if (!guardrail.includes(phrase)) warnings.push(`Design-system guardrail does not mention ${phrase}.`);
  }
  assertEvery("docs/agent-guardrails/design-system.md", guardrail, requiredTypeGuardrails);
  assertEvery("docs/agent-guardrails/design-system.md", guardrail, [
    "Fase 3.1",
    "Responsive Screen Lab",
    "mobile, tablet e desktop",
    "não são versões reduzidas",
    "Diário no lab começa sem botões",
    "Timeline no lab usa `FlipCard` como padrão",
    "Controles do lab precisam ser navegáveis",
    "Tipografia por área no lab usa presets fechados",
  ]);
}

if (existsSync(path.join(root, "app/design-system/page.tsx"))) {
  const page = read("app/design-system/page.tsx");
  assertEvery("app/design-system/page.tsx", page, hubPhrases);
  assertEvery("app/design-system/page.tsx", page, requiredRoutes);
}

if (existsSync(path.join(root, "app/design-system/fundamentos/page.tsx"))) {
  const fundamentals = read("app/design-system/fundamentos/page.tsx");
  assertEvery("app/design-system/fundamentos/page.tsx", fundamentals, fundamentalsPhrases);
  assertEvery("app/design-system/fundamentos/page.tsx", fundamentals, requiredTypographyGuardrails);
}

if (existsSync(path.join(root, "app/design-system/biblioteca/page.tsx"))) {
  const library = read("app/design-system/biblioteca/page.tsx");
  assertEvery("app/design-system/biblioteca/page.tsx", library, libraryPhrases);
  assertEvery("app/design-system/biblioteca/page.tsx", library, requiredComponents.filter((component) => component !== "Orb" && component !== "DataTable"));
  assertEvery("app/design-system/biblioteca/page.tsx", library, requiredOrbStates);
  for (const sourceFile of phase2BFiles) {
    assertIncludes("app/design-system/biblioteca/page.tsx", library, sourceFile.split("/").at(-1)?.replace(".tsx", "") ?? sourceFile);
  }
  for (const sourceFile of phase2CFiles) {
    assertIncludes("app/design-system/biblioteca/page.tsx", library, sourceFile.split("/").at(-1)?.replace(".tsx", "") ?? sourceFile);
  }
}

if (existsSync(path.join(root, "app/design-system/patterns/page.tsx"))) {
  const patterns = read("app/design-system/patterns/page.tsx");
  assertEvery("app/design-system/patterns/page.tsx", patterns, patternsPhrases);
}

if (existsSync(path.join(root, "components/patterns/responsive/responsive-pattern-config.ts"))) {
  const responsiveConfig = read("components/patterns/responsive/responsive-pattern-config.ts");
  assertEvery("components/patterns/responsive/responsive-pattern-config.ts", responsiveConfig, [
    "Mobile",
    "Tablet",
    "Desktop",
    "DiaryCapturePattern",
    "ReflectionResultPattern",
    "TimelineListPattern",
    "OpenThreadPattern",
    "EmptyThreadPattern",
    "with-flip",
    "no-flip",
    "continue-thread",
    "Sem botões",
    "Textura",
    "typographyOptions",
    "Produto",
    "Editorial",
    "Compacta",
  ]);
}

if (existsSync(path.join(root, "app/design-system/roadmap/page.tsx"))) {
  const roadmap = read("app/design-system/roadmap/page.tsx");
  assertEvery("app/design-system/roadmap/page.tsx", roadmap, roadmapPhrases);
}

if (existsSync(path.join(root, "app/design-system/referencia/page.tsx"))) {
  const referencePage = read("app/design-system/referencia/page.tsx");
  assertEvery("app/design-system/referencia/page.tsx", referencePage, parityPhrases);
  assertEvery("app/design-system/referencia/page.tsx", referencePage, requiredComponents);
  assertEvery("app/design-system/referencia/page.tsx", referencePage, requiredOrbStates);
  assertEvery("app/design-system/referencia/page.tsx", referencePage, requiredTypeGuardrails);
}

if (existsSync(path.join(root, "docs/design-system/reference.md"))) {
  const reference = read("docs/design-system/reference.md");
  assertEvery("docs/design-system/reference.md", reference, requiredRoutes);
  assertEvery("docs/design-system/reference.md", reference, parityPhrases);
  assertEvery("docs/design-system/reference.md", reference, requiredComponents);
  assertEvery("docs/design-system/reference.md", reference, requiredOrbStates);
  assertEvery("docs/design-system/reference.md", reference, requiredTypeGuardrails);
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
  assertEvery("docs/design-system/component-inventory.md", inventory, [
    "Product UI System",
    "components/ui",
    "components/product",
    "components/patterns",
    "/design-system/biblioteca",
    "/design-system/patterns",
    "Fase 2B implementada",
    "Fase 2B.1 implementada",
    "Fase 2C implementada",
    "Fase 3 implementada",
    "Fase 3.1 implementada",
    "Responsive Screen Lab",
    "Diário usa a experiência de produção",
    "Timeline usa `FlipCard` como padrão",
    "controles do laboratório devem ser navegáveis",
    "tipografia por área usa presets fechados",
    "Fase 4",
  ]);
  assertEvery("docs/design-system/component-inventory.md", inventory, phase2BFiles);
  assertEvery("docs/design-system/component-inventory.md", inventory, phase2CFiles);
  assertEvery("docs/design-system/component-inventory.md", inventory, phase3Files);
  assertEvery("docs/design-system/component-inventory.md", inventory, phase31Files);
}

if (existsSync(path.join(root, "docs/design-system/ui-ux-creation-brief.md"))) {
  const brief = read("docs/design-system/ui-ux-creation-brief.md");
  for (const phrase of [
    "Classifique a superfície antes de desenhar",
    "Product UI System",
    "Regra do orb",
    "Escolha de componentes",
    "Layout por breakpoint",
    "Critério de rejeição",
    "Handoff esperado",
    "Responsive Screen Lab",
    "Mobile, tablet e desktop não são versões reduzidas",
    "DiaryCapturePattern` começa como a produção atual",
    "TimelineListPattern` usa `FlipCard` como padrão",
    "controles do Responsive Screen Lab devem ser divididos por seção",
    "tipografia por área do laboratório usa presets fechados",
  ]) {
    assertIncludes("docs/design-system/ui-ux-creation-brief.md", brief, phrase);
  }
  assertEvery("docs/design-system/ui-ux-creation-brief.md", brief, requiredTypeGuardrails);
}

if (existsSync(path.join(root, "docs/design-system/tokens.md"))) {
  const tokens = read("docs/design-system/tokens.md");
  assertEvery("docs/design-system/tokens.md", tokens, requiredTypeGuardrails);
}

if (existsSync(path.join(root, "docs/design-system/qa-checklist.md"))) {
  const qa = read("docs/design-system/qa-checklist.md");
  assertEvery("docs/design-system/qa-checklist.md", qa, requiredTypeGuardrails);
  assertEvery("docs/design-system/qa-checklist.md", qa, requiredRoutes);
  assertEvery("docs/design-system/qa-checklist.md", qa, [
    "Responsive Screen Lab",
    "mobile, tablet e desktop",
    "não é só escala",
    "Diário no laboratório começa sem botões",
    "Timeline no laboratório usa FlipCard como padrão",
    "Controles do Responsive Screen Lab não se sobrepõem",
    "Tipografia por área no laboratório usa apenas presets fechados",
  ]);
}

const textFilesToReview = requiredFiles.filter((file) => file.endsWith(".md") || file.endsWith(".tsx"));
const unaccentedPortuguese = [
  [/\bnao\b/i, "não"],
  [/\bvoce\b/i, "você"],
  [/\bdiagnostico\b/i, "diagnóstico"],
  [/\burgencia\b/i, "urgência"],
  [/(?<!\/)\bdiario\b/i, "diário"],
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
