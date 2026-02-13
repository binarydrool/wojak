# WOJAK Stats — Build Instructions

I'm building WOJAK Stats (wojakstats.xyz), the official community website for the OG WOJAK token on Ethereum. I've attached three files:

1. **SCOPE.md** — Full project scope, tech stack, site structure, file architecture, design direction, and all contract/link references.
2. **TODO.md** — Phased build plan with checkboxes. 10 phases from project setup to deployment. Every task is listed.
3. **WOJAK_OG_Migration_Analysis_Report.docx** — The migration report content that needs to be turned into the /migration-report page. Contains the full analysis of a hostile CTO migration attempt against the OG WOJAK community, including contract comparisons, red flags, and action items.

## How we work:

- **Every prompt you MUST:** Read SCOPE.md, TODO.md, and PROGRESS.md before writing any code. Understand current state. Build the next unchecked items. Update TODO.md checkboxes and append to PROGRESS.md after building.
- **Tech stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS. No backend. Deployed to Vercel from a public GitHub repo.
- **Build locally first.** Everything runs on localhost until the full site is done. Then we set up GitHub and Vercel.
- **I need step-by-step directions** for everything — terminal commands, where files go, what to run. Walk me through it like I've never done it before.
- **Keep docs updated.** PROGRESS.md is a running log of what was built each prompt. TODO.md checkboxes get checked off. SCOPE.md gets updated if anything changes.

## Start with Phase 1: Project Setup.

Read all three attached docs first, then walk me through initializing the project.
