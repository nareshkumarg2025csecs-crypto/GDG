
## Plan Status: Previously Approved — Ready for Execution

This plan has been developed, consolidated from 3 model outputs, and approved twice. Submitting for final confirmation to begin coding.

---

## 13-Step Implementation Summary

| Step | File | Action |
|------|------|--------|
| 1 | `src/index.css` | Add noise grain, cursor CSS, link-wipe, btn-shimmer, reveal, text-stroke utilities |
| 2 | `tailwind.config.ts` | Add display-2xl token, clip-reveal/noise-drift keyframes, glow-sm shadow |
| 3 | `src/components/CustomCursor.tsx` | **NEW** — Framer Motion magnetic cursor (56px ring + 8px dot, hover/media/pressed states, touch guard) |
| 4 | `src/App.tsx` | Mount `<CustomCursor />` in EasterEggProvider |
| 5 | `src/components/Preloader.tsx` | Cinematic boot/build phases + 4-panel Google-color curtain exit |
| 6 | `src/components/HeroSection.tsx` | 12-col editorial split, massive text-stroke headline, per-line parallax, vertical stat rail |
| 7 | `src/components/MessageSection.tsx` | Native CSS sticky (220vh) + scoped gsap.context() line-by-line reveal |
| 8 | `src/components/EventsHorizontal.tsx` | **CRITICAL**: scoped gsap.context() fix + poster-style cards + mobile snap fallback |
| 9 | `src/components/ResourcesSection.tsx` | Full editorial 4-col grid redesign with large numerals + hover effects |
| 10 | `src/components/gallery/MiniGallery.tsx` | Enhanced parallax, theme fixes, cursor attrs, btn-shimmer |
| 11 | `src/components/Footer.tsx` | Letter stagger headline, link-wipe nav, branded social hovers, theme fixes |
| 12 | `src/components/Header.tsx` | Glassmorphism polish, cursor attrs, mobile theme fix |
| 13 | `src/pages/Index.tsx` | Gradient transition bands between sections |

## Key Constraints
- All easter eggs preserved (terminal, Konami, physics, CRT, matrix, party, hacker, leet, god mode)
- Both dark + light themes work perfectly
- All data unchanged (8 events, 4 resources, 10 team members, gallery items)
- No new dependencies — uses existing framer-motion, gsap, three.js, tailwind
- Mobile responsive at all breakpoints

## Verification
- Easter egg regression test (all triggers + effects)
- Theme toggle on every section
- GSAP conflict check (Message + Events independent)
- Responsive at 375/768/1024/1440px
- Preloader clean exit, no flicker
