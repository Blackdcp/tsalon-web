---
title: "Event Recap: From AI Demo to Production｜Engineering Practices for Agent and AI Native Applications"
summary: "A recap of the 'From AI Demo to Production' offline event held in Shanghai on August 1st, featuring four guests sharing engineering practices on persistent Agent memory, multi-model collaboration, Vibe Coding, and Agent execution environments."
type: field-note
publishedAt: 2026-08-03
readingMinutes: 5
author: editorial-team
topics:
  - AI Native
  - Agent
  - Engineering Practices
relatedEvents:
  - hdx-7870619038900
cover: /images/events/hdx-7870619038900.jpg
coverAlt: AI From Demo to Production Event Poster
citations:
  - link: https://mp.weixin.qq.com/s/z_9W5AsV0yLTlzt6f-QCTA
    title: "Event Recap: From AI Demo to Production｜Engineering Practices for Agent and AI Native Applications"
featured: true
draft: false
translationOf: ai-demo-to-production-recap
translationStatus: reviewed
seo:
  title: "Event Recap: From AI Demo to Production｜Agent & AI Native Applications"
  description: "On August 1st, we hosted the \"From AI Demo to Production\" offline event in Shanghai. This recap summarizes the insights shared by our guests from MemTensor, PPIO, Zion, and FastGPT."
---

On August 1st, we hosted the "From AI Demo to Production | Engineering Practices for Agent and AI Native Applications" offline event in Shanghai.

We invited four guests from MemTensor, PPIO, Zion, and FastGPT.

Without too many grandiose trend predictions, everyone basically talked about what they are currently working on: how AI forms long-term memory, how multiple models cooperate, how Vibe Coding can overcome the backend hurdle, and how Agents truly execute tasks.

The Q&A sessions on-site were also more active than expected. After several talks ended, many friends continued to surround the speakers for discussion, and the scheduled break naturally turned into another discussion session.

## What AI Remembers is Not Just Chat History

The first talk was from MemTensor, delivered by Memmy R&D lead Zong Yue:

**"Make All AI Remember the Same You: Memory Architecture and Engineering Practices of Memmy and MemOS"**

We might use Cursor, Claude Code, Codex, and various Agents at the same time every day, but once we switch tools, many things need to be explained from scratch.

Zong Yue shared Memmy and MemOS, focusing not just on "saving chat history", but on making AI remember how a task is progressed: what decisions were made previously, where it failed, how it finally recovered, and which experiences can be reused in the future.

The records left from a single task can also gradually precipitate from original trajectories into strategies, scene cognition, and reusable Skills.

Of course, AI remembering more doesn't necessarily mean better. How to correct false memories, how to isolate data from different users and projects, and how to handle risks in historical content are also problems that must be solved before the memory system is truly put into use.

## Not Just Choosing Models, But Also Teaming Them Up

The second talk was delivered by PPIO AI Cloud Project Engineer Chen Jiaqi:

**"Smarter Tokens, Cheaper Intelligence: The Engineering Practice of PPIO Intelligent Model Gateway"**

In her talk, Chen Jiaqi proposed a very interesting concept: Token Intelligence Density.

Simply understood, it means whether you can get a better result by spending the same Token.

The first method provided by PPIO is to let multiple models participate together. Different models make their own judgments, then extract consensus, find divergences, and finally fuse into a single answer. It's somewhat like inviting several experts specialized in different areas for a joint consultation.

The second method is intelligent routing.

Simple tasks like translation, polishing, and format conversion can be handed over to more suitable and lightweight models; when encountering in-depth research, code engineering, and complex decision-making, it switches to more capable models.

The point is not to blindly choose the cheapest model, but to assign suitable tasks to suitable models, making both the effect and cost more reasonable.

## Tim Didn't Just Talk About Vibe Coding, He Did It Live

The third talk was delivered by Zion Developer Ecosystem Lead, Qin Mao Tim:

**"Rescuing Vibe Coding Developers Stuck on the Backend"**

It's getting faster and faster to build a frontend page with Cursor or Codex, but the database, APIs, authentication, AI Agents, and business logic behind the page still easily become an invisible black box that people are afraid to casually modify.

The Zion Plugin shared by Tim allows Coding Agents to directly operate Zion's visual backend.

Users only need to describe product requirements, and AI can configure database tables, permissions, AI Agents, and behavioral workflows, then generate frontend code, completing a real API integration.

The most engaging part of this talk was Tim directly performing a Vibe Coding demo live.

He built an AI diet assistant on the spot: after inputting food or uploading a photo, the system calls AI to analyze calories, generate suggestions, write results to a real database, and trigger a Feishu notification at the same time.

When inputting "A bowl of Luosifen with fried egg and iced cola" live, the system quickly gave a suggestion: It's best to go for a run on the track tonight.

Everyone laughed while watching the frontend, database, Agent, and behavioral workflow truly run. Compared to a pre-recorded demo, this kind of live operation intuitively demonstrated how Vibe Coding continues from "making a page" to a complete application.

## Agents Need More Than Thinking, They Need a Real Execution Environment

The final talk was from FastGPT Solution Lead Rowan:

**"Making Agents Truly Work: From Models and Memory to Deliverable Applications"**

Rowan's talk focused on FastGPT Agent V2.

Traditional workflows are suitable for tasks with clear paths: complete A first, then execute B, and finally reach C. But the execution paths of many real tasks cannot be completely determined in advance, and need to be constantly adjusted based on intermediate results.

Agent V2 will first understand the goal, make a plan, and then call tools to execute. When finding the results are incorrect, it can also modify the plan and continue trying.

To make Agents more than just advice-givers, FastGPT also provides an independent Linux sandbox for each session. Agents can run Python, Node.js, and Shell inside, read and modify files, install dependencies, and continue processing tasks based on execution results.

At the same time, session status, execution interruption, and task recovery also need to be managed.

After all, what really affects delivery is often not whether an Agent can start, but whether it can continue to complete the task after an error occurs halfway through execution.

## Sharing on Stage, Busy Off Stage

The Q&A and networking continued throughout the afternoon.

Some people were concerned about how to share memory across multiple Agents, some asked about the actual effects of mixture of models and intelligent routing, and some brought products they were developing to discuss backend, workflow, and Agent architectures live with the speakers.

When it came to break time, everyone didn't really disperse. Some continued to surround the guests for discussion, some introduced the projects they were working on to each other, and some who just met started exchanging contact information.

For a community event, these interactions happening outside the speeches are also a very important part.

## Thank You to Everyone Who Supported the Event

Thank you to our four guests, Zong Yue, Chen Jiaqi, Qin Mao Tim, and Rowan, for being willing to bring the products, technical solutions, and real experiences they are practicing to the scene.

Thank you also for the support of all organizers, co-organizers, and partners, and thank you to every friend involved in preparation, communication, check-in, photography, and on-site execution.

And most importantly, thank you to everyone who came to the event that day.

Every registration, forward, and question, every post-event interaction, made this event not just four speeches on stage, but a true community meetup.

The event is over, but new exchanges and collaborations may have just begun.

Thank you all for your support, see you at the next one.
