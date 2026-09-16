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

If a system writes a fake contact from a web page as a "trusted supplier," the impact does not stop at the current conversation. The next time procurement runs, the task may recall this information, and other Agents may reuse it to keep executing.

Memory Poisoning refers to untrusted, incorrect, or manipulated information entering persistent memory and then being recalled in later sessions, tasks, and multi-Agent collaboration. The problem is not just a single off-target answer, but erroneous information beginning to participate in later judgment and action.

As Agents work across sessions, call tools, and share task experience, memory has become a system resource that needs separate management. Enterprises need controls around source, write, update, isolation, recall, and deletion, and these controls must work together with identity permissions, input validation, approval, monitoring, and security operations.

In its Agentic AI security article in August this year, Forcepoint listed Memory Poisoning and state pollution as major risks. The core problem is that Agents keep using memory: once erroneous information is saved, it may cause impact through later tasks days or weeks later.

## How a single error becomes long-term pollution

Prompt Injection affects the current interaction. An attacker tries to make the Agent ignore its original instructions and instead execute requirements embedded in web pages, emails, or tool-returned content.

Memory Poisoning happens after that interaction ends. The system writes unverified information into persistent memory, then later retrieves it as historical fact, user preference, or verified experience.

For example, a forged contact on a web page may be recorded as a trusted supplier, and an anomalous operation may be summarized as reusable experience. Malicious instructions may also be written as user preferences and spread through task summaries, shared memory, or cross-Agent collaboration.

For a long-running Agent, the risk keeps propagating along the memory lifecycle.

| Stage | Questions to watch | Common controls |
| --- | --- | --- |
| Input | Where the information comes from, and how trustworthy it is | Source tagging, content classification, input validation |
| Write | Who can let information into memory | Write permission, policy checks, manual approval |
| Persistence | Whether the information can be traced later | Source, time, operator, version, validity period |
| Recall | Whether the current task should see it | Identity and scope checks, freshness, reranking, confidence thresholds |
| Action | Whether the Agent will execute high-risk operations based on it | Least privilege, critical-action confirmation, tool-call monitoring |
| Propagation | Whether erroneous information enters other Agents or business domains | Provenance tagging, cross-domain limits, tracing and batch cleanup |

## Memory governance must answer six questions

First, where does this memory come from. The system needs to distinguish user input, internal documents, external web pages, tool returns, and the Agent's own summaries, and preserve source information.

Second, who can write or modify. Not every conversation, web page, or tool call should enter long-term memory directly. Write permissions should match business risk.

Third, how old and new memories coexist. New information may supplement, correct, replace, or conflict with old records. The system needs explicit rules to keep old and new content from fighting each other at recall time.

Fourth, who can see the memory. Clear isolation boundaries are needed between tenants, users, Agents, projects, and business systems.

Fifth, what happens after an error is found. The system must be able to locate the original memory, correct or delete it, and check whether it has already been summarized, derived, or propagated into other states.

Sixth, how to detect anomalies. Enterprises should continuously record write, retrieval, conflict, feedback, deletion, and cross-scope access events, and feed them into existing security monitoring and audit systems.

## How MemOS helps enterprises avoid similar problems

MemOS places memory between the Agent and the model, providing system entries for write, retrieval, feedback, deletion, and memory module orchestration. Applications can use it to control what enters memory, what is recalled in the current task, and how erroneous information is handled.

| Capability | Role in governance |
| --- | --- |
| Add Message | Makes write an explicit action; the application decides which messages enter memory |
| Search Memory | Retrieves relevant memory by query and scope |
| Add Feedback | Feeds "inaccurate," "has changed," "should not be reused" feedback into the memory handling flow |
| Delete Memory | Deletes specified memory to support correction and incident response |
| Memory Module Orchestration | Orchestrates different memory modules to fit different tasks and storage forms |

MemOS Cloud now provides search, write, delete, and feedback interfaces, making it easy to connect these operations into Agent workflows.

These interfaces provide control entry points at the memory layer. Enterprises still need to combine IAM, least privilege, input validation, approval, DLP, SIEM, business logs, and incident response processes to handle production risks together.

Feedback and deletion especially need to become system capabilities. When a user finds a memory expired, wrong, or no longer fit for use, the system should be able to receive feedback, locate the corresponding content, and stop it from continuing to participate in later tasks.

## Different memory layers need different governance

Text memory is usually easier to view, modify, and delete. Activated memory and parametric memory have lower visibility and higher correction costs.

Real systems may also contain caches, knowledge graphs, summaries, Skills, and reusable task states. Before governing, teams should inventory these memory forms and confirm their write sources, retention periods, recall scope, and deletion paths.

Privatized or on-device deployment can change data storage boundaries, but cannot replace memory governance. Wrong writes, over-broad authorization, unclear sources, and internal poisoning can also happen in local environments.

## Different industries need different memory rules

Companion products need to focus on persona setting, user control, and sensitive preferences.

Smart devices need to consider multi-user isolation, edge privacy, and memory boundaries between devices.

Finance scenarios care more about policy timeliness, access permissions, and complete audit records.

Industrial scenarios need to distinguish device facts, expert experience, and on-site anomalies, to keep unconfirmed experience from directly affecting operation advice.

Whatever the business, teams should first define four things: which content can be written automatically and which must be approved; which memories can be shared and which must be isolated; how long memories are kept and when they expire; and on receiving correction feedback, whether to update, immediately stop use, or enter manual audit.

## Pre-launch checklist

| Check item | What to confirm before launch |
| --- | --- |
| Source info | Whether source, operator, time, scope, and validity period are recorded |
| Permission model | Whether read, write, modify, delete, and share permissions are distinguished |
| External input | Whether web pages, emails, attachments, and tool returns are treated as untrusted by default |
| High-risk writes | Whether secondary confirmation or manual approval is required |
| Conflict handling | Which rule applies when old and new memories conflict |
| Recall tracing | Whether a task's actually recalled memories are visible |
| Incident response | Whether erroneous memory and its derived states can be cleaned up |
| Security monitoring | Whether write, retrieval, conflict, feedback, deletion, and tool calls are covered |
| Red-team testing | Whether injection, cross-tenant access, expired memory, and error propagation are tested |
| Responsibility boundary | Whether responsibility is clear across cloud, privatized, and edge environments |

## Frequently Asked Questions

### How is Memory Poisoning different from Prompt Injection?

Prompt Injection mainly affects the current task. Memory Poisoning lets untrusted information enter persistent memory and keep influencing later tasks.

### Can privatized deployment solve memory poisoning?

Privatized deployment can shrink the data-exposure surface. Problems like untrusted sources, over-broad permissions, and wrong writes still require memory governance.

### Which metrics should enterprises monitor?

At minimum: memory write volume, source types, cross-scope access, conflict rate, feedback rate, deletion rate, anomalous recall, and high-risk tool calls.

### What problems can MemOS solve?

MemOS provides system entries for memory write, retrieval, feedback, deletion, and module orchestration, helping developers connect memory governance into Agent workflows. Specific permissions, approval, monitoring, and incident response still depend on the enterprise's own architecture.

## Conclusion

As Agents work long-term, memory begins to affect the quality and security of later tasks. Enterprises need to know where a memory comes from, why it was written, which tasks have called it, and whether it can be corrected or deleted promptly once a problem is found.

Long-term memory is not just about preserving history. It needs to stay controllable, traceable, and actionable in every write, recall, and update.

## Related links

MemOS official site: [memos.openmem.net](https://memos.openmem.net)

GitHub: [github.com/MemTensor/MemOS](https://github.com/MemTensor/MemOS)

Documentation: [memos-docs.openmem.net](https://memos-docs.openmem.net)

---

#### About MemTensor

MemTensor (Shanghai) Technology Co., Ltd. ("MemTensor") is a new-generation large-model and long-term intelligence infrastructure enterprise incubated by the Shanghai AI Innovation Institute, with an academician of the Chinese Academy of Sciences as chief advisor.

With "low hallucination, personalization, and self-learning evolution" as its core, the company has long focused on large-model long-term memory and continual learning, building a progressive technical route from theory through systems engineering to the model layer, around Memory3-related memory mechanism research, the MemOS memory operating system, Agent and memory infrastructure productization, and memory-native general foundation models, pushing AI from one-time generation toward long-term intelligence.

The company has established deep collaboration with partners such as China Merchants, HaiCheng, and Honor, and achieved commercial deployment in key industries including AI companionship, gaming, on-device intelligent hardware, finance, and industry, with nearly 200 million RMB in cumulative financing from investors including CICC, Futeng, Huawei Hubble, SenseTime, and Heyu.
