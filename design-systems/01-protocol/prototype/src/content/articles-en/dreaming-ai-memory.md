---
title: "Dreaming Update: AI Memory Requires Annual Management"
summary: "In April 2025, OpenAI introduced an early version of Dreaming to ChatGPT, allowing it to reference chat logs. In June, OpenAI upgraded the Dreaming architecture."
type: news
publishedAt: 2026-09-11
readingMinutes: 3
author: editorial-team
topics:
  - AI
  - Agent
cover: "/images/articles/dreaming-ai-memory-cover.jpg"
coverAlt: "Dreaming Update: AI Memory Requires Annual Management"
citations:
  - label: SegmentFault Original
    url: https://segmentfault.com/a/1190000048267587
featured: true
draft: false
translationOf: dreaming-ai-memory
translationStatus: reviewed
tldr:
  - "OpenAI introduced an early Dreaming build to ChatGPT in April 2025 and upgraded it in June 2026, targeting memory staleness, correctness, and long-term cost."
  - "AI memory shifts from 'saving information' to 'managing state': write, recall, update, correct, and delete."
  - "Dreaming points to three lasting capabilities: freshness, continuity, and relevance."
  - "MemOS turns memory into an independent system layer (plaintext / activated / parametric memory) with write, search, feedback, and delete APIs; enterprises still own permissions and compliance."
faq:
  - question: "What is Dreaming and what problem does it solve?"
    answer: "A background memory-organizing capability OpenAI added to ChatGPT that keeps synthesizing, updating, and recalling user information outside the conversation; the upgrade targets stale memories, correctness, and long-term cost at scale."
  - question: "How is AI memory different from the context window, RAG, and vector databases?"
    answer: "The context window holds one inference's input, RAG retrieves from external sources, vector DBs store and search by similarity; a long-term memory system manages cross-time state across write, update, permissions, audit, and deletion."
  - question: "What modules should a production Agent memory architecture include?"
    answer: "Typically memory write/extract, identity and scope isolation, retrieval and reranking, conflict and staleness handling, feedback and update, deletion and forgetting, permissions and audit, plus latency, cost, and quality evaluation."
  - question: "What is MemOS?"
    answer: "A 'memory operating system' from MemTensor that organizes memory spread across model context, app code, and databases into independent infrastructure, exposing message write, search, feedback, and delete interfaces."
seo:
  title: "Dreaming Update: AI Memory Requires Annual Management"
  description: "In April 2025, OpenAI introduced an early version of Dreaming to ChatGPT, allowing it to reference chat logs. In June, OpenAI upgraded the Dreaming architecture."
---

This article explains the details originally posted on SegmentFault. 

(Full English translation pending)
