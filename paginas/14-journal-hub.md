# JOURNAL HUB — `/journal/`
_Página 14 de 18 · Content engine · Hub_

---

## SEO técnico

| Campo | Valor |
|---|---|
| **URL** | `/journal/` |
| **Keyword objetivo** | Ninguna primaria (hub de distribución de autoridad) |
| **Title** (48) | `Photography Journal | Tips & Locations From Lisa` |
| **Meta description** (147) | `First-hand planning advice from a Tri-Cities photographer — when to book, where to go, what to wear, and how to get photographs worth keeping forever.` |

### Estructura de headings

```
H1  The Journal
 H2  Planning Guides                  (listado de posts)
 H2  Start With Your Session          (CTA)
```

---

## COPY

### Hero

**H1:** The Journal

**Subhead:** Twenty years of Tri-Cities sessions have taught me a few things — when to book, where the light falls, what to wear, and how to make the whole thing feel easy. I write it all down here, so you can plan like an insider.

### Sección 2 — Listado

**H2:** Planning Guides

_(Cards de los 4 posts; cada card = imagen + título + extracto + link. Orden por relevancia estacional, editable.)_

1. **12 Best Places to Take Pictures in the Tri-Cities, WA** — Where the light falls in Richland, Kennewick and Pasco, from a photographer who's chased it for twenty years. → `/journal/family-photo-locations-tri-cities/`
2. **When to Take Senior Pictures: A Tri-Cities Timeline** — The honest answer to "is it too late?", plus the booking calendar nobody tells you about. → `/journal/when-to-book-senior-pictures-tri-cities/`
3. **In-Home vs. Studio Newborn Photography** — An honest comparison to help you choose what's right for your family's first days. → `/journal/in-home-vs-studio-newborn-photography/`
4. **Branding Photos vs. Headshots: What Your Business Actually Needs** — The difference, the overlap, and how to decide where to start. → `/journal/branding-photos-vs-headshots/`

### Sección 3 — CTA

**H2:** Start With Your Session
Reading is planning — but the light won't wait forever.
**CTA:** Let's plan yours → `/contact/`

---

## Internal links

- Entrantes: Home (nav "Journal"), footer global.
- Salientes: los 4 posts + `/contact/`.

## Schema JSON-LD

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "name": "Photography Journal",
      "url": "https://www.itsakeeperphotography.com/journal/",
      "about": {"@id": "https://www.itsakeeperphotography.com/#business"}
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.itsakeeperphotography.com/"},
        {"@type": "ListItem", "position": 2, "name": "Journal", "item": "https://www.itsakeeperphotography.com/journal/"}
      ]
    }
  ]
}
```

## Nota de crecimiento

El hub está diseñado para crecer: cada nuevo post debe (1) responder una pregunta real de clientes (Q60 cuando Lisa la responda), (2) apuntar a UNA página comercial, y (3) demostrar conocimiento de primera mano (fotos propias, locaciones concretas, anécdotas). Ideas futuras: "What to wear for family photos" · "Tri-Cities golden hour calendar by month" · "How to prepare toddlers for a photo session".
