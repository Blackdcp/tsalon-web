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

In April 2025, OpenAI introduced an early version of Dreaming to ChatGPT, letting the system reference chat history in the background and continuously organize information about the user. In June this year, OpenAI upgraded the Dreaming architecture, focusing on stale memories, information correctness, and the cost of long-term, large-scale use.

This upgrade is not about whether a single preference can be saved. When a user says "I'm going to Singapore next week," the system should know the plan has become the past once the trip ends. When a user once avoided spicy food but later changes their taste, the old preference needs updating too. Over long-term use, the system must also **find the part of a large history that the current task actually needs.**

AI memory is now managed on a yearly scale, and the focus of competition is shifting with it. Systems must continuously synthesize, update, and recall the right information, and let users and enterprises view, correct, and delete it.

This is also a problem every enterprise Agent must face. The context window, RAG, and vector databases each do important work, but none alone covers the write, update, permission, audit, and deletion needs of long-term memory.

## From saving information to managing state

Early AI memory looked like a memo. A user says "remember I don't eat spicy food," and the system saves a preference; next time it recommends a restaurant, it drops that into the context. This improves the experience, but as usage time grows, memory runs into more specific problems.

A user used to avoid spicy food but changed their taste — how should the system handle the old record? "I'm going to Shanghai next week" passes a week — should the system archive it, update it, or keep treating it as a future plan? A conversation mixes stable preferences with temporary moods; which parts are worth keeping long-term? For the same user, which information across work, family, and different devices can be linked, and which must be isolated? And how should information the model infers from context be marked for confidence?

When a user asks to modify or delete something, the system also has to check related copies, indexes, and derived information. That goes well beyond "store a bit more history text."

What enterprises buy or build is, in the end, a memory system that can run long-term. It must answer five consecutive questions: **how information enters memory, how the current task retrieves the right information, how old and new content is updated, how incorrect memories are corrected, and how unneeded information is deleted.**

## The three long-term capabilities Dreaming points to

OpenAI summarizes the goals of the new Dreaming as **freshness, continuity,** and **relevance**.

Freshness handles stale memories. Trips end, tasks complete, user preferences change, and company rules update. A long-term memory system needs to recognize relationships between old and new information, and update, downweight, archive, or forget memories — so it must keep time information, version relationships, feedback entry points, and lifecycle policies.

Continuity handles cross-session use. Raw conversations are usually long, with much repetition, and much of it is only valid at the time. Jamming all of it into the next context raises token cost and drowns important facts in noise. The system needs to identify facts, preferences, events, relationships, and task states from the raw messages, then call the right parts for the current scenario.

Relevance handles "what to use now." Retrieving semantically similar content does not mean it should enter the current reasoning. The user's identity, business scenario, time, permissions, task stage, and information confidence all affect whether a memory should be recalled. Long-term memory needs retrieval ability and a scheduling mechanism.

## MemOS turns memory into an independent system capability

MemTensor has long focused on large-model long-term memory and continual learning, and defines MemOS as a memory operating system for the Agent era.

MemOS already provides Dreaming capability to process written conversations and memories in the background. MemOS Dream Core can generate Dream context nodes after a Fine Mode write, complete context binding and summarization during the Dream phase, and record a Dream diary. Search Memory can recall relevant context nodes by configuration.

This capability folds the scattered facts, preferences, task progress, and context relationships from multi-turn conversations into a continuous organization flow. After new information enters the system, it can first complete the memory write, then Dreaming integrates it in the background; when a later task initiates retrieval, the system can return relevant content combined with the already-generated context nodes.

In MemOS, Add Message provides the write entry, Dreaming handles background integration, Search Memory handles task-based recall, and Add Feedback and Delete Memory support later correction and cleanup. Thus memory moves from a raw record in a single conversation into a long-term state that can be continuously updated, retrieved, and governed.

The model handles understanding, reasoning, and generation; the Agent handles planning tasks, calling tools, and executing actions; MemOS handles cross-time information, placing the **production, organization, scheduling, governance, and evolution of memory** into an independent system layer.

MemOS sits between Agentic AI and large language models, organizing the memory capabilities that were scattered across application code, databases, and conversation history. It can identify long-term-valid information from conversations, documents, tasks, and business events; manage different types of memory by purpose and form; and select the currently needed information by combining user, task, scenario, time, and permissions. At the same time, questions of source, logs, version, permissions, privacy, deletion, and forgetting can also enter the same memory governance flow.

MemOS Cloud already provides public interfaces covering write, retrieval, feedback, and deletion.

Taking `add/message` as an example, an application can hand a message to MemOS for processing. Public documentation states that this process can perform information extraction, conflict checking, and memory storage on the content; the application can also supplement business scope and isolation information through `info`, tags, user identifiers, and Agent identifiers.

These interfaces **turn write, retrieval, feedback, and deletion into actions the application can manage.** Enterprises still need to configure permission models, approval rules, log retention, data isolation, and compliance policies within their own architecture.

## Why layered memory is needed

Different information is saved and recalled in different ways. MemOS divides memory into **plaintext memory, activated memory,** and **parametric memory**.

Plaintext memory is easy to view, update, revise, and trace; activated memory can be reused efficiently during reasoning; parametric memory carries stable capabilities formed through training or long-term accumulation. MemOS organizes the three types of memory in the same scheduling system, and the system can manage and convert between different memory forms according to tasks and runtime conditions.

This design must handle three practical requirements at once: information must be viewable, modifiable, and traceable; memory recall must not introduce unacceptable latency into real-time reasoning; and long-accumulated experience needs a chance to form stable capabilities.

Vector databases and graph databases can take on storage duties. How memory is produced, when it is called, how it is updated, and who governs it still require an upper-layer system.

## Enterprise Agents face different memory rules

Personal products and enterprise Agents face different constraints. The gaming industry and AI NPCs care more about character setting, shared experiences, and relationship evolution; enterprise knowledge management and office collaboration care more about cross-session task continuity, project context, and permission boundaries; on-device intelligent hardware must balance cross-device continuity and local privacy; AI customer service needs to connect service histories across different channels; finance and industrial scenarios care more about permissions, source, audit, privatization, and data deletion.

MemOS targets cloud, privatized, on-device, and device-cloud collaboration usage forms. Specific available capabilities, functional boundaries, and delivery conditions should follow the project version and official documentation.

Different businesses do not need the same memory strategy. A unified infrastructure can provide governance boundaries, letting applications choose production, scheduling, and storage methods according to their own data, tasks, and compliance requirements.

## Evaluating long-term memory is not just about recall rate

Traditional retrieval systems often use recall rate to measure effectiveness. Once long-term memory enters a product, it also needs to observe continuity, freshness, relevance, controllability, and operational efficiency.

Continuity focuses on whether truly valuable history persists across sessions; freshness focuses on whether expired plans and changed preferences are updated in time; relevance focuses on whether the system only calls suitable memories in suitable tasks; controllability focuses on whether users and enterprises can view, correct, delete, and constrain memories; operational efficiency examines whether memory processing and recall can control latency, token, and storage costs as usage time and user scale grow.

A demo that successfully remembers a user's birthday cannot cover state changes months later, multi-user isolation, and large-scale concurrency. Long-term intelligence relies on a mechanism that can continuously handle these problems.

## Frequently Asked Questions

### Why do AIs forget user preferences and past conversations?

Most models do not naturally retain cross-session state. After the current session ends, historical information must be saved by an external system and supplied in later tasks. Even with complete chat logs saved, the system still has to handle effective-information extraction, expired updates, conflict identification, and scenario-based recall.

### What is the difference between AI memory, the context window, RAG, and vector databases?

The context window holds a single inference's input; RAG retrieves material from external knowledge sources; vector databases provide storage and similarity search. A long-term memory system manages cross-time information state, covering write, update, feedback, permissions, audit, deletion, and forgetting.

### What modules should a production-grade Agent memory architecture include?

Common modules include memory write and extraction, identity and scope isolation, retrieval and reranking, conflict and freshness handling, feedback and update, deletion and forgetting, permissions and audit, plus latency, cost, and quality evaluation. A real architecture also needs to connect with models, Agent orchestration, business data, and compliance systems.

### What is MemOS?

MemOS is the memory operating system advanced by MemTensor, aiming to organize the memory capabilities scattered across model context, application code, and databases into independent infrastructure. Public documentation already provides entries for message write, memory retrieval, feedback, deletion, and memory module orchestration.

## Conclusion

As AI begins to participate in personal life and enterprise processes over the long term, memory directly affects task quality, user experience, and production credibility.

**The system needs to know which information is worth saving, which content is outdated, what the current task should call, and how incorrect memories are corrected or deleted.**

Starting from Memory3-related memory mechanism research, MemTensor advances memory system engineering through MemOS, and continues to explore directions such as Agent and memory infrastructure, and memory-native general foundation models. The goal is to keep AI's understanding continuous, accurate, and manageable over longer periods of time.

## Related links

**MemOS official site:** [memos.openmem.net](https://memos.openmem.net)

**GitHub:** [github.com/MemTensor/MemOS](https://github.com/MemTensor/MemOS)

**Documentation:** [memos-docs.openmem.net](https://memos-docs.openmem.net)

---

#### About MemTensor

MemTensor (Shanghai) Technology Co., Ltd. ("MemTensor") is a new-generation large-model and long-term intelligence infrastructure enterprise incubated by the Shanghai AI Innovation Institute, with an academician of the Chinese Academy of Sciences as chief advisor.

With "low hallucination, personalization, and self-learning evolution" as its core, the company has long focused on large-model long-term memory and continual learning, building a progressive technical route from theory through systems engineering to the model layer, around Memory3-related memory mechanism research, the MemOS memory operating system, Agent and memory infrastructure productization, and memory-native general foundation models, pushing AI from one-time generation toward long-term intelligence.

The company has established deep collaboration with partners such as China Merchants, HaiCheng, and Honor, and achieved commercial deployment in key industries including AI companionship, gaming, on-device intelligent hardware, finance, and industry, with nearly 200 million RMB in cumulative financing from investors including CICC, Futeng, Huawei Hubble, SenseTime, and Heyu.
