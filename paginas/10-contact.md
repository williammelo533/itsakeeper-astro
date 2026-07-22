# CONTACT — `/contact/`
_Página 10 de 18 · Trust & conversion · Conversión_

---

## SEO técnico

| Campo | Valor |
|---|---|
| **URL** | `/contact/` |
| **Keyword objetivo** | Marca. NAP completo para local SEO. |
| **Title** (49) | `Contact Lisa | Book Your Tri-Cities Photo Session` |
| **Meta description** (139) | `Ready to plan your session? Tell Lisa who's in front of the camera and what this season means to you. She answers every inquiry herself.` |

### Estructura de headings

```
H1  Let's Plan Your Session
 H2  Tell Me About You            (formulario/planner)
 H2  Prefer to Call or Text?
 H2  Where I Work
 H2  What Happens After You Reach Out
```

---

## COPY

### Hero

**H1:** Let's Plan Your Session

**Subhead:** This takes less than a minute — and it's the first step toward photographs your family will keep for generations. I read and answer every inquiry myself.

### Sección 2 — Formulario

**H2:** Tell Me About You

_(Mantener el planner multi-paso actual, con estos pasos:)_

1. **Who's in front of the camera?** — Senior ✓ Family ✓ Newborn ✓ My Business ✓ Headshot ✓ _(cada opción con imagen)_
2. **What season do you picture?** — Spring / Summer / Autumn / Winter / I'm flexible. _Microcopia: "I book about four to six weeks ahead, so there's time to plan it right."_
3. **Where do you imagine it?** — Somewhere outdoors and golden / A place that's special to us / Help me choose
4. **Tell me about you** — "Who are these photos for? What moment are you hoping to keep?"
5. **Where should I reach you?** — Name, email, phone. _Microcopia: "No newsletters, no pressure — just me, calling to plan everything with you."_

**CTA:** Send it to Lisa

### Sección 3

**H2:** Prefer to Call or Text?

Sometimes it's easier to just talk. Call or text me at **(509) 948-7322** and tell me what you're dreaming up.

### Sección 4 — NAP + local

**H2:** Where I Work

**It's A Keeper Photography**
62 Canyon St, Richland, WA 99352
(509) 948-7322

I photograph outdoors throughout the Tri-Cities — Richland, Kennewick, Pasco and the surrounding countryside. Sessions happen at golden hour, at a location we choose together.

_(Embeber mapa de Google del GBP aquí — señal local fuerte.)_

### Sección 5 — Expectativas

**H2:** What Happens After You Reach Out

1. **I'll reply personally** `[PENDIENTE: plazo habitual — Q50]` — usually with a few questions about your story.
2. **We'll hop on a quick call** to plan your location, wardrobe and timing.
3. **Your date is reserved,** and all you have to do is show up and enjoy it. `[PENDIENTE: retainer/contrato — Q51]`

---

## Internal links

- Entrantes: TODAS las páginas (CTA final). Es el destino de conversión del sitio.
- Salientes: `/investment/` ("want to know what to expect first?") · `/reviews/`.

## Schema JSON-LD

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "url": "https://www.itsakeeperphotography.com/contact/",
      "about": {"@id": "https://www.itsakeeperphotography.com/#business"}
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.itsakeeperphotography.com/"},
        {"@type": "ListItem", "position": 2, "name": "Contact", "item": "https://www.itsakeeperphotography.com/contact/"}
      ]
    }
  ]
}
```

## Notas

- El formulario envía a `/thank-you/` (noindex) — permite medir conversiones en GA4/GSC.
- NAP idéntico carácter a carácter al GBP y al footer global.
