# REVIEWS — `/reviews/`
_Página 9 de 18 · Trust & conversion · Proof_

> `[PENDIENTE CRÍTICO: Q47 — selección de 8–12 reseñas reales de Google con permiso/nombres. La estructura queda lista; las citas de ejemplo son placeholders de las 3 del sitio actual.]`

---

## SEO técnico

| Campo | Valor |
|---|---|
| **URL** | `/reviews/` |
| **Keyword objetivo** | it's a keeper photography reviews (marca) · secundaria: best photographers in tri cities wa |
| **Title** (42) | `Client Reviews | It's A Keeper Photography` |
| **Meta description** (145) | `96 five-star Google reviews from Tri-Cities families, seniors and business owners. Read what it's really like to be photographed by Lisa.` |

### Estructura de headings

```
H1  What Tri-Cities Families Say
 H2  96 Five-Star Reviews — and Every One Is a Story
 H2  From Families
 H2  From Seniors & Their Parents
 H2  From Newborn Families
 H2  From Business Owners
 H2  Leave the Nerves at Home
 H2  Your Story Could Be Next
```

---

## COPY

### Hero

**H1:** What Tri-Cities Families Say

**Subhead:** I could tell you what a session with me feels like — but the people who've stood in front of my camera say it better.

**Trust bar:** ★★★★★ 96 five-star reviews on Google → [link al perfil de Google]

### Sección 2

**H2:** 96 Five-Star Reviews — and Every One Is a Story

The compliment I treasure most, and the one that appears again and again in my reviews, is this: *how comfortable and at ease people felt* — even the ones who normally hate being photographed. That's not an accident. It's the entire way I've built my sessions for twenty years.

### Secciones por servicio

_(Estructura por servicio con 2–3 reseñas cada una. Cada bloque termina con link a su página de servicio. Placeholders actuales:)_

**H2: From Families**
> "Lisa's patience helps the whole session feel easy, even with little ones moving everywhere." — `[Nombre, Richland]`
`[PENDIENTE: +2 reseñas de familias]`
→ Family Photography → `/family-photographer-tri-cities-wa/`

**H2: From Seniors & Their Parents**
> `[PENDIENTE: reseñas de seniors — priorizar las que mencionen confianza/comodidad y el reveal]`
→ Senior Pictures → `/senior-photographer-tri-cities-wa/`

**H2: From Newborn Families**
> `[PENDIENTE: reseñas newborn]`
→ Newborn Photography → `/newborn-photographer-tri-cities-wa/`

**H2: From Business Owners**
> `[PENDIENTE: reseñas de branding/headshots]`
→ Branding Photography → `/branding-photographer-tri-cities-wa/` · Professional Headshots → `/headshot-photographer-tri-cities-wa/`

### Sección — puente emocional

**H2:** Leave the Nerves at Home

If you noticed a theme — "I was so nervous, and then…" — that's the part I want you to hear. Almost everyone arrives a little unsure. Almost everyone leaves saying it was actually fun. You will too.

### CTA final

**H2:** Your Story Could Be Next
**CTA:** Start planning your session → `/contact/`
**CTA secundario:** Read all reviews on Google → [link externo]

---

## Internal links

- Entrantes: Home, todas las páginas de servicio ("More client reviews").
- Salientes: las 5 páginas de servicio + `/contact/`.

## Schema JSON-LD

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "name": "Client Reviews",
      "url": "https://www.itsakeeperphotography.com/reviews/",
      "about": {"@id": "https://www.itsakeeperphotography.com/#business"}
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.itsakeeperphotography.com/"},
        {"@type": "ListItem", "position": 2, "name": "Reviews", "item": "https://www.itsakeeperphotography.com/reviews/"}
      ]
    }
  ]
}
```

_Notas de schema: cuando existan las reseñas reales, añadir `Review` items individuales (author + reviewBody + reviewRating) dentro del LocalBusiness — NO inventar. El `aggregateRating` global ya vive en el schema de la homepage; no duplicarlo aquí salvo que se muestre el widget con las reseñas._

## Nota de implementación

Si es posible, embeber/sincronizar reseñas reales de Google (widget o copia manual con fecha). Cada reseña copiada debe ser textual y atribuible — es evidencia E-E-A-T verificable, no marketing.
