---
title: "Governance Models for Audit Analytics (And Why Most Fail)"
date: 2025-09-12
description: "Analytics governance in internal audit is often borrowed from enterprise data governance without accounting for what makes audit contexts different. Here's what actually needs governing—and how."
tags: ["governance", "methodology", "risk", "analytics"]
summary: "Most audit functions that try to govern their analytics start in the wrong place. They focus on policies when the real problem is clarity about what they're governing."
---

When organizations start taking audit analytics seriously, governance usually becomes a topic. Someone writes a policy. It covers things like data quality, approved tools, and documentation standards. It goes into a binder. It is not consulted again.

I've helped develop analytics governance frameworks. Most of them were less useful than hoped. Here's what I think actually matters.

## Why Standard Governance Approaches Fail

The typical governance framework for audit analytics is borrowed from enterprise data governance or technology risk management. Those frameworks are designed for different problems—managing enterprise data assets at scale, controlling technology risk across an organization.

Audit analytics governance has different requirements:

- The analytics are used in an assurance context, not a business decision context
- The outputs need to be defensible to regulators, not just to management
- The team producing the analytics is relatively small and the volume is relatively low
- The primary risk isn't data misuse—it's methodology error and overreach

A framework that addresses enterprise data governance concerns doesn't address these problems. You end up with policies about data access and retention that nobody reads, while the actual risks—analytical errors, overstated conclusions, undocumented methodology—go unaddressed.

## What Actually Needs Governing

In my experience, the things that actually go wrong in audit analytics fall into four categories:

**1. Methodology errors**
The analysis is technically executable but conceptually wrong. The population was defined incorrectly, the threshold is arbitrary, the statistical approach doesn't fit the data. These errors often aren't caught because nobody reviews the methodology, only the output.

**2. Overreach**
The analysis supports a conclusion, but the conclusion stated in the report is stronger than what the data supports. This happens when there's pressure to have findings or when the auditor doesn't fully understand the limitations of the analysis.

**3. Undocumented decisions**
Key decisions made during the analysis—how to handle duplicates, what to do with outliers, how to define the time period—aren't documented. The analysis isn't reproducible and can't be explained if questioned.

**4. Data quality assumptions**
The analysis assumes the data is what it appears to be, without adequate validation. Findings are presented with confidence that isn't warranted.

A good governance framework addresses these risks. Most governance frameworks don't.

## A Governance Model That Works

The governance model I've found most effective for audit analytics functions is built around three mechanisms:

**Methodological review**
Before a significant analysis is relied upon in an audit, someone other than the analyst reviews the methodology. Not the code—the logic. Does the approach answer the question? Is the population appropriate? Are the thresholds defensible? This is the highest-value governance control, and most functions don't have it.

**Documentation standards**
A clear template for what an analytical workpaper needs to contain, enforced through QA review. The template isn't long—it covers objective, data sources, validation steps, methodology, results, and limitations. But it needs to be consistently applied.

**Conclusions review**
Someone—ideally a senior analyst or the Chief Audit Executive—reviews whether the conclusions stated in findings are supported by the analysis. This is different from reviewing whether the findings are important or well-written. It's specifically about whether the data supports what's being claimed.

## What Governance Doesn't Need to Be

Governance doesn't need to be a committee. It doesn't need a charter. It doesn't need a separate policy document that duplicates the audit manual. It doesn't need a data dictionary for every source you've ever used.

The instinct to create governance infrastructure before doing governance work is real, and it's counterproductive. Start with the practices—the methodological review, the documentation standards, the conclusions review. The infrastructure can follow once you understand what you're actually governing.

## The Regulatory Dimension

For audit functions in regulated industries, there's an additional consideration: the analytics themselves may become an exam topic. Examiners increasingly ask not just what analytics you're running but how you know they're working correctly.

That means the governance needs to support an exam response. You should be able to describe your methodology review process, show the documentation, and explain how you catch errors before they reach findings. If you can't, that's a gap worth closing before the exam finds it for you.

---

*I'm genuinely uncertain whether there's a universal right answer here or whether it's entirely context-dependent. I'd be interested in how others have approached this—[LinkedIn](https://linkedin.com/in/jterwin) or [email](mailto:jt@audit-analytics.com).*
