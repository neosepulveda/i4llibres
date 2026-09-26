# Els Llibres

Tauler públic de les famílies d’I4B, Escola La Mar Bella. Astro i Markdown, en català. Disseny El pati amb etiquetes de La carpeta, mode clar i fosc. El contingut es revisa i es publica manualment.

## Desenvolupament

```
bin/setup
bin/dev
bin/ci
```

Mise fixa Node 24.15.0. `bin/setup` instal·la les dependències i Chromium per a les proves. `bin/ci` comprova scripts i tipus, construeix la web i executa proves de navegador. `bin/dev` accepta arguments d’Astro, com ara `--port 4321`.

## Publicar un avís

Creeu un fitxer `.md` a `src/content/notices/` amb aquesta estructura:

```markdown
---
title: "Títol de l’avís"
description: "Resum breu que apareix a la targeta."
category: classe
order: 10
date: "2026-10-02"
note: "Més informació"
---
El text complet de l’avís, amb **Markdown** i enllaços.
```

Categories: `classe`, `escola`, `menjador`, `calendari`. `date` i `note` són opcionals. El camp `order` controla la posició: els valors més baixos apareixen primer, independentment de la categoria. Poseu al davant els avisos que requereixen una acció de les famílies. El valor per defecte és 100; els empats s’ordenen per data i després pel nom del fitxer. La data és informativa: no caduca ni retira l’avís automàticament. Per actualitzar-lo, editeu el fitxer; per retirar-lo, elimineu-lo i torneu a publicar. Git conserva l’historial públic.

No hi ha connexió amb Norman ni importació de missatges o adjunts. Només es publica el contingut escrit deliberadament en aquest repositori. Els exemples de `tests/fixtures/` són dades fictícies exclusives de les proves i no es publiquen al lloc web.

## GitHub Pages

El flux `.github/workflows/pages.yml` comprova el projecte i publica `dist/` després d’un push a `main`. Les pull requests només executen les comprovacions. El repositori públic és `neosepulveda/i4llibres`, amb **GitHub Actions** com a origen de Pages. El flux obté el domini i el subdirectori de Pages automàticament. URL del tauler: https://neosepulveda.github.io/i4llibres/

Per provar un subdirectori localment: `BASE_PATH=/i4llibres npm run build`. Feu un build normal abans d’executar les proves. Les proves de navegador construeixen còpies temporals del projecte amb contingut buit o fictici, sense modificar el tauler local.

## Enllaços de calendari opcionals

Només els avisos amb un bloc `event` mostren «Afegeix al calendari». Una data informativa no activa aquesta opció. Exemple:

```yaml
event:
  start: "2026-10-05T17:00:00+02:00"
  end: "2026-10-05T18:00:00+02:00"
  location: "Menjador de l’Escola La Mar Bella"
  description: "Reunió informativa del menjador."
```

Indiqueu el desfasament horari correcte de Barcelona per a la data: +02:00 a l’estiu, +01:00 a l’hivern. La web genera un enllaç de Google Calendar i un fitxer .ics per a Apple Calendar, Outlook i altres aplicacions. Els fitxers utilitzen UTC per conservar l’hora exacta en importar-los. Són còpies puntuals: les modificacions al tauler no actualitzen automàticament els calendaris personals.

## Imatges descarregables

Deseu les imatges a `public/downloads/` i afegiu una llista `images` al Markdown, amb `src` (p. ex. `/downloads/horari.jpg`), `title` i `alt`. Apareixen dins del detall de l’avís. La previsualització obre l’original en una pestanya nova i «Descarrega» desa el fitxer. Els enllaços incorporen automàticament el subdirectori de GitHub Pages.
