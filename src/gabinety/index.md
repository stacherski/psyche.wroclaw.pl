---
layout: layouts/sitelayout.njk
title: Gabinety
pageTitle: Gabinety Centrum Psyche
postfix: Centrum PSYCHE Wrocław
description: Gabinet Psychologiczny, ul. Białowieska 3a/5d, 4 pietro, Wrocław. Lista specjalistów, Wykaz usług prowadzonych w gabinecie, zdjęcia gabinetów, 
isHomepage: false
eleventyNavigation:
  key: Gabinety
  parent: Psyche
eleventyImport:
  collections: ["gabinety"]
---

## Gabinety

**Białowieska 3a/5d, 54-234 Wrocław, piętro 4**

<ul>
{%- for gabinet in collections.gabinety -%}
  <li>{{ gabinet.pageTitle }}</li>
{%- endfor -%}
</ul>