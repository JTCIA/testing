---
title: "From Spreadsheets to Scalable: Maturing Audit Analytics"
date: 2025-10-08
description: "Maturity models for audit analytics often describe an end state without explaining how to get there. Here's a more honest account of what the journey actually looks like."
tags: ["capability", "maturity", "analytics", "change-management"]
summary: "Most audit analytics programs get stuck somewhere between spreadsheets and scalability. The obstacles aren't usually technical."
---

Most internal audit functions have analytics programs that fall somewhere on a spectrum: from "we run a pivot table before the audit" to "we have a production monitoring environment with automated alerting." Most of them are stuck somewhere in the middle, and the reason they're stuck is rarely what they think.

## The Maturity Model Problem

Maturity models for audit analytics are everywhere. They typically describe five levels ranging from "ad hoc" to "optimized," with a clear implication that you should be moving up the scale. What they rarely explain is why organizations get stuck—or what to do about it.

The problem is that maturity models describe outputs, not the work required to produce them. "Level 3: Standardized" sounds great. But what does it actually take to get there? That's where the interesting questions live.

## What Getting Stuck Actually Looks Like

Here's what I've observed: organizations move quickly through the early stages—usually driven by one or two enthusiastic individuals who prove value on specific audits. Then growth stalls.

The stall usually has one or more of these characteristics:

**The analytics are person-dependent.** One or two people know how to run the analysis. If they're unavailable, the audit proceeds without analytics or it waits. This is fragile, and it usually means the analytics aren't documented well enough for anyone else to run them.

**The analytics aren't integrated into the methodology.** They're addons—interesting but optional. When audit teams are under time pressure, analytics get cut because they're not required by the methodology. They're seen as a nice-to-have, not a core tool.

**Data access is handled ad hoc.** Each audit negotiates its own data access, extracts what it needs, and discards the extract when done. There's no data infrastructure, no reusable data layer, no sense of what data the function has access to.

**There's no review process for the analytics themselves.** In-charge auditors review the findings, but nobody reviews the analytical methodology. Errors accumulate. Eventually someone finds a significant one at the wrong moment.

## The Fixes Are Mostly Not Technical

When audit functions try to address these problems, they often reach for technical solutions: new tools, new platforms, data lakes, dashboards. Sometimes that helps. More often, it doesn't fix the underlying problem.

The actual fixes are mostly organizational:

**Methodology integration.** Analytics need to be in the methodology—required at certain points in the audit process, not optional. This forces the documentation and standardization work that makes analytics repeatable.

**Skills distribution.** If only two people can do the analytics, that's a skills distribution problem, not a technology problem. Training, hiring, and deliberate skill-building are the answer.

**Data governance.** Stable data access requires agreements with data owners, understanding of data quality, and some basic infrastructure. This is organizational work, not technical work.

**Analytical review.** Someone needs to be responsible for reviewing the methodology, not just the findings. This usually requires creating a role or responsibility that doesn't currently exist.

## What "Scalable" Actually Means

Scalable doesn't mean automated, though automation often follows. It means the analytics program doesn't depend on specific individuals, doesn't require heroic effort to produce, and is integrated into how audits actually get done.

You can have a highly scalable analytics program that runs entirely in Excel, if it's well-documented, methodologically sound, and consistently applied. You can also have an expensive technology platform that isn't scalable because nobody knows how to use it and the methodology is unclear.

Don't let "scalable" become a synonym for "more sophisticated technology." The question is whether the capability you've built persists and compounds over time. That's a function of people, process, and documentation—technology is a multiplier, but only if the other things are in place.

## A Realistic Roadmap

If I were advising an audit function on how to mature their analytics program, I'd suggest roughly this sequence:

1. **Inventory what you have.** What analytics are actually being run? By whom? On what data? Documented how?
2. **Identify your one or two best things.** What's working? Build on those rather than starting over.
3. **Document the methodology, not just the results.** Focus on making the analytics reproducible by someone who didn't do them originally.
4. **Get data access out of ad hoc.** Identify the two or three data sources you use most and establish stable access and documentation.
5. **Add methodological review to your QA process.** Someone should be checking the analytical approach, not just the findings.
6. **Expand skills deliberately.** Who needs to learn what? Build a plan.

The technology choices come after—and they're much easier to make when you know what problem you're actually solving.

---

*This is based on patterns I've seen across multiple organizations. Your situation will be different. I'm curious what I'm missing—[reach out](https://linkedin.com/in/jterwin).*
