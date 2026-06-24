# Aurora DS v2 tokens

Estes tokens são a referência para `app/globals.css`.

## Core

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg-base` | `#08060F` | Fundo mais escuro, gradiente fixo |
| `--bg` | `#0D0C17` | Fundo principal |
| `--surface` | `#181527` | Cards e panels |
| `--raised` | `#221E33` | Superfícies elevadas |
| `--overlay` | `#2A2540` | Overlays |
| `--ink` | `#F8F6FC` | Texto principal |
| `--ink-soft` | `#B3ADC4` | Texto secundário |
| `--ink-faint` | `#928CA8` | Texto fraco e placeholders |
| `--accent` | `#A99BD9` | CTA, link e acento principal |
| `--accent-soft` | `#ECB6D2` | Acento secundário |
| `--accent-active` | `#6F6496` | Estado ativo/pressionado |

## Aurora

| Token | Valor |
| --- | --- |
| `--aurora-warm` | `#F4B6A0` |
| `--aurora-pink` | `#C9A2D4` |
| `--aurora-blue` | `#8FA4D6` |
| `--aurora-mint` | `#7FD0C4` |

## Mood

| Token | Valor |
| --- | --- |
| `--mood-leve` | `#8FB89C` |
| `--mood-calmo` | `#9BB0D4` |
| `--mood-pesado` | `#8C8AA6` |
| `--mood-sensivel` | `#D6A48C` |
| `--mood-ansioso` | `#C4956B` |
| `--mood-neutro` | `rgba(255, 255, 255, 0.30)` |

## Spacing

Escala base de 4px:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

## Type scale

Produto fala baixo. A escala abaixo é fechada para evitar que agentes criem títulos gigantes por padrão. Ela alimenta o Product UI System e impede escala de hero em telas funcionais.

| Token | Escala | Uso |
| --- | --- | --- |
| `--type-hero` | 56-64px | Landing, manifesto e página do Design System. |
| `--type-screen-title` | 28-32px | Título principal de tela de produto, máximo um por tela. |
| `--type-mobile-title` | 24-28px | Título principal em mobile 390px. |
| `--type-section-title` | 20-24px | Seções, padrões e blocos maiores. |
| `--type-card-title` | 16-18px | Títulos dentro de cards, sheets e painéis. |
| `--type-body` | 15-16px | Texto funcional e leitura padrão. |
| `--type-small` | 13-14px | Apoio, metadados e descrições curtas. |
| `--type-meta` | 11-13px | Status, labels e navegação compacta. |
| `--type-reflection` | 18-22px | Texto reflexivo comum em Fraunces italic. |
| `--type-reflection-feature` | 24-28px | Destaque reflexivo controlado, nunca tabela, botão ou métrica. |

Regras:

- Não usar `40px+` em produto, timeline, fio, conta ou admin.
- Não usar `clamp()` com `vw` para texto funcional fora dos tokens globais.
- Títulos dentro de cards ficam em `--type-card-title`.
- Reflexão pode ter presença, mas só usa `--type-reflection-feature` quando o card inteiro é o momento principal da tela.

## Radius

| Token | Valor |
| --- | --- |
| `--r-sm` | `12px` |
| `--r-md` | `20px` |
| `--r-lg` | `28px` |
| `--r-xl` | `32px` |
| `--r-pill` | `9999px` |

## Orb canônico

O orb deve usar o componente-base real em `components/orb/Orb.tsx` quando aparecer como componente interativo, demonstração ou hero canônico. `--aurora` e `.orb-gradient` servem para assets de marca e amostras pequenas, não para recriar o componente em cada tela.

O token define a aparência, não autoriza repetição. Antes de aplicar `--aurora`, a tela deve respeitar o orçamento visual:

- logo/lockup pode carregar a assinatura;
- fora do logo, apenas um orb dominante acima de 64px por viewport;
- cards, steps, listas, badges e formulários não usam orb como ícone decorativo;
- se a função for atmosfera, preferir fitas aurora, luz difusa, estrelas, glass, swatches ou linhas.

```css
background:
  radial-gradient(circle at 28% 24%, rgba(244,182,160,.96) 0 14%, transparent 38%),
  radial-gradient(circle at 67% 25%, rgba(143,164,214,.92) 0 18%, transparent 42%),
  radial-gradient(circle at 56% 72%, rgba(244,182,160,.70) 0 13%, transparent 39%),
  radial-gradient(circle at 35% 64%, rgba(201,162,212,.62) 0 18%, transparent 43%),
  radial-gradient(circle at 62% 55%, rgba(127,208,196,.46) 0 16%, transparent 36%),
  linear-gradient(140deg, rgba(91,76,145,.94), rgba(36,32,68,.96));
```

## Motion do orb

| Token / keyframe | Duração | Estado | Regra |
| --- | --- | --- | --- |
| `breathe` | `4.8s` | `idle`, `reflecting` | Respiração lenta, sem chamar urgência. |
| `haloBreathe` | `5.4s` | luz externa | Aumenta presença sem criar outro orb. |
| `recPulse` | `2.3s` | `recording` | Rings indicam captura; não usar em cards. |
| `wave` | `0.7s` a `1.12s` | `recording` | 13 barras reagem à voz ou simulam cadência. |
| `spiralSpin` | `14s` a `22s` | `reflecting` | Rotação lenta para pensamento/processamento. |
| `exhale` | `1.8s` | `saved` | Confirmação curta, uma vez. |

Motion deve respeitar `prefers-reduced-motion`. Se uma nova superfície precisa de movimento Aurora fora do orb, use campos de luz, linhas ou aurora bands com movimento lento. Não reutilize rings, waveform ou spiral fora do componente sem uma razão de produto.
