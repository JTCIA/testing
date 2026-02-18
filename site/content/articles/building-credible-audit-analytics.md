---
title: "Building Credible Audit Analytics: Why Explainability Matters"
date: 2025-11-15
description: "Analytic results that can't be explained aren't audit evidence. A framework for thinking about explainability as a first-class design requirement—not an afterthought."
tags: ["methodology", "credibility", "explainability", "regulatory"]
summary: "Audit analytics face a unique constraint: the analysis must be explainable to someone who wasn't in the room. Most analytics advice ignores this."
---

There's a version of audit analytics that looks impressive in a demo and falls apart in an exam. I've seen it happen. The analysis is technically sound, the findings are real, but when a regulator asks "walk me through your methodology," the answer involves waving hands at a black box.

That's not audit evidence. That's a risk.

## The Explainability Constraint

Most analytics contexts have a relatively forgiving audience. A recommendation algorithm that's hard to explain is still useful if it works. A fraud detection model can be proprietary. In those contexts, explainability is nice to have.

Internal audit is different. Everything we produce has to survive scrutiny—from management, from the audit committee, from regulators, and eventually from examiners who will look at our workpapers and ask pointed questions. "The model said so" is not a satisfactory answer.

This creates a genuine constraint on methodology choices. It's not that we can't use sophisticated analytics—we can, and we should. But every technique we use needs a clear, defensible explanation of:

1. **What we were measuring and why** — The analytical question has to be grounded in the risk we're examining.
2. **How we defined the population and sampled from it** — Scope decisions are audit decisions.
3. **What thresholds we used and why** — Cutoffs that feel arbitrary will be questioned as arbitrary.
4. **What the result means in plain language** — If you can't explain the output, you don't understand it well enough to rely on it.

## Explainability as Design Requirement

The mistake I see most often is treating explainability as a communication problem—something you solve at the end, when you're writing up the finding. It's actually a design problem. If the methodology isn't explainable, no amount of good writing will fix it.

This means making explainability a first-class requirement when you're designing the analysis, not when you're presenting results.

In practice, that looks like this: before you finalize the approach, ask yourself whether you can explain it to your most skeptical stakeholder in five minutes without slides. If the answer is no, the approach isn't ready.

Some techniques that tend to do well under this test:
- **Rules-based testing** (with documented rationale for the rules)
- **Statistical sampling** (with documented sampling design and confidence parameters)
- **Trend analysis** (with documented baseline and comparison period)
- **Ratio analysis** (with documented benchmarks and sources)

Techniques that require more work:
- **Clustering algorithms** — Useful, but you need to be able to explain what the clusters represent and why the groupings are meaningful
- **Predictive models** — Require model documentation, validation evidence, and clear articulation of what the score means
- **Network analysis** — Powerful, but the visualization often obscures the underlying logic

## Documentation is Part of the Analysis

Explainability without documentation is wishful thinking. The explanation lives in the workpapers.

A good analytical workpaper answers the same questions a skeptical examiner would ask:
- What was the objective?
- What data did you use, and where did it come from?
- What did you do to validate the data?
- How did you define the population?
- What methodology did you apply, and why?
- What did you find?
- What did you do with anomalies?
- What conclusions did you draw, and what are their limitations?

If your workpaper can't answer those questions, the work isn't done.

## The Bottom Line

Explainability isn't a communication nicety—it's a fundamental property of audit evidence. Analytics that can't be explained can't be relied upon, no matter how sophisticated the underlying technique.

Build it in from the start. Design for the skeptical examiner, not the impressed executive. The analytics that hold up are the ones where you can walk someone through every decision you made and explain why it was the right call.

That's a higher bar. It's also a better bar.

---

*Have a different take? I'd like to hear it. Reach me on [LinkedIn](https://linkedin.com/in/jterwin) or by [email](mailto:jt@audit-analytics.com).*
