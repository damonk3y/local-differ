---
name: frontend-design
description: Create distinctive, production-grade, mobile-first frontend interfaces with high design quality. Use this skill to build visually striking web components, apps, or pages—always starting from a bold, touch-optimized mobile vision. Uses logos and content from @public/ for branded polish and context.
license: Complete terms in LICENSE.txt
---

<div align="center" style="margin-bottom: 1.5rem;">
  <!-- Usage: white logo is default for dark theme backgrounds -->
  <picture>
    <source srcset="@public/symbol-white.png" media="(prefers-color-scheme: dark)">
    <img src="@public/symbol-white.png" alt="Frontend Skill Logo" width="64" height="64" style="display:inline-block;">
  </picture>
</div>

This skill produces _distinctive, production-worthy_ mobile-first interfaces, avoiding generic, AI-generated slop. All implementations:

- **Start mobile-first**: All layouts and interaction patterns optimize for small screens and touch, scaling up responsively.
- **Prioritize brand context**: Incorporate logos and imagery from `@public/` for headers, heroes, navigation, and surface backgrounds as appropriate.
  - **On dark backgrounds (the default):** Use `@public/symbol-white.png`—this is the most common usage.
  - **If a section uses a lighter background:** Swap to `@public/symbol-black.png` for best visibility and brand consistency.
  - Use other content/assets from `@public/` as needed for visual storytelling, icons, background textures, or accent elements.
- **Deliver bold, intentional aesthetics**: Each UI is visually memorable and context-driven—never generic, always purposeful.

## Mobile-First Design Philosophy

- **Simple first, mobile always**  
  Layouts, spacing, font sizing, and tap targets are always tuned for touch and readability on mobile. Use rem, %, vw, grid, and flex—avoid px units unless necessary.
- **Responsive expansion**  
  Use container/media queries or framework tools to enhance for tablet/desktop, but never assume a desktop base.
- **Full-width backgrounds on larger devices**
  On larger screens (tablet/desktop), ensure backgrounds extend to fill the entire viewport width—from edge to edge. Never allow black bars or empty space on the sides. Use a centered inner container for content while maintaining full-width background coverage. The background should be applied to the outermost wrapper/container, with content constrained within a centered, max-width container inside.
- **Mobile floating bottom navigation clearance**
  The app uses a floating bottom navigation bar on mobile (`fixed bottom-4 inset-x-4 h-14`). All page content must account for this by ensuring sufficient bottom padding so users can scroll to see all content without it being obscured by the nav bar. The main layout in `@/app.tsx` applies `pb-24 md:pb-4` to handle this globally, but be aware when creating full-height sections or custom layouts—always test that the last content item is fully visible above the floating nav.
- **Touch and accessibility**  
  All tap targets ≥44px, with visible focus and ARIA support. Prioritize accessible navigation and bold visual cues.
- **Content hierarchy**  
  Essential content comes first; progressive disclosure (drawers, accordions, off-canvas) handles details. Navigation and calls-to-action are always easy to reach with a thumb.
- **Brand visuals everywhere**  
  Use `@public/` symbols meaningfully: for example, in top app bars, nav drawers, splash/empty states, hero images, or as recurring watermarks/textures.
- **Always enforce brand guidelines**  
  Strictly apply `@.claude/skills/brand-guidelines/SKILL.md` in every implementation. Use the official brand colors (graphite `#454440`, deep black `#202020`, off-white `#efeae7`, sand gray `#c6c0bd`, and accent colors), typography (League Spartan for headings, Red Hat Display for body), and dark theme foundation. Brand guidelines are not optional—they must be consistently enforced across all interfaces.

## Design Thinking

Before writing code, clarify:

- **Brand assets from @public/**  
  Always:
  - Use `@public/symbol-white.png` on dark backgrounds (the norm).
  - Use `@public/symbol-black.png` only for light/bright backgrounds or inverse sections. Place logos prominently: in mobile headers, main nav, hero features, onboarding screens, modals, or wherever a visual anchor is needed.
- **Content and imagery**  
  Pull icons, illustrative SVG, supporting images, or background assets from `@public/` to reinforce brand and narrative.
- **Aesthetic direction**  
  Choose a strong mobile-centric theme (minimal, maximalist, luxury, retro, playful, etc) and express it intentionally—even in logo placement, overlays, and compositional layering.
- **Unique, memorable polish**  
  Be bold: integrate custom logos, textures, and backgrounds to anchor the aesthetic—break expectations, but never clarity.

## Frontend Aesthetics Guidelines

- **Typography**  
  Select beautiful, readable fonts (never default/inter/arial/roboto). Responsive font sizing is a must. Use branded or unique pairings when possible.
- **Color & Theme**  
  Use CSS variables for palette control. Guarantee contrast (WCAG AA+) for all states, on both dark and occasional light backgrounds. Major colors should be strong—a vivid accent plus a consistent dark/light base.
- **Motion & Microinteractions**  
  Use CSS transitions or a Motion library for elegant, performant animations. Page loads, logo reveals, nav transitions: these are perfect moments for brand-forward movement (e.g., animating the logo from `@public/`).
- **Layout & Spatial Composition**  
  Don’t be afraid to overlap, layer logos, break single-column grids, or add contextual images from `@public/` for texture and identity—especially on mobile.
- **Visual Detail**  
  Watermark backgrounds, subtle grain, pattern overlays, micro-logos—all from `@public/`—should be used contextually. Optimize for performance (PNG/SVG as appropriate).

NEVER use generic AI aesthetics (common fonts, bland gradients, colorless layouts, missing logo/brand context). Each project must look and feel unique, with @public/symbol-white.png anchoring the design unless a light background demands @public/symbol-black.png.

---

**SUMMARY:**

- Mobile-first, thumb-optimized, branded everywhere
- @public/symbol-white.png is the go-to logo for dark backgrounds
- Use @public/symbol-black.png only where higher contrast is needed on light backgrounds
- Reference or feature other @public/ assets as part of your branded interface
- Design every UI to stand out as bold, distinct, and purposefully mobile-native
- Every logo/image must be thoughtfully placed—never decorative, always meaningful
- **Always enforce @.claude/skills/brand-guidelines/SKILL.md**—brand colors, typography, and dark theme are mandatory
- **Full-width backgrounds on larger devices**—backgrounds must fill 100vw with centered inner containers, never showing black bars
- **Mobile bottom nav clearance**—ensure `pb-24 md:pb-4` or equivalent so content scrolls fully above the floating nav bar

---

## App Layout & Navigation

### Desktop Floating Navbar
On desktop (`md:` breakpoint and above), the app displays a floating pill-shaped navbar fixed at the top (`fixed top-4 inset-x-4 h-14`). The main layout applies `pt-24 md:pt-24` to clear this.

### Mobile Floating Bottom Bar
On mobile (below `md:` breakpoint), navigation moves to a floating bottom bar (`fixed bottom-4 inset-x-4 h-14`). The main layout applies `pb-24` to ensure all content can scroll above this bar.

**Key padding values:**
- Desktop: `pt-24` (top navbar clearance), `pb-4` (minimal bottom)
- Mobile: `pt-4` (minimal top), `pb-24` (bottom navbar clearance)

When building screens, the global layout handles this automatically. However, for custom full-height layouts or modals, remember to account for these fixed elements.

---

## Reusable Components

### Footer (`@/components/ui/footer.tsx`)

A simple, reusable footer component displaying the copyright year and brand name.

**Usage:**
```tsx
import { Footer } from '@/components/ui/footer';

// Basic usage
<Footer />

// With custom alignment
<Footer className="text-center lg:text-left" />
```

**Sticky Footer Pattern:**
To make the footer stick to the bottom when content is short, but scroll naturally when content overflows:

```tsx
<section className="min-h-screen flex flex-col">
  {/* Main content with flex-1 to take available space */}
  <div className="flex-1">
    {/* Page content here */}
  </div>

  {/* Footer stays at bottom */}
  <div className="px-6 pb-8">
    <Footer className="text-center lg:text-left" />
  </div>
</section>
```

**Styling:** The footer uses `text-white/20 text-sm` for subtle appearance on dark backgrounds. Pass additional classes via `className` prop for alignment or spacing adjustments

---

### AuthenticatedBackground (`@/components/ui/authenticated-background.tsx`)

**AUTOMATICALLY APPLIED** - This background is automatically rendered by `MainLayout` in `app.tsx` for all authenticated routes. You do NOT need to add it to individual pages.

A consistent branded background for all authenticated (logged-in) pages. Matches the login page aesthetic for a seamless visual transition.

**Composition (layered bottom to top):**
1. **Base Layer** - `bg-zinc-950` (matching login page)
2. **Subtle White Glows** - Soft center and corner glows for depth
   - Center glow: `bg-white/[0.015]`, 600px, 150px blur
   - Bottom-right glow: `bg-white/[0.01]`, 400px, 120px blur
3. **Pattern Overlay** - `pattern-beyoutique.png` at 2.5% opacity
4. **Noise/Grain Texture** - SVG noise at 2% opacity for premium feel

**Automatic Application:**
The background is automatically shown when:
- User is logged in (`currentUser` exists)
- Route is NOT a public route (`/`, `/maintenance`, `/public-order/*`)

**Public Routes (NO background):**
- `/` - Login page
- `/maintenance` - Maintenance page
- `/public-order/*` - Public order tracking

**Do NOT manually add this component to pages** - it's handled globally by `app.tsx`.

**Why this design:**
- Matches the login page aesthetic (zinc-950, subtle white glows)
- No jarring visual change when transitioning from login to app
- Consistent premium feel across all authenticated screens
