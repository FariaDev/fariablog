# Escrivaninha do Início e mesa do Sobre

Geradas com a ferramenta integrada de imagens do Codex, usando as cenas existentes da home como referência visual. A base diurna originou as duas edições de horário; cada edição iluminada originou sua versão com a luminária apagada. As cinco saídas foram inspecionadas antes da integração.

Arquivos finais da vista frontal (Início) e da vista superior (Sobre) usam fontes JPEG q95 de 1672 × 941, derivadas dos PNGs originais gerados com 1672 × 941; não há upscale. As cenas antigas de `home/`, `shelf/` e `window/` continuam com fontes de 1280 × 720. O recorte móvel preserva a luminária e uma área calma para o texto. O ponto de interação acompanha as coordenadas da imagem em `object-fit: cover`.

## Entrega e carregamento

Cada exposição inclui uma miniatura JPEG de 48 px pré-calculada pelo script e guardada no manifesto, embutida no HTML (menos de 2,5 KB por camada). Ela preenche o fundo enquanto o arquivo completo carrega, sem pedido de rede adicional, com o mesmo recorte da cena. A imagem decodificada cobre a miniatura.

`python3 scripts/build-house-avif.py` produz AVIF q60, 10 bits, em 720/1080/1280 px; as fontes novas de `desk/` e `about/` também recebem 1536 px. Requer ImageMagick com encoder AVIF. `--check` só usa Python e verifica fontes e derivados contra `data/house_images.json`; não depende de encoder no CI. Hugo copia e aplica fingerprint aos AVIFs prontos, preservando compatibilidade com 0.148.1. WebP q90 continua como fallback, com o mesmo teto nativo por fonte.

O `sizes` das cenas considera o recorte vertical de `object-fit: cover` e o bleed da cena: em paisagem reserva `110vw`; em telas mais altas reserva `1,96 × 100vh`. Assim, um telefone não escolhe uma variante de 720/1080 px para uma fotografia que está sendo ampliada pelo recorte. O navegador ainda fica limitado ao maior arquivo nativo disponível para cada cômodo.

### Comparação de resolução

Amostras codificadas das fontes JPEG q95 derivadas dos PNGs originais, com o mesmo AVIF q60/10 bits usado no site:

| cena | 1280 × 720 | 1536 × 864 | acréscimo |
| --- | ---: | ---: | ---: |
| `desk/noon` | 55.227 B (53,9 KiB) | 71.164 B (69,5 KiB) | +28,8% |
| `about/noon` | 79.865 B (78,0 KiB) | 106.794 B (104,3 KiB) | +33,7% |

O ganho de detalhe é pequeno, mas visível nos livros, veios da madeira e papel quando a cena ocupa uma tela grande ou um telefone em densidade alta. O custo do maior arquivo é cerca de 14–24 KiB por exposição; por isso 1536 px foi adotado apenas para as duas famílias que têm fonte real de 1672 px. `home/`, `shelf/` e `window/` permanecem em 1280 px, sem criar nitidez artificial.

A medição anterior à nova vista de cima comparou 45 variantes AVIF (1.473.709 bytes) com os WebP correspondentes (3.313.472 bytes): redução de 55,5%. O conjunto atual inclui também a vista superior; essa porcentagem não é uma nova medição. Cada visita baixa apenas a resolução escolhida pelo navegador. A cena ativa recebe prioridade alta; as outras duas exposições preferidas aguardam load/idle e não são aquecidas com economia de dados/2G. Exposições alternativas da luminária só são pedidas ao interagir ou restaurar a escolha da sessão.

No Sobre, o alvo de clique cobre a cúpula e a base da luminária. A luminária não tem texto visível. Botão nativo com nome acessível, estado pressionado e foco por teclado, disponível ao entardecer e à noite. A troca aguarda decode e conserva a exposição anterior sob a nova: 1,05 s para acender, 0,8 s para apagar; instantânea com movimento reduzido. Escolha salva em sessionStorage no clique, antes do carregamento, para sobreviver à navegação imediata. O retorno pelo histórico relê a escolha mais recente. Um decode antigo não substitui a escolha mais recente.

Os vaga-lumes pertencem somente à janela de Textos/ensaios: 12% de chance por sessão elegível, atraso de 8–20 s, três pontos discretos durante no máximo 11 s, sem repetição. Exigem noite, hero visível e aba ativa. Economia de dados, 2G e movimento reduzido os desativam.

## Prompts finais

### Noon — referência: home/noon.jpg

Use case: stylized-concept. Asset: a 16:9 fullscreen website interior background, noon variant. The attached image is the exact STYLE AND HOUSE reference, not the requested composition. Generate a new camera viewpoint inside THIS SAME country-house library, a more intimate writing nook for the About page. Match the reference's precise restrained cinematic, gently painterly photoreal/architectural-render aesthetic, soft natural textures, aged dark oak shelving, antique brown cloth-bound books, burgundy curtains, slightly worn cream painted four-pane sash window and the same rolling green hedged countryside. It must look like another frame from the same scene, not another style or a modern room. New composition: a modest antique dark wood writing desk and wooden desk chair, a few books and plain cream sheets of paper, one small brass desk lamp with a pleated cream fabric shade. Put the lamp near the CENTER of the image (about 54% horizontal, shade center about 53% vertical), desk in the lower half. Window with countryside to the right, bookshelves to the left. Upper-left area is darker calm shelves with low visual contrast where webpage text will later sit. Enough breathing room at bottom for typography; no text inside the image. Lamp is OFF at noon; daylight enters from right. Eye-level quiet intimate perspective, convincing furniture geometry, believable matte surfaces, no dramatic fisheye, no people, no animals, no laptops, no logos, no readable text, no particles, no added grain. Preserve the original's subdued palette and degree of realism exactly. Output one single seamless 16:9 landscape image, ideally 1536x864 or 2048x1152.

### Dusk — referências: novo noon e home/dusk.jpg

Use case: lighting-weather. Image 1 is the EXACT edit target. Image 2 is ONLY the dusk lighting and rendering-style reference. Produce one dusk version of image 1, same dimensions and framing. Change ONLY time of day and emitted lamp light: soft orange sunset sky through the window, countryside warmed by late sun, warm wood and shaded shelves, desk lamp gently switched ON with believable amber fabric shade and a restrained local pool of light on the desk. Match image 2's warm quiet dusk atmosphere without oversaturation. All architecture, camera, window muntins, curtain folds, exact furniture outlines, books, plants, vase, chair, desk, brass lamp shape/location and all other objects MUST remain pixel-registered to image 1 for a seamless crossfade. No perspective shift, no crop, no zoom, no new objects, no text, no grain, no particles, no spotlight drama. Keep details clear and painterly-photoreal in the same exact style. Preserve the subtle understated lighting.

### Midnight — referências: novo noon e home/midnight.jpg

Use case: lighting-weather. Image 1 is the EXACT edit target. Image 2 is ONLY the midnight lighting/style reference. Produce one midnight version of image 1, same dimensions and framing. Change ONLY illumination and sky: a calm deep navy night sky with a small crescent moon in the top right pane and very sparse stars; countryside is dim muted blue-green, hedges still gently discernible. The brass desk lamp is ON, warm softly luminous pleated cream shade, restrained local amber light on the papers, desk, nearby books and chair. Distant shelves stay dark but retain detail. Match image 2's exposure, mood and muted warm/cool balance. DO NOT brighten everything. All architecture, camera, window muntins, curtain folds, exact furniture outlines, books, plants, vase, chair, desk, brass lamp shape/location and all objects MUST remain pixel-registered to image 1 for a seamless crossfade. No perspective shift, crop, zoom, added objects, text, grain, particles or glow effects. Same quiet painterly-photoreal rendering and textures. One single 16:9 image.

### Dusk off — referência: novo dusk

Use case: lighting-weather. This attached image is the EXACT edit target. Make the same scene at the same dusk, but switch OFF ONLY the desk lamp. Remove the shade's internal amber glow and its local artificial illumination on the desk/papers/books, keeping the room lit naturally by the sunset window. Keep sunset sky, sun, outdoors, entire composition and every object's exact shape and position unchanged. The pleated shade should now be neutral cream in ambient dusk light, neither black nor luminous. This is a lighting-only edit for an interactive on/off switch: align every edge with the input, keep the same image dimensions, framing, camera, furniture, books, plants, curtain, chair, wood textures and style. No new objects, text or effects. Do not relight the sky or change the time of day. One image.

### Midnight off — referência: novo midnight

Use case: lighting-weather. This attached image is the EXACT edit target. Make the same midnight scene but switch OFF ONLY the desk lamp. Remove the shade's internal amber glow and its local artificial illumination on the papers, desk, chair and nearby books. The room is now lit ONLY by very faint cool moonlight from the window: dark but with enough detail to still distinguish the lamp, chair and desk. The cream shade is dim neutral grey-cream, NOT internally luminous. Keep the navy sky, crescent moon, stars, outdoors, entire composition and every object's exact shape and position unchanged. Lighting-only edit for an interactive on/off switch: align every edge with the input, keep identical dimensions, framing, camera, furniture, books, plant, vase, curtain, wood textures and painterly-photoreal style. No new objects, text or effects. No artificial light from off-camera. Do not relight the sky or change the time of day. One image.

### Janela sem reflexo — referência: window/midnight.jpg

Use case: precise-object-edit. Edit the attached image, preserving its exact 16:9 framing, camera and painterly photoreal style. This is the same window at the same midnight, but the desk lamp behind the camera has been switched OFF. Remove ONLY the warm glowing desk-lamp reflection from the LEFT glass panes, including the amber shade and its diffuse glow/reflected furniture light below it. Restore the uninterrupted cool night sky and hedged green countryside that would be visible through that small area. No luminous lamp silhouette should remain. Keep every window-frame edge, chipped cream paint, shutters, burgundy curtain and tassel, crescent moon, stars, hedges, horizon, colors and exposure elsewhere unchanged. Do not change the time of day, crop, perspective, window structure, outdoor geometry or overall brightness. No new objects, writing, effects or grain. Pixel-aligned lighting-state counterpart for a website, one image.

Arquivo: `assets/images/window/midnight-off.jpg`. Textos e ensaios usam a escolha da luminária, inclusive quando restaurados pelo histórico do navegador. A cena de entardecer existente já não contém reflexo luminoso, portanto é compartilhada pelos dois estados.


## Nova organização

A vista frontal da escrivaninha agora pertence ao Início. Sobre usa a mesma mesa vista de cima, em `assets/images/about/`, com cinco exposições. A escolha da luminária é compartilhada entre ambos e o reflexo em Textos/ensaios. A interação permanece sem texto visível; no Sobre, o alvo acompanha a base de latão.

A marca do colophon e os ícones usam `assets/brand/window.svg`. Os ícones fixos usam sua versão noturna colorida, com lua; o colophon continua acompanhando o horário local. `bash scripts/build-icons.sh` usa resvg (dependência de desenvolvimento) para preservar o degradê nos PNGs e ImageMagick para o ICO.

Os links para leitura/bibliografia mantêm âncoras nativas, foco e histórico, agora com rolagem suave. Movimento reduzido mantém a descida imediata.

## Prompts da vista superior (ferramenta integrada)

### Noon

Use case: stylized-concept. Reference image shows the EXACT country-house writing desk and style to preserve. Create another viewpoint of this SAME desk for the About page: a high, near-overhead oblique camera looking down at roughly 60 degrees, intimate close view of the tabletop. Same aged dark oak desk, antique brown/green cloth-bound books, blank cream papers on the leather writing pad, small brass cup and pleated cream-shade brass lamp. Match the original's restrained painterly-photoreal cinematic textures and muted palette exactly. The tabletop fills most of the 16:9 frame; a narrow glimpse of cream window sill and burgundy curtain can appear along the upper/right edge, but no wide room panorama. Lamp placed around 57% horizontal and 48% vertical, with desk and paper below; enough dark, calm wood in upper-left for web text. Papers lower-center/right, books near top and lower-left edges, harmonious and believable object placement, not clutter. No readable text, people, hands, logos, laptops, effects or grain. NOON: natural daylight from the right, lamp OFF. Maintain same physical brass lamp and shade design seen from above. One 16:9 landscape image.

### Dusk

Use case: lighting-weather. Exact edit target: the attached overhead writing-desk image. Change ONLY lighting to DUSK with the brass lamp switched ON: muted amber evening light from the right window and a soft warm local lamp glow on shade, brass base, desk and cream papers. Preserve this exact high camera, crop, positions, all books and their edges, vase, papers, chair, woodgrain, curtain and window. Same restrained painterly photoreal style. No new objects, no text, no perspective shift, no overall orange filter. Keep upper-left tabletop dark enough for webpage text. Pixel-aligned counterpart for an image crossfade. Same dimensions, one image.

### Midnight

Use case: lighting-weather. Exact edit target: attached overhead writing desk. Change ONLY illumination to MIDNIGHT, brass lamp ON. Very faint cool blue moonlight from right window, surrounding wood and distant books dark but detailed; warm lit pleated shade and restrained amber pool over brass base, desk and cream papers. Same exposure/mood as a quiet country-house library at night, no overall brightening. Preserve every edge, exact framing, high camera angle, furniture, papers, books, vase, curtain, window, textures and object positions. No new objects, no text, no perspective changes. Same painterly photoreal style, pixel-aligned for crossfades, one image same dimensions.

### DuskOff

Use case: lighting-weather. Exact target: attached overhead desk at dusk. Switch OFF ONLY the desk lamp. Remove internal amber emission in the shade and the artificial pool of light on brass base, books, paper and wood. Keep naturally warm but dim evening window light from the right, with a neutral unlit cream shade. Do not darken or relight the window, change time of day or change any object. Preserve exact high camera, frame, dimensions, geometry, positions, all textures and painterly-photoreal style. Pixel-aligned on/off pair for a smooth website transition. No added objects, writing or effects. One image.

### MidnightOff

Use case: lighting-weather. Exact target: attached overhead writing desk at midnight. Switch OFF ONLY the brass lamp. Remove its internal amber shade glow and all artificial warm pools on the desk, papers, brass base and nearby books. The desk is now dark but readable in very faint cool moonlight from the right window. Cream papers remain dim neutral grey-cream, the unlit shade is not luminous. Keep night window lighting, every edge, all objects, woodgrain, books, papers, vase, chair, curtain, camera angle, exact framing and dimensions unchanged. Same painterly-photoreal style. No added objects, effects, writing, or artificial light from off-camera. Pixel-aligned on/off pair. One image.
