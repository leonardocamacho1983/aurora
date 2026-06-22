# Aurora Brand System v1

Este kit organiza os assets visuais da Aurora para uso em produto, landing, social, apresentações e opt-ins. A fonte de verdade continua sendo a assinatura que já aparece no site: orb circular em degradê Aurora + wordmark Fraunces.

## Princípios

- A marca principal é simples: orb + Aurora. Não adicionar ondas, mascotes, símbolos paralelos ou molduras decorativas ao lockup.
- O orb pode crescer e virar key visual, mas a logo pequena deve permanecer limpa.
- A versão clara é para fundos escuros. A versão escura é para fundos claros.
- Monocromático é para casos de baixo contraste, gravação, marca d'água, favicon contextual ou sistemas que não aceitam degradê.
- Opt-ins seguem o padrão da waitlist atual: pedir apenas email, prometer acesso antecipado, indicar confirmação por email e reforçar "sem spam".
- Estes assets não mudam banco, API, PostHog, Resend, double opt-in ou fluxo de indicação.

## Logos

Arquivos principais:

- `public/brand/aurora-logo.svg`: canonical para fundo escuro.
- `public/brand/aurora-logo-horizontal.svg`: horizontal em degradê, texto claro.
- `public/brand/aurora-logo-horizontal-light.svg`: horizontal, texto claro.
- `public/brand/aurora-logo-horizontal-dark.svg`: horizontal, texto escuro.
- `public/brand/aurora-logo-stacked-light.svg`: empilhada, texto claro.
- `public/brand/aurora-logo-stacked-dark.svg`: empilhada, texto escuro.
- `public/brand/aurora-icon.svg`: orb icon-only.
- `public/brand/aurora-favicon.svg`: favicon SVG.

Novas variações:

- Monocromáticas: `aurora-logo-monochrome-light.svg`, `aurora-logo-monochrome-dark.svg`, `aurora-icon-monochrome-light.svg`, `aurora-icon-monochrome-dark.svg`.
- Invertidas: `aurora-logo-inverted-light.svg`, `aurora-logo-inverted-dark.svg`.
- Cromáticas controladas: `aurora-logo-twilight.svg`, `aurora-logo-dawn.svg`, `aurora-logo-mist.svg` e respectivos `aurora-icon-*`.

Uso recomendado:

- `twilight`: telas escuras, app, diário, contexto noturno.
- `dawn`: lançamento, boas-vindas, confirmação de email, momentos mais humanos.
- `mist`: documentos, apresentações, fundos claros e peças editoriais.

## Biblioteca visual

Gradientes:

- `public/brand/gradients/aurora-canonical.svg`
- `public/brand/gradients/dawn-warm.svg`
- `public/brand/gradients/twilight-deep.svg`
- `public/brand/gradients/mist-light.svg`

Texturas transparentes:

- `public/brand/textures/grain-subtle.svg`
- `public/brand/textures/rings.svg`
- `public/brand/textures/star-noise.svg`
- `public/brand/textures/soft-horizon.svg`

Key visuals:

- `public/brand/key-visuals/orb-rings.svg`: orb grande com anéis e waveform.
- `public/brand/key-visuals/orb-clean.svg`: orb grande sem elementos extras.
- `public/brand/key-visuals/waveform.svg`: fala/voz como elemento central.
- `public/brand/key-visuals/dawn-field-hero.svg`: fundo hero de amanhecer.
- `public/brand/key-visuals/social-og-frame.svg`: frame social 1200x630.

## Banners, cards e opt-ins

Foram criadas três direções em `public/brand/directions/`:

- `calma`: escura, silenciosa, próxima da landing atual.
- `editorial`: clara, institucional, boa para docs e posts.
- `produto`: escura e mais funcional, boa para features e convites.

Cada direção inclui:

- `banner-horizontal.svg`
- `card-1200x630.svg`
- `card-1080x1080.svg`
- `story-1080x1920.svg`
- `optin-mockup.svg`

Os opt-ins são mockups visuais. Para produção, manter o `WaitlistForm` atual e usar estes arquivos como referência de layout, densidade e hierarquia.

## Motion CSS

Arquivo: `public/brand/aurora-brand.css`.

Classes disponíveis:

```html
<link rel="stylesheet" href="/brand/aurora-brand.css" />

<div class="aurora-brand-lockup">
  <span class="aurora-brand-orb aurora-motion-breath aurora-motion-slow-glow"></span>
  <span class="aurora-brand-wordmark">Aurora</span>
</div>

<span class="aurora-brand-orb aurora-motion-signal-rings"></span>

<span class="aurora-waveform">
  <span style="--bar-height: 12px"></span>
  <span style="--bar-height: 26px"></span>
  <span style="--bar-height: 44px"></span>
  <span style="--bar-height: 26px"></span>
  <span style="--bar-height: 12px"></span>
</span>
```

Todas as animações respeitam `prefers-reduced-motion`.

## Paleta

- Crepúsculo: `#08060F`, `#181527`, `#2A2032`
- Texto claro: `#F8F6FC`, `#F0ECF7`, `#B3ADC4`
- Texto escuro: `#26233A`, `#5E5872`
- Aurora: `#F4B6A0`, `#C9A2D4`, `#8FA4D6`, `#7FD0C4`
- Acentos: `#A99BD9`, `#ECB6D2`

## Não fazer

- Não distorcer o orb em elipse.
- Não trocar o wordmark por fonte sans.
- Não usar o orb com fundo quadrado embutido.
- Não adicionar iconografia clínica, médica ou de emergência.
- Não prometer terapia, diagnóstico, tratamento ou suporte emergencial em banners ou opt-ins.
- Não coletar telefone, nome ou resposta aberta em opt-ins de aquisição sem uma decisão de produto separada.
