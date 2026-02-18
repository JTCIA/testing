# audit-analytics.com

Personal thought leadership site for JT Erwin — built with [Hugo](https://gohugo.io/) and the [Blowfish](https://blowfish.page/) theme, deployed to [Cloudflare Pages](https://pages.cloudflare.com/).

---

## Local Development

### Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) v0.145.0+
- Git

### First-time setup

```bash
git clone --recurse-submodules https://github.com/YOUR_USERNAME/audit-analytics.git
cd audit-analytics
hugo server
```

> **Note:** The `--recurse-submodules` flag is required to pull the Blowfish theme.

### Start the dev server

```bash
hugo server          # http://localhost:1313
hugo server -D       # include drafts
```

### Build for production

```bash
hugo --minify
# Output is in /public/
```

---

## Deploying to Cloudflare Pages

### One-time setup

1. Push this repository to GitHub (or GitLab).
2. Go to **Cloudflare Dashboard → Pages → Create a project**.
3. Connect your GitHub repository.
4. Configure the build:
   | Setting | Value |
   |---|---|
   | Framework preset | None |
   | Build command | `hugo --minify` |
   | Build output directory | `public` |
   | Root directory | *(leave blank)* |
5. Add environment variable: `HUGO_VERSION` = `0.145.0`
6. Click **Save and Deploy**.

After the first deploy, Cloudflare Pages gives you a `*.pages.dev` preview URL. Point your domain once you've verified it looks right.

### Connecting audit-analytics.com

1. In Cloudflare Pages → your project → **Custom domains**
2. Add `audit-analytics.com` and `www.audit-analytics.com`
3. Cloudflare handles DNS automatically (since the domain is already on Cloudflare)
4. SSL is automatic — no action needed

### Preview deploys

Every push to any branch creates a preview URL at `<branch-name>.<project>.pages.dev`. Main branch → production.

---

## Content Workflow

### Adding a new article

```bash
hugo new articles/your-title-here.md
```

This creates `content/articles/your-title-here.md` from the archetypes template. Edit it, then:

- Set `draft: false` when ready to publish
- Push to `main` → auto-deploys

**Front matter fields:**
```yaml
---
title: "Your Article Title"
date: 2025-01-15
description: "One or two sentence summary for SEO and excerpts."
tags: ["methodology", "analytics"]
summary: "A slightly longer summary shown in article lists."
draft: false
---
```

### Adding a reading list entry

```bash
hugo new reading/short-slug.md
```

**Front matter fields:**
```yaml
---
title: "Article Title (as you'd cite it)"
date: 2025-01-15
external_url: "https://example.com/the-actual-article"
source: "Publication Name"
author: "Author Name"
tags: ["analytics", "governance"]
commentary: "Your 2-4 sentence take on why this is worth reading."
---
```

Leave the body empty for reading list entries — the `commentary` field is shown prominently on both the list and detail pages.

### Writing a journal entry

```bash
hugo new journal/YYYY-MM-DD-short-title.md
```

**Front matter fields:**
```yaml
---
title: "What I'm thinking about today"
date: 2025-01-15
tags: ["methodology", "half-formed"]
draft: false
---
```

Then write freely in the body. Journal entries are **never** indexed by search engines and are excluded from the sitemap. See [Journal Privacy](#journal-privacy) below.

---

## Journal Privacy

The journal section has three layers of protection:

### 1. robots.txt exclusion
```
Disallow: /journal/
```
Search engines are told not to crawl or index `/journal/`. Compliant crawlers (Google, Bing) will respect this.

### 2. Sitemap exclusion
Journal pages are filtered out of `sitemap.xml` — they won't be submitted to search engines even if they crawl the sitemap.

### 3. Client-side password gate (local/fallback)
The journal list and single-entry pages show a password prompt before displaying content. Session is stored in `sessionStorage` and cleared when you close the browser tab.

**Set the local passphrase** by adding to `config/_default/params.toml`:
```toml
journalPasswordHash = "your-passphrase"   # or use Cloudflare Access (recommended)
```

Or set it at runtime in the browser console (for testing):
```js
window.__JOURNAL_PW__ = 'your-passphrase';
```

### 4. Cloudflare Access (recommended for production)

The JavaScript password gate is a convenience layer — it's not cryptographically strong. For production, use **Cloudflare Access** to put a real authentication gate in front of `/journal/`:

1. Cloudflare Dashboard → **Zero Trust → Access → Applications**
2. Add application:
   - **Name:** Journal
   - **Application domain:** `audit-analytics.com/journal`
   - **Policy:** One-time PIN to your email (or GitHub login)
3. Anyone hitting `/journal/` will be prompted to authenticate with Cloudflare before seeing any content

This is free on Cloudflare's personal plan for up to 50 users and requires no server-side code changes.

---

## Site Structure

```
content/
├── _index.md          # Home page metadata
├── articles/          # Public blog posts
├── reading/           # Curated reading list (public)
├── journal/           # Private daily writing (access-controlled)
├── about/             # Professional background
└── contact/           # Contact info

layouts/
├── partials/home/
│   └── custom.html    # Multi-section homepage layout
├── reading/
│   └── single.html    # Reading entry detail page
├── journal/
│   ├── list.html      # Journal index (with password gate)
│   └── single.html    # Journal entry (with password gate)
└── _default/
    └── sitemap.xml    # Custom sitemap (excludes /journal/)

assets/css/
├── custom.css         # All custom styles
└── schemes/
    └── teal.css       # Custom color palette

config/_default/
├── hugo.toml          # Core site config
├── params.toml        # Theme parameters
├── languages.en.toml  # Author info
└── menus.en.toml      # Navigation
```

---

## Archetypes (Content Templates)

The `archetypes/` directory contains templates for `hugo new` commands. See `archetypes/` for the templates.

---

## Markdown Reference

### Code blocks
````markdown
```sql
SELECT account_id, COUNT(*) as txn_count
FROM transactions
WHERE txn_date >= CURRENT_DATE - 90
GROUP BY account_id
HAVING COUNT(*) > 100
ORDER BY txn_count DESC;
```
````

### Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value    | Value    | Value    |
```

### Block quotes
```markdown
> This is a block quote. Use for pull quotes or important callouts.
```

### Footnotes
```markdown
This is a claim that needs a citation.[^1]

[^1]: The citation goes here at the bottom.
```

---

## Theme & Design

- **Theme:** [Blowfish](https://blowfish.page/) — installed as a git submodule at `themes/blowfish/`
- **Color scheme:** Custom teal (`assets/css/schemes/teal.css`) — deep teal `#006D77` primary, warm charcoal neutrals
- **Custom CSS:** `assets/css/custom.css` — homepage sections, reading list cards, journal private indicators
- **Syntax highlighting:** Nord theme via Hugo's built-in Chroma

To update the theme:
```bash
git submodule update --remote themes/blowfish
```

---

## Troubleshooting

**Build fails with "module not found"**
Run `git submodule update --init --recursive` to pull the theme.

**Changes not showing locally**
Hugo caches aggressively. Try `hugo server --disableFastRender`.

**Reading list entries not showing on homepage**
Check that `draft: false` is set in front matter and the `date` is not in the future.

**Journal password gate not working**
The gate requires JavaScript. Check browser console for errors. In production, use Cloudflare Access instead.
