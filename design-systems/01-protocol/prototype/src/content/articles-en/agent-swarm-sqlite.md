---
title: Agent Swarm Rewrites SQLite: Deep Dive into 5 Fatal Flaws and Architectural Reorganization
summary: An in-depth analysis of the latest Agent Swarm experiment. By leveraging tree decomposition, a custom high-speed VCS, neutral merge agents, and a stigmergic Field Guide, the swarm reached an 80% SQLite (Rust) test pass rate in four hours and eventually achieved 100%.
type: news
publishedAt: 2026-07-21
readingMinutes: 12
author: editorial-team
topics:
  - Agent
  - Engineering
  - Rust
cover: /images/logo-dark.png
coverAlt: Agent Swarm SQLite Experiment
citations:
  - label: Cursor Blog (Hacker News)
    url: https://cursor.com/blog/agent-swarm-model-economics
  - label: AIHot 发现
    url: https://aihot.virxact.com/items/cmrtxsl2e3o24bihzutblssoo
featured: true
draft: false
translationStatus: translated
seo:
  title: Agent Swarm Rewrites SQLite: Multi-Agent Collaboration Deep Dive
  description: A deep dive into the Agent Swarm experiment. Through tree decomposition, a 1,000 commit/sec VCS, and solutions to 5 concurrency traps, AI agents successfully rewrote SQLite in Rust and achieved a 100% test pass rate.
  noindex: false
---

When exploring the engineering frontiers of Large Language Models (LLMs), **Multi-Agent (Agent Swarm)** collaboration has always been highly anticipated. However, in actual complex software engineering tasks, multiple agents collaborating simultaneously often rapidly descend into code conflicts, context loss, and logical deadlocks.

Recently, a groundbreaking engineering experiment revealed a complete engineering pathway to overcoming this bottleneck: a research team tasked an agent swarm with rewriting the industry standard for relational databases—**SQLite**—from scratch using **Rust** (and strictly benchmarking against `sqllogictest`).

The results were thrilling: after applying a brand-new architecture, the swarm, powered by the Grok 4.5 model, reached an 80% SQL test pass rate in just 4 hours and eventually achieved a **100% pass rate**. In contrast, the control group—the "old swarm"—fell into total chaos and had to be terminated in less than 2 hours.

This article provides a deep dive into the core architectural innovations revealed in this experiment.

## 1. The Cornerstone: Tree Decomposition

The fundamental reason long-running monolithic agents fail lies in **memory and context conflicts**—they either drown in low-level details and lose their grasp on the global architecture, or write buggy low-level code in an attempt to maintain a global view.

The research team introduced a strict **Tree Decomposition** structure, explicitly defining two roles:
- **Planners**: Driven by the most capable (and most expensive) models, they break down macro goals into specific micro-tasks and delegate them. They *never* write implementation code, meaning their context windows never fill up with low-level details.
- **Executors (Workers)**: Driven by fast, inexpensive models. They ignore the global architecture and dedicate their entire context window to perfectly implementing a single, narrow block of assigned code.

This pattern closely mirrors agile R&D in modern tech giants: architects handle design and contracts, while frontline engineers focus on implementation and Test-Driven Development (TDD). It not only improves code quality but also achieves excellent **Model Economics** by pairing high and low models (e.g., a Fable 5 planner with a Composer 2.5 worker).

## 2. Infrastructure: A VCS Built for Silicon Life

When hundreds of agents work concurrently, traditional version control systems (like Git) instantly crash due to their coarse-grained concurrency locks. The swarm in this experiment reached an astonishing peak of **1,000 commits per second**.

To support this superhuman coding rhythm, the R&D team built a dedicated, ultra-fast Version Control System (VCS) for the agents from scratch. This VCS became the data bus for the entire agent ecosystem, where all state collisions are captured and resolved.

## 3. The 5 Fatal Flaws at 1,000 Commits/Sec and Their Solutions

Under extreme concurrency, the system exposed bizarre failure modes that human teams never encounter. The R&D team provided targeted solutions for each:

### Flaw 1: Split-brain design
**Symptom**: Two planners, unaware of each other, implement the same concept using entirely different logic in different parts of the codebase.
**Solution**: Prompt engineering forces Planners to make and record design decisions themselves, ensuring no decision overlap exists in the delegated task tree.

### Flaw 2: Contention between Planners
**Symptom**: Two planners aware of each other engage in a tug-of-war over the same files, trying to overwrite each other's logic. Merge tools cannot resolve conflicts in "perception of reality."
**Solution**: Introduction of "shared design docs." Any code depending on a decision must carry a compile-checked reference to the doc. When cognitive conflict occurs, a dedicated "Reconciler Agent" merges the docs and broadcasts the final resolution downstream.

### Flaw 3: Violent Merge Conflicts
**Symptom**: When facing merge conflicts, Workers lack the patience to absorb the other party's context. They either brutally overwrite the other's code or abandon their own commit entirely.
**Solution**: Introduction of a **Neutral Third-Party Merge Agent**. Similar to an open-source Merge Queue, its sole task is to efficiently and impartially resolve code conflicts for all parties.

### Flaw 4: Megafiles
**Symptom**: Certain core files (like `utils.rs` or core struct definitions) attract massive agent modifications. Because each agent only adds a few lines and no one refactors, the file quickly bloats. Transport, diff, and merge costs skyrocket, creating a performance deadlock.
**Solution**: Workers are allowed to flag "bloated files." Once flagged, the file is locked (new commits blocked), and a dedicated **Refactoring Agent** is awakened to forcibly decompose it into smaller modules.

### Flaw 5: Ossification
**Symptom**: Smart LLMs have learned a rule from training on human codebases: "Try not to touch core code." Consequently, when the swarm discovers a core architectural flaw, agents would rather write countless ugly workarounds than modify the core code.
**Solution**: Granting agents the **"Right to Intentional Breakage."** If an agent deems modifying a core library valuable, it can submit a focused patch outside its scope, accompanied by an explanatory comment. The compiler then propagates this "breakage" throughout the system, causing all modules relying on the old design to fail. When other agents encounter the error, they read the explanatory comment and update their modules to adapt to the new architecture.

## 4. Introducing "Stigmergy" and Stacked Reviews

In addition to the architecture above, the experiment validated two highly inspiring mechanisms:

- **Review Lenses**: Since a single Review Agent cannot catch everything, the system employs "multi-perspective blind reviews." Some reviewers only see code changes, while others only see execution logs. These decorrelated lenses stack together, achieving vulnerability interception rates far exceeding human levels at a very low inference cost.
- **Stigmergy and the Field Guide**: Inspired by biology, where ants coordinate the colony by altering their environment (stigmergy), the R&D team gave the swarm a fully autonomous folder called the `Field Guide`. Agents spontaneously record pitfalls and system quirks here. The system automatically injects `index.md` into every agent upon startup. This mechanism of **"environmentalizing knowledge"** turns the pitfalls of predecessors directly into the innate intuition of successors.

## Conclusion

The "Agent Swarm Rewrites SQLite" experiment declares to us: on the road to AI replacing programmers, **architectural innovations (like Tree Decomposition and custom VCS) are just as critical as the advancement of underlying models.** When infrastructure is no longer constrained by the cognitive limits of "carbon-based life," the next big bang in software engineering has already arrived.
