---
title: "Zhang Zeya on Frontend Engineering: Build, Release, and Quality"
summary: Zhang Zeya uses the complex Feishu Docs project to explain how a team chooses standards and tools, manages build cost, tests changes, releases safely, and measures usability.
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 19
author: editorial-team
topics: [Frontend, Engineering, Team Collaboration, Performance]
relatedEvents: []
relatedRecordings: [shenzhen-frontend-challenges]
cover: /images/default-cover.svg
coverAlt: Generic cover for a historical T Salon Shenzhen frontend talk, not a photo of the guest or event
citations:
  - label: Frontend Challenges and Opportunities Part 3, Frontend Engineering by Zhang Zeya
    url: https://www.bilibili.com/video/BV1HY4y1r7rJ?p=3
tldr:
  - "Engineering covers the whole lifecycle: As frontend applications grew more capable, they also became harder to maintain and coordinate."
  - "Why micro-frontends did not make all the weight disappear: In a back-office system whose navigation already separates products, subapplication boundaries can be natural."
  - "What remained unfinished at the time: Zhang compares engineering to diagnosis and treatment: begin with symptoms, then choose an intervention."
faq: []
featured: false
draft: false
translationOf: shenzhen-zhang-zeya-engineering-recap
translationStatus: reviewed
seo:
  title: Zhang Zeya on Frontend Engineering | T Salon
  description: Feishu Docs examples show how to choose engineering work, speed local builds, coordinate tests and gradual releases, and measure when users can act.
  noindex: false
---

Zhang Zeya treats frontend engineering as the work of organizing development around concrete problems. In a complex product, writing code is only part of the path. Waiting and coordination across requirements, debugging, building, testing, and releasing determine whether a team can deliver reliably.

> This is part 3 of the Shenzhen recording on frontend challenges and opportunities; the original event article was published on May 9, 2022. Zhang describes his experience in Feishu Docs and earlier teams at the time. Tools, figures, and plans belong to that historical setting.

## Engineering covers the whole lifecycle

As frontend applications grew more capable, they also became harder to maintain and coordinate. Zhang asks the audience why “frontend engineering” became a term at all, then points to growing business complexity and larger teams. The aim is to apply software-engineering methods to development, deployment, and maintenance, using standards, frameworks, and tools to address efficiency, quality, and performance.

A lifecycle runs from a requirement and technical review through development, integration, testing, and deployment. A simple site may be delivered by packaging files and uploading them. A collaborative document product needs more. Scaffolds, build optimization, and pipelines are techniques within that lifecycle; any one of them alone is not an engineering system.

A team can observe its actual workflow, make useful conventions explicit, and enforce the important ones through tools. A shared platform can connect scattered capabilities so developers are not constantly moving between sites. Scaffolds help create projects; solutions for SSR or localization address particular needs; together they can form a framework. Zhang favors capabilities that can still be adopted separately, rather than forcing every team to take the entire package.

## Different perspectives bring different benefits and constraints

Zhang changes perspective several times. A small business team may need a quick local server and a functioning release path, with little benefit from many rules. A complex team may value consistent governance to keep many changes from colliding. A platform team may turn one capability, such as cloud builds, into a low-cost service for other teams.

An individual engineer faces the learning cost of a framework and the restrictions of its standards. A complete system can improve the team's overall throughput while making one person's immediate edit feel slower. Zhang does not deny that cost. The design should care about developer experience, while the final evaluation must ask whether the whole team can deliver better, not only whether one action takes fewer keystrokes.

## Check the business stage and a measurable pain point first

He begins with two principles: no solution fits every team, and engineering investment has to match the product's stage. When the basic product is still unfinished, pouring scarce people into infrastructure may not pay off. Ignoring future growth entirely can leave a debt that a later team struggles to clear.

A good starting point is observable waiting or failure: project startup, hot update time, test coverage, build duration, or release time. Feishu Docs provided a concrete example: after a developer saved code, local hot updating could take more than ten or twenty seconds. That is easier to act on than the vague statement that “the project feels heavy.”

The team also has to look ahead. If the user base and codebase grow, will today's structure still support change? How much time and staffing can be devoted to engineering work now? Existing company facilities or suitable open-source tools should be considered before building a new platform for its own sake.

Standards extend beyond lint and Git workflow. Should directories be grouped by feature or file type? Which dependencies between modules are permitted? What language and interface conventions will make the code comprehensible? Common tasks should be accessible in the IDE or CLI where developers already work, not spread across addresses they must remember.

## Move from rules to automated flow, rather than adding ceremony

Zhang says he did not take part in the initial foundation of Feishu Docs, so he uses earlier teams to explain a common sequence: establish a workflow, provide business-specific scaffolds, add framework capabilities, build reusable components, and connect the steps through automation.

In a weekly version involving dozens or even hundreds of people across teams, manually moving through build, test, gradual release, and notification can become a large task in itself. A robot can call the next people at the scheduled point and move an approved step along. Human reviewers remain responsible for judgment. Code conflicts, for example, still require people who understand the changes. Automation removes repetitive coordination rather than pretending no one owns the result.

## Five problems in Feishu Docs

Zhang first describes what the company already provided: code hosting, online builds, deployment, monitoring, bots, open APIs, and services such as functions developers could use for custom tools. The product team's engineering often joined those capabilities rather than creating every layer from scratch.

The harder problems came from the product. Paying business customers expected stability. Years of change had grown the document project into a slow, large codebase. Features from different teams could affect one another through styles, state transitions, or memory leaks. Product owners wanted quicker iteration, while engineering faced the risk of a great deal of code entering each weekly version. The broad context made it hard for one developer to diagnose every issue alone.

A customer report might bring person A into a discussion, then B, then C, until many people were trying to reconstruct ownership and the sequence of events. That is a symptom of complexity not fully expressed by the project's boundaries and tools. These are five connected problems, not five isolated plugin settings.

## Dependencies, compilation, and directories reduce different costs

For installation, the team moved to pnpm at the time and used dependency descriptions and lockfile information to decide whether an existing installed snapshot could be reused from a shared store. This targeted repeated installation.

For compilation, they cached webpack's intermediate results and tried preparing relatively stable dependencies in advance so every local build would not process them again. They also experimented with a faster builder for local feedback. Zhang separates that development-time choice from production compatibility and correctness. His description is a historical tradeoff, not a verdict that one builder is universally unsuitable for production.

Code organization moved from gathering files by type toward grouping by feature. A directory with hundreds of components or state files imposes a search and reasoning cost. Bringing related code closer makes responsibilities easier to find. Renaming directories, however, does not automatically untangle business dependencies.

## Why micro-frontends did not make all the weight disappear

In a back-office system whose navigation already separates products, subapplication boundaries can be natural. Documents are different. A single document can contain tables and other content, and the same capability can be used in several contexts. Modules have real dependencies.

This qualifies the earlier proposal to split a large project to improve hot updates. Before separation, some code has to be refactored and decoupled. Even independently developed subapplications may depend on a large common base that still has to run locally. Micro-frontends can reduce a portion of the compilation scope while introducing integration and runtime costs. Zhang says slimming and restructuring the shared base remained work to do.

## Source maps must be usable and access-controlled

Production debugging needs a way to map an error back to source, but the team did not want source maps published beside open static files, where they might expose code. The talk describes doing some generation and upload outside the main release wait, then storing the maps in a privately controlled place.

The build also includes code, bundle-size, and security checks. The map decision has to answer two questions together: can an engineer retrieve the exact version when investigating, and must a normal deployment wait for every auxiliary artifact? Security, diagnosability, and release speed cannot be designed as unrelated switches.

## How to check many people's changes together

Each feature passing its own tests does not mean the combined version is safe. The team inserted checks at several stages. Developers could build a local test package and reach it through a URL query parameter, avoiding a full deployment for every check. A prerelease environment let a fixed group try the version before wider use.

Unit and end-to-end tests ran in continuous integration. Zhang emphasizes that installing a test framework is easier than writing tests that capture a real document feature's behavior. Before a weekly version entered release, testers spent several days on integration testing of the combined code.

After that, exposure widened in steps: the immediate team, a broader Feishu audience, then a larger internal ByteDance group, followed by regression checks before full launch. Frontend asset hosting and configuration selected the version delivered to each group. A custom pipeline reduced manual work across prerelease, online, and multiple regional environments.

These layers answer different questions. Passing a unit test cannot stand in for integration with other teams, and one internal group using a version does not establish that it is safe for every customer. The particular schedule is a 2022 team practice, not a universal release rule.

## Visible is not the same as usable

Zhang separates Time to View from Time to Use. Server-side rendering can make content visible earlier, but a complex document may still be initializing and unable to respond. Project size, loading after micro-frontend separation, and a weak connection can all affect when a user can actually edit.

In his example from the time, usable waiting could be around four seconds and stretch toward ten seconds or more in weak-network or tail cases. A person opening an important document may see content but still be unable to work with it. The team wanted a performance report for every version to show which indicators improved or regressed and how users were affected. These numbers are not a claim about Feishu Docs today; the durable distinction is between appearance and readiness to act.

## A three-layer approach to joining platforms

Zhang draws three layers. At the top are developer-facing tools: local development, scaffolds, IDE extensions, CLI, CI, and bots. In the middle, business-specific APIs collect the capabilities the team needs and hide the differences between company services and self-built ones. At the bottom are building, deployment, version and gradual-release management, frameworks, and components.

He imagines developers spending most of their time in VS Code, the browser, and Feishu. IDE tools and CLI commands handle local work, the browser debugging, and bots coordination. The middle API calls company build, deployment, code, and open platforms as well as the team's own release tools. It can also decide whether a micro-frontend developer uses an online base or a local base. Shared components and design language help products and platforms remain consistent.

The point is not another giant portal. It is to stop making a developer leave their working environment repeatedly to find the next control.

## What remained unfinished at the time

Zhang compares engineering to diagnosis and treatment: begin with symptoms, then choose an intervention. A familiar tool may address one issue quickly; a deeply coupled project may need disruptive surgery. He does not claim that every one of the five problems was solved.

His next directions included work deeper in the compiler and build path, a more seamless experience across IDE, browser, and messaging, and automated coordination for review, approval, testing, fixes, and release. The team had an early performance-reporting capability but wanted a stable, independent performance lab. It would compare relevant products, produce regular and per-version reports, and support analysis before, during, and after incidents.

Separating the measures already in place from these ambitions is necessary to understand engineering as continuing work, rather than a platform installed once.
