# Aurora UTM Playbook

Este guia define como marcar links da Aurora para que o Founder Cockpit consiga responder, sem ambiguidade:

- de onde a pessoa veio;
- qual campanha trouxe atenção;
- qual peça gerou clique;
- quais canais viram cadastro e convite.

## Regra curta

Use sempre:

```txt
utm_source=<canal>
utm_medium=<formato>
utm_campaign=<momento>
utm_content=<peça-opcional>
```

Todos os valores devem ser em minúsculas, sem acento, sem espaço e com `_`.

Exemplo:

```txt
https://www.faleaurora.com/?utm_source=instagram&utm_medium=bio&utm_campaign=launch_waitlist&utm_content=perfil
```

## Canais oficiais

Use estes valores em `utm_source`:

```txt
instagram
whatsapp
linkedin
newsletter
facebook
threads
tiktok
youtube
x
press
partner
founder
community
```

## Formatos oficiais

Use estes valores em `utm_medium`:

```txt
bio
dm
story
post
reel
status
email
qr
referral
paid_social
organic_social
partner
pr
```

## Campanhas oficiais do lançamento

Use estes valores em `utm_campaign`:

```txt
launch_waitlist
manifesto
voice_diary
professionals
aurora_org
founder_drop
early_access
```

## Conteúdos úteis

Use `utm_content` para diferenciar peça, promessa ou local. Exemplos:

```txt
perfil
stories_01
stories_manifesto
post_oraculo
post_privacidade
cta_sala_convite
grupo_amigos
grupo_terapeutas
bio_ptbr
bio_en
```

## Links prontos

Use estes links quando quiser que tudo apareça no bloco `Campanha launch_waitlist` do Founder Cockpit.

### Instagram bio

```txt
https://www.faleaurora.com/?utm_source=instagram&utm_medium=bio&utm_campaign=launch_waitlist&utm_content=perfil
```

### Instagram stories

```txt
https://www.faleaurora.com/?utm_source=instagram&utm_medium=story&utm_campaign=launch_waitlist&utm_content=stories_01
```

### WhatsApp pessoal

```txt
https://www.faleaurora.com/?utm_source=whatsapp&utm_medium=dm&utm_campaign=launch_waitlist&utm_content=mensagem_pessoal
```

### Grupo de WhatsApp

```txt
https://www.faleaurora.com/?utm_source=whatsapp&utm_medium=dm&utm_campaign=launch_waitlist&utm_content=grupo_amigos
```

### LinkedIn post

```txt
https://www.faleaurora.com/?utm_source=linkedin&utm_medium=post&utm_campaign=launch_waitlist&utm_content=post_fundador
```

### Newsletter

```txt
https://www.faleaurora.com/?utm_source=newsletter&utm_medium=email&utm_campaign=launch_waitlist&utm_content=primeiro_convite
```

### Profissionais de saúde mental

```txt
https://www.faleaurora.com/para-terapeutas?utm_source=whatsapp&utm_medium=dm&utm_campaign=professionals&utm_content=convite_terapeutas
```

### Manifesto

```txt
https://www.faleaurora.com/manifesto?utm_source=linkedin&utm_medium=post&utm_campaign=manifesto&utm_content=a_luz_e_a_voz
```

### Manifesto dentro da campanha de lançamento

```txt
https://www.faleaurora.com/manifesto?utm_source=linkedin&utm_medium=post&utm_campaign=launch_waitlist&utm_content=manifesto_luz_voz
```

### Talk Aurora coming soon

```txt
https://www.talkaurora.com/?utm_source=instagram&utm_medium=bio&utm_campaign=coming_soon_global&utm_content=profile
```

## Bateria de teste de campanha

Antes de divulgar em volume, faça um teste rápido com os links oficiais:

1. Abra cada link em uma aba anônima.
2. Espere a página carregar e clique no CTA principal.
3. Para testar cadastro, use emails descartáveis reconhecíveis, como `aurora.launchtest+instagram@leonardocamacho.com`.
4. Espere 1 a 2 minutos.
5. Abra o Founder Cockpit e confira o bloco `Campanha launch_waitlist`.

O que deve aparecer:

```txt
Instagram bio -> canal instagram, peça perfil
Instagram stories -> canal instagram, peça stories_01
WhatsApp pessoal -> canal whatsapp, peça mensagem_pessoal
Grupo de WhatsApp -> canal whatsapp, peça grupo_amigos
LinkedIn post -> canal linkedin, peça post_fundador
```

Depois do teste, limpe os emails de teste pelo endpoint administrativo para não contaminar conversão real.

## Links para campanhas separadas

Quando a intenção for medir narrativa, profissionais ou expansão global fora do bloco `launch_waitlist`, use campanhas próprias:

```txt
https://www.faleaurora.com/manifesto?utm_source=linkedin&utm_medium=post&utm_campaign=manifesto&utm_content=a_luz_e_a_voz
https://www.faleaurora.com/para-terapeutas?utm_source=whatsapp&utm_medium=dm&utm_campaign=professionals&utm_content=convite_terapeutas
https://www.talkaurora.com/?utm_source=instagram&utm_medium=bio&utm_campaign=coming_soon_global&utm_content=profile
```

## O que não fazer

Não use variações para o mesmo canal:

```txt
ig
insta
Instagram
instagram.com
```

Use apenas:

```txt
instagram
```

Não misture campanha com formato:

```txt
utm_campaign=story
utm_medium=launch
```

O correto é:

```txt
utm_medium=story
utm_campaign=launch_waitlist
```

## Como ler no Founder Cockpit

- `source_type`: classe geral, como `campaign`, `invite`, `search`, `social`, `direct`.
- `utm_source`: canal que trouxe a pessoa.
- `utm_medium`: formato do link.
- `utm_campaign`: campanha ou momento.
- `utm_content`: peça específica.

Para decisões de lançamento, olhe nesta ordem:

1. Cadastros por campanha.
2. Cadastros por canal.
3. Cliques de CTA por página.
4. Convites gerados por fonte.
5. Pessoas confirmadas por fonte.

## Observação técnica

O backend da Aurora normaliza UTMs antes de gravar eventos. Se alguém usar `IG`, `Insta` ou `Instagram`, o dado salvo vira `instagram`. Ainda assim, os links oficiais devem seguir este guia para evitar ruído antes da normalização.
