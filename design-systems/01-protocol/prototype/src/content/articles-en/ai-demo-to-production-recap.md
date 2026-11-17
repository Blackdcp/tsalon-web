---
title: "Event Recap: From AI Demo to Production｜Engineering Practices for Agent and AI Native Applications"
summary: "A record of the August 1, 2026 'From AI Demo to Production' event in Shanghai, with four speakers' presentations and a live demo covering agent memory, model collaboration, Vibe Coding and execution environments."
type: field-note
publishedAt: 2026-08-03
updatedAt: 2026-09-26
readingMinutes: 5
author: editorial-team
topics:
  - AI
  - Agent
  - Engineering
relatedEvents:
  - hdx-7870619038900
cover: /images/events/hdx-7870619038900.jpg
coverAlt: AI From Demo to Production Event Poster
citations:
  - url: https://mp.weixin.qq.com/s/z_9W5AsV0yLTlzt6f-QCTA
    label: "Event Recap: From AI Demo to Production｜Engineering Practices for Agent and AI Native Applications"
featured: true
draft: false
translationOf: ai-demo-to-production-recap
translationStatus: reviewed
tldr:
  - "What AI Remembers is Not Just Chat History: The first talk was from MemTensor, delivered by Memmy R&D lead Zong Yue:"
  - "Agents Need More Than Thinking, They Need a Real Execution Environment: The final talk was from FastGPT Solution Lead Rowan:"
  - "Thanks and event information: Thank you to Zong Yue, Chen Jiaqi, Qin Mao Tim and Rowan, and to the organisers, partners, volunteers and everyone who brought questions and projects to the event."
seo:
  title: "Event Recap: From AI Demo to Production"
  description: "A recap of the August 1, 2026 Shanghai event, recording talks and a live demo from MemTensor, PPIO, Zion and FastGPT on agents and AI applications."
---

On August 1, 2026, we hosted the "From AI Demo to Production | Engineering Practices for Agent and AI Native Applications" offline event in Shanghai.

We invited four guests from MemTensor, PPIO, Zion, and FastGPT.

The speakers focused on work they were doing at the time: long-term memory, collaboration between models, backend development with Vibe Coding, and agent execution environments. The account below records their presentations and the live demo from that event.

The Q&A sessions on-site were also more active than expected. After several talks ended, many friends continued to surround the speakers for discussion, and the scheduled break naturally turned into another discussion session.

## What AI Remembers is Not Just Chat History

The first talk was from MemTensor, delivered by Memmy R&D lead Zong Yue:

**"Make All AI Remember the Same You: Memory Architecture and Engineering Practices of Memmy and MemOS"**

We might use Cursor, Claude Code, Codex, and various Agents at the same time every day, but once we switch tools, many things need to be explained from scratch.

Zong Yue shared Memmy and MemOS, focusing not just on "saving chat history", but on making AI remember how a task is progressed: what decisions were made previously, where it failed, how it finally recovered, and which experiences can be reused in the future.

In Zong Yue’s account, task traces can be developed into reusable strategies, contextual knowledge and skills.

Of course, AI remembering more doesn't necessarily mean better. How to correct false memories, how to isolate data from different users and projects, and how to handle risks in historical content are also problems that must be solved before the memory system is truly put into use.

## Not Just Choosing Models, But Also Teaming Them Up

The second talk was delivered by PPIO AI Cloud Project Engineer Chen Jiaqi:

**"Smarter Tokens, Cheaper Intelligence: The Engineering Practice of PPIO Intelligent Model Gateway"**

In her talk, Chen Jiaqi proposed a very interesting concept: Token Intelligence Density.

Simply understood, it means whether you can get a better result by spending the same Token.

The first approach Chen described was to let multiple models participate together. Different models make their own judgments, then extract consensus, find divergences, and finally fuse into a single answer. It's somewhat like inviting several experts specialized in different areas for a joint consultation.

The second approach in the presentation was intelligent routing.

Chen described routing translation, editing and formatting to lighter models, while reserving more capable models for research, software engineering and complex decisions.

The point is not to blindly choose the cheapest model, but to assign suitable tasks to suitable models, making both the effect and cost more reasonable.

## Tim Didn't Just Talk About Vibe Coding, He Did It Live

The third talk was delivered by Zion Developer Ecosystem Lead, Qin Mao Tim:

**"Rescuing Vibe Coding Developers Stuck on the Backend"**

It's getting faster and faster to build a frontend page with Cursor or Codex, but the database, APIs, authentication, AI Agents, and business logic behind the page still easily become an invisible black box that people are afraid to casually modify.

Tim presented the Zion Plugin as a way for coding agents to operate Zion's visual backend. He described a workflow that starts with a product requirement, configures database tables, permissions, agents and behavior flows, and then generates frontend code for API integration.

The most engaging part of this talk was Tim directly performing a Vibe Coding demo live.

He built an AI diet assistant on the spot: after inputting food or uploading a photo, the system calls AI to analyze calories, generate suggestions, write results to a real database, and trigger a Feishu notification at the same time.

When inputting "A bowl of Luosifen with fried egg and iced cola" live, the system quickly gave a suggestion: It's best to go for a run on the track tonight.

Everyone laughed while watching the frontend, database, Agent, and behavioral workflow truly run. Compared to a pre-recorded demo, this kind of live operation intuitively demonstrated how Vibe Coding continues from "making a page" to a complete application.

## Agents Need More Than Thinking, They Need a Real Execution Environment

The final talk was from FastGPT Solution Lead Rowan:

**"Making Agents Truly Work: From Models and Memory to Deliverable Applications"**

Rowan's talk focused on FastGPT Agent V2.

Traditional workflows are suitable for tasks with clear paths: complete A first, then execute B, and finally reach C. But the execution paths of many real tasks cannot be completely determined in advance, and need to be constantly adjusted based on intermediate results.

Rowan described Agent V2 as first interpreting a goal and making a plan, then calling tools and revising the plan in response to intermediate results.

The setup Rowan presented used a separate Linux sandbox for each session. His explanation covered running Python, Node.js and shell commands, reading and modifying files, installing dependencies and using execution results to continue a task.

At the same time, session status, execution interruption, and task recovery also need to be managed.

After all, what really affects delivery is often not whether an Agent can start, but whether it can continue to complete the task after an error occurs halfway through execution.

## Sharing on Stage, Busy Off Stage

The Q&A and networking continued throughout the afternoon.

Some people were concerned about how to share memory across multiple Agents, some asked about the actual effects of mixture of models and intelligent routing, and some brought products they were developing to discuss backend, workflow, and Agent architectures live with the speakers.

When it came to break time, everyone didn't really disperse. Some continued to surround the guests for discussion, some introduced the projects they were working on to each other, and some who just met started exchanging contact information.

For a community event, these interactions happening outside the speeches are also a very important part.

## Thanks and event information

Thank you to Zong Yue, Chen Jiaqi, Qin Mao Tim and Rowan, and to the organisers, partners, volunteers and everyone who brought questions and projects to the event.

The [event archive](/en/events/hdx-7870619038900/) preserves the original programme and venue details. The [original Chinese recap](https://mp.weixin.qq.com/s/z_9W5AsV0yLTlzt6f-QCTA) is the source for this account.
