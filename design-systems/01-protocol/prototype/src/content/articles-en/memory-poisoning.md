---
title: "Memory Poisoning: Long-Term Memory Controls for Agents"
summary: "If a system records a fake contact as a trusted supplier, the impact extends beyond the current conversation. Memory Poisoning is a critical risk for AI Agents."
type: news
publishedAt: 2026-09-01
readingMinutes: 3
author: editorial-team
topics:
  - AI
  - Agent
  - Security
cover: "/images/articles/memory-poisoning-cover.jpg"
coverAlt: "Memory Poisoning"
citations:
  - label: SegmentFault Original
    url: https://segmentfault.com/a/1190000048255404
featured: true
draft: false
translationOf: memory-poisoning
translationStatus: reviewed
tldr:
  - "Memory Poisoning is when untrusted, incorrect, or manipulated information enters persistent memory and is recalled in later sessions, tasks, and multi-agent collaboration."
  - "Unlike Prompt Injection, which affects only the current interaction, poisoning persists along the memory lifecycle for days or weeks."
  - "Memory governance must answer six questions: source, write permission, old/new coexistence, visibility scope, error handling, and anomaly detection."
  - "MemOS offers write/search/feedback/delete entry points, but private deployment does not replace governance; IAM, least privilege, approval, DLP, and SIEM are still required."
faq:
  - question: "How is Memory Poisoning different from Prompt Injection?"
    answer: "Prompt Injection mainly affects the current task; Memory Poisoning lets untrusted information enter persistent memory and keep influencing later tasks."
  - question: "Does private deployment solve memory poisoning?"
    answer: "Private deployment shrinks the data-exposure surface, but untrusted sources, over-broad permissions, and wrong writes still require memory governance."
  - question: "Which memory metrics should enterprises monitor?"
    answer: "At minimum: write volume, source type, cross-scope access, conflict rate, feedback rate, deletion rate, anomalous recall, and high-risk tool calls."
  - question: "What problems can MemOS solve?"
    answer: "It provides system entry points for memory write, search, feedback, delete, and module orchestration to bring memory governance into Agent workflows; permissions, approval, monitoring, and incident response still depend on the enterprise's own architecture."
seo:
  title: "Memory Poisoning: Long-Term Memory Controls for Agents"
  description: "If a system records a fake contact as a trusted supplier, the impact extends beyond the current conversation. Memory Poisoning is a critical risk for AI Agents."
---

This article explains the details originally posted on SegmentFault. 

(Full English translation pending)
