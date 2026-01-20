---
name: brand-guidelines
description: Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit from having Anthropic's look-and-feel. Use it when brand colors or style guidelines, visual formatting, or company design standards apply.
license: Complete terms in LICENSE.txt
---

# Anthropic Brand Styling

## Overview

To access Anthropic's official brand identity and style resources, use this skill.

**Keywords**: branding, corporate identity, visual identity, post-processing, styling, brand colors, typography, Anthropic brand, visual formatting, visual design

## Brand Guidelines

### Colors

**Main Colors:**

- Off-white: `#efeae7` — Light, editorial base
- Sand gray: `#c6c0bd` — Subtle, tech-inspired support
- Graphite: `#454440` — Balanced, professional background
- Deep black: `#202020` — Impact element, inspired by premium fashion platforms

The neutral palette establishes a sophisticated, coherent, and versatile foundation:

- Off-white provides a clean, editorial background
- Sand gray delivers subtle technological tone
- Graphite grounds the interface with professional depth
- Deep black heightens areas for maximum impact, echoing premium platforms

This combination ensures the brand identity is elegant and unobtrusive, allowing content to remain at the forefront.

**Accent and Contextual Colors (Main Color-Derived):**

All accent colors are derived to harmonize with the primary neutral palette above:

- Orange: `#d97757` — Primary accent, a warmed shade evolved from the sand gray for highlights and calls-to-action
- Blue: `#6a9bcc` — Secondary accent, a muted tone carefully blended to work with graphite for information or links
- Green: `#788c5d` — Tertiary accent, a subdued complement to the off-white base, for success messages or approvals
- Red: `#d86464` — Error/destructive state, drawn to contrast distinctly with deep black for visibility
- Yellow: `#ecd275` — Warning/caution, a soft neutral-friendly yellow with sufficient contrast on sand gray
- Gray: `#a7a2a0` — Muted gray, balanced between sand gray and graphite, for neutral elements, disabled states, or grouped backgrounds

All accent hues are color-calibrated against their respective main color backgrounds for both visibility and aesthetic unity.

**Usage Guidance (Dark Theme Always):**

- Always apply the brand palette using a dark theme as the foundation.
  - Use graphite (`#454440`) and deep black (`#202020`) for primary backgrounds to ensure all elements sit within a dark, modern visual context.
  - Accent and context colors:
    - Green for success, blue for info, orange for main accents/highlights, yellow for warnings, and red for errors or destructive actions.
    - All accent hues are calibrated to maintain sufficient contrast on graphite or deep black surfaces.
  - Use neutral grays for subtle UI components, disabled states, and grouped backgrounds; maintain a clear visual hierarchy with emphasis on readability and contrast.
  - Avoid light or high-key backgrounds—ensure all major containers, surfaces, and typographic elements are designed for dark mode first.

### Typography

- **Headings**: Poppins (with Arial fallback)
- **Body Text**: Lora (with Georgia fallback)
- **Note**: Fonts should be pre-installed in your environment for best results

## Features

### Smart Font Application

- Applies Poppins font to headings (24pt and larger)
- Applies Lora font to body text
- Automatically falls back to Arial/Georgia if custom fonts unavailable
- Preserves readability across all systems

### Text Styling

- Headings (24pt+): Poppins font
- Body text: Lora font
- Smart color selection based on background
- Preserves text hierarchy and formatting

### Shape and Accent Colors

- Non-text shapes use accent colors
- Cycles through orange, blue, and green accents
- Maintains visual interest while staying on-brand

## Technical Details

### Font Management

- Uses League Spartan (for headings) and Red Hat Display (for body) from `@assets/fonts`
- Automatically falls back to Arial for headings and Georgia for body text if custom fonts are unavailable
- No manual font installation required—fonts are loaded from the assets directory
- For best results, ensure League Spartan and Red Hat Display font files are present in `@assets/fonts`

### Color Application

- Uses RGB color values for precise brand matching
- Maintains color fidelity across different systems
