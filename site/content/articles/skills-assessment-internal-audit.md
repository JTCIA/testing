---
title: "What I'm Learning About Skills Assessment in Internal Audit"
date: 2025-08-20
description: "Assessing analytical skills in audit teams is harder than it looks—and the tools most organizations use aren't measuring what they think they're measuring."
tags: ["capability", "skills", "people", "analytics"]
summary: "Skills assessments in audit analytics often measure confidence rather than capability. Here's a more honest approach."
---

I've been working on skills assessment for audit analytics teams for a while now, and I keep bumping into the same problem: the tools most organizations use don't measure what we think they measure.

Self-assessment surveys are the most common approach. You ask auditors to rate themselves on a list of skills—SQL, Python, data visualization, statistical analysis—on a five-point scale. You aggregate the results. You declare that your team is "intermediate" in data analytics.

Except you don't actually know that. What you know is that your team's median self-assessment is "intermediate." Those are different things.

## The Dunning-Kruger Problem

The literature on skill self-assessment is pretty clear: people with low skill tend to overestimate their ability, and people with high skill tend to underestimate it. This is especially pronounced in technical domains where the difference between knowing a little and knowing a lot isn't obvious to someone who knows a little.

In practical terms: if you ask your audit team to self-assess their SQL skills, the auditor who knows how to write a SELECT statement with a WHERE clause will often rate themselves as "proficient." The auditor who can write complex window functions and CTEs will often rate themselves as "intermediate" because they're aware of everything they don't know.

Your self-assessment data will systematically misstate where the skill actually is.

## What Works Better

I've experimented with a few approaches that are more reliable than self-assessment:

**Demonstrated work samples.** Give people a realistic task and see what they produce. Not a test in the exam sense—a short analytical problem that reflects actual audit work. This reveals both skill level and practical judgment (do they recognize when an approach won't work?). It's time-consuming to administer, but it's the most reliable signal.

**Structured competency conversations.** One-on-one conversations with specific technical questions. "Walk me through how you'd approach testing this control analytically." The goal isn't to catch people out—it's to understand how they think about analytical problems. You learn a lot about someone's actual capability from how they describe their approach.

**Output-based assessment.** Review actual analytical work products and assess them against a rubric. What does a good workpaper look like? Does this one meet that standard? This has the advantage of assessing capability in context.

## What You're Actually Trying to Know

Part of the problem is that "skills assessment" is often treated as an end in itself rather than a means to an end. The purpose of the assessment should drive the methodology.

If the question is "do we have the skills to execute this audit program?", you need to assess against specific requirements—what exactly does this program need people to be able to do? A generic skills inventory won't answer that.

If the question is "where should we invest in training?", you need to know not just the level of skill but the gaps between current and required capability—which requires having a clear picture of required capability first.

If the question is "how do we hire?", you need to assess not just current skill but learning potential and trajectory—which requires different methods again.

## What I'm Still Figuring Out

I don't have a clean solution to this. Demonstrated work samples are the most reliable but also the most resource-intensive. Self-assessment is easy but often misleading. Structured conversations are good but depend heavily on the quality of the interviewer.

The honest answer is probably a combination: a baseline self-assessment (understanding its limitations) supplemented by spot-checking through work samples and conversations, adjusted over time as you accumulate actual evidence of what people can and can't do.

And being honest with leadership about what you know and don't know about the team's capabilities. "Our self-assessment says intermediate" and "we have observed evidence of intermediate capability" are different claims. The first is common. The second is rare and more valuable.

---

*I'm actively working on this and would genuinely like to hear what others have tried. [LinkedIn](https://linkedin.com/in/jterwin) or [email](mailto:jt@audit-analytics.com).*
