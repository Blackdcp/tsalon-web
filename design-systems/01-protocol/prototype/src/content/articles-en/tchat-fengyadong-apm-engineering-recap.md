---
title: "Feng Yadong on APM: Finding Problems, Tracing Causes, and Building a Team"
summary: A recap of all three recordings from T Chat episode 5 in 2022, covering APM across the development lifecycle, preventing regressions, diagnosing difficult incidents, emergency controls, professional growth, and winning trust for an in-house platform.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 26
author: editorial-team
topics:
  - APM
  - Mobile Development
  - Engineering
  - Career Growth
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-5
cover: /images/talks/tchat-5.jpeg
coverAlt: Feng Yadong discusses APM and engineering growth in T Chat episode 5
citations:
  - label: Feng Yadong's talk on ByteDance APM
    url: https://www.bilibili.com/video/BV1tU4y1Q7ig
  - label: Career conversation with Feng Yadong, part one
    url: https://www.bilibili.com/video/BV17U4y1Q7uz
  - label: APM conversation with Feng Yadong, part two
    url: https://www.bilibili.com/video/BV1AB4y1x7zk
tldr:
  - "Crash monitoring and startup work are the visible part: Feng started with two tasks that ordinary developers often recognize."
  - "From assigned work to owning an area and a team: Asked about career stages, Feng started with the ordinary delivery task."
  - "Individual progress and team results reinforce one another: Feng thought better individual judgment and skill could improve designs, speed, and outcomes; a growing business then creates harder problems that develop the individual further."
faq: []
featured: false
draft: false
translationOf: tchat-fengyadong-apm-engineering-recap
translationStatus: reviewed
seo:
  title: Feng Yadong on APM and Engineering Growth | T Chat
  description: Feng Yadong discusses application performance monitoring, regression diagnosis, incident response, platform adoption, and team growth.
  noindex: false
---

> These videos were published in 2022. Technical conditions, personal circumstances, and opinions described here reflect that time.

After optimizing startup, how can a team stop the next few releases from making it slow again? Why can a crash stack still fail to reveal the cause? And how does an in-house monitoring platform persuade a product team that already uses another service to adopt it?

Feng Yadong used those questions to explain the work of application performance management in T Chat episode 5, published in June 2022. He said he had joined ByteDance in 2016, focused on APM from late 2017, and participated as its platform grew. The recordings contain a roughly 40-minute technical talk followed by conversations of about 32 and 27 minutes on career development and platform adoption.

## Technical talk: APM belongs throughout development

### Crash monitoring and startup work are the visible part

Feng started with two tasks that ordinary developers often recognize. A newly released version crashes, so a lead sends the developer a link to the issue; or years of new features slow down startup, and a team undertakes an optimization project. Both are APM work, but neither describes the whole field.

He wanted APM involved in coding, testing, integration, staged rollout, production, and subsequent improvements. The question changes by stage. Before release, expose risks as early as possible. During staged rollout and production, detect abnormal behavior quickly, establish a cause and owner, and reduce its impact. Afterwards, repair the underlying fault and strengthen whatever earlier checks missed it. The end is a better experience for users and a clearer way for developers to solve problems.

### Find problems before release when possible

Feng associated each stage with concrete tools. While writing Objective-C or Swift, Lint can flag some risky patterns. During local debugging, memory checkers can help find invalid pointers, out-of-bounds access, and leaks, while profilers reveal expensive work. Testing adds randomized stability runs, device compatibility, functional and performance checks, unit tests, and smoke tests. The aim is to find problems at a less expensive point, not to declare a release safe after one tool run.

These methods complement each other. New business behavior, different devices and runtime conditions, and changes in server-provided data can all expose problems that tests did not find. A client may crash even though its own binary did not change if an API suddenly returns an incompatible field. Pre-release checks and post-release observation therefore both matter.

### Connect detection, cause, and the person who can act

For staged rollout and production, Feng described stability signals such as crashes, out-of-memory exits, and hangs, along with startup, CPU, frame rate, network, and resource use. A platform has to see a meaningful increase, determine whether the same period included an API or experiment change, and send the issue to someone who owns the relevant component. If developers must discover a problem by checking email and repeatedly ask who is responsible, valuable response time is lost.

Some failures cannot be explained by a stack alone. Developers should record relevant events and logs at risky points while building the feature, then retrieve the records for an affected user or a group of similar users. Shared characteristics may reconstruct the circumstances behind the fault. This preparation must happen before the incident; missing events cannot be inserted into an already finished session.

### An emergency control is followed by a real fix

Native client code normally cannot be replaced instantly across all users the way a server deployment can. Feng therefore included dynamic degradation, fallback, and rollback capabilities in his view of APM. An Objective-C runtime safeguard or Android patching mechanism might reduce the impact of some failures when the app has already been designed and allowed to use it. Such mechanisms are not a promise that every client defect can be repaired without a release.

Emergency action is only the first step. A permanent fix must still move through the release process. Serious incidents also need a review, changes to tools or tests, and a check that the corrective actions were actually adopted. Otherwise, the same kind of fault can return in the next cycle.

## Three persistent challenges: Regressions, root causes, and response

### Make a one-time optimization last

Feng asked the audience to imagine that a release improves startup by about half a second. Each subsequent feature adds a little work to the launch path; after several versions, the gain may disappear or even turn into a regression. The illustrative amount matters less than the pattern: optimization done once and never checked again decays with continued development.

His measures increased in strength. First, cultivate a developer's habit of checking the impact of a change. Second, automate repeated stability and performance tests so they do not depend on someone remembering to run them under business pressure. Third, make blocking checks part of merge and release gates. A merge request might run static checks; before staged rollout, a version-wide performance or stability test might block a known serious regression until it is addressed.

The gate still needs sensible rules and thresholds. Feng used charts about when defects are introduced and how repair costs grow at later stages to motivate earlier testing. Their particular percentages and multipliers are not universal statistics for every team. The point is to detect a problem before it reaches a stage where diagnosis, coordination, and user impact are more expensive.

### A stack shows the crash location, not always its cause

Two examples showed the gap. A stack containing almost only system functions does not identify the business change to fix. A system memory log may show that an app was terminated for high memory use without saying which objects created the pressure. Feng separated two further questions in memory diagnosis: allocation stacks help answer who allocated the memory; an object graph and references help explain why the objects are still retained.

He cited approaches that associate allocations with call stacks and described a team's online memory-graph analysis. The graph can enumerate objects and types, show large groups, and follow references toward a business owner. The approaches provide different evidence. If one is missing, the team may still not know what should change. No single tool is a guarantee of complete diagnosis for every memory problem.

### Get as close as possible to the first faulty action

His example used two business areas. Code in area A writes beyond an allocated region and corrupts an object belonging to area B. Area A continues; only when B uses the object later does the app crash. The final stack points toward B, which is a victim rather than the origin. A detector that reports the call stack when A first writes invalid memory can keep the investigation near the real cause.

AddressSanitizer offers this kind of reasoning during development, but its instrumentation and overhead are not something to place unchanged into every production app. Feng described an internal online capability aimed at similar cases. He did not publish its full implementation or a general guarantee for coverage, detection scope, or performance cost. The essential distinction is between detecting an illegal operation early and simply running an existing debug tool in production.

### Non-crashing failures also need a recorded path

Broken UI, distorted video, or audio errors may leave no explanatory crash. Feng returned to logs: Did an API return an error? Did a field match the agreed type? Which step of a critical process was reached? Even such ordinary events can narrow the cause.

Writing a local log and operating a diagnostic system are different tasks. A team also needs a way to retrieve relevant records, analyze them, and connect those of multiple users or scenarios. The platform must offer the facilities, while business developers must decide where an event is meaningful. Capturing everything without that judgment produces noise rather than an answer.

### Prepare the ability to limit damage before the incident

Feng imagined a third-party SDK causing many startup crashes. The team has no source for it, and waiting for app review and user updates may take too long. What it can do immediately depends on preparation: a remote switch for a nonessential capability could stop its initialization and let people reopen the app. The capability would be unavailable in the meantime, so the trade-off depends on the impact. If a server response or A/B experiment changed at the same time, rolling that change back may be more direct.

He also mentioned startup protection, such as a recovery path for someone whose app crashes repeatedly during launch. Every option presupposes an existing control or recovery mechanism. Disabling a feature can itself harm the experience; the objective is to reduce losses while a proper repair proceeds.

## Tools and directions shown in the presentation

### Different tools answer different diagnostic questions

Feng showed a developer performance workstation designed to make analysis easier to start. A connected device could provide runtime metrics; with symbols, the developer could examine expensive calls through flame graphs and thread states. He described using it to investigate CPU, memory, storage, power, frame rate, and other signals, even in some situations where the app was already running. Actual access and depth depend on the environment and available symbols.

In his memory-graph example, a large group of image objects occupied substantial memory. Following references led toward a business callback that still held them. Only then could the team ask whether caching policy or decoding multiple large images was the cause. The important extra step is explaining why the objects remained, rather than merely observing a large total.

A third demonstration used a core dump to retain some registers, stack, and memory state from a crash and inspect it with a debugger. This can make pointer-related incidents more understandable than a stack trace alone. It records parts of a scene, not every earlier action or all memory. The three tools respectively addressed running behavior, object ownership, and an error scene; their demonstrated powers should not be assumed for an arbitrary app.

### Bring monitoring back to a developer's business context

Feng ended with earlier detection, broader automated tests, less manual movement from alert to owner and response, and monitoring that relates to the developer's actual feature. He contrasted the common service-level dashboard watched by a backend owner with the mobile app's aggregate metrics. A developer responsible for one page may not know what to do with an entire app's startup or crash numbers.

Grouping measures by page, scene, or module and connecting them to relevant server signals could make the data usable in day-to-day client work. It was a direction he wanted to pursue, not a completed universal dashboard shown in the recording. He also wanted experience from difficult incidents shared across products so the same causes did not have to be rediscovered by separate teams.

## Career conversation, part one: Growing capability and responsibility

### From assigned work to owning an area and a team

Asked about career stages, Feng started with the ordinary delivery task. A newcomer should produce code of reliable quality and finish efficiently, learning from the design and debugging problems encountered. Someone responsible for a direction must begin discovering issues independently, planning medium-term work, designing solutions, and taking the project through completion while helping less experienced colleagues.

A team lead also needs to understand the business stage, identify the main bottleneck, compare alternatives, plan over a longer period, and fit work to people's abilities. Being an excellent engineer does not automatically mean the whole team works well. As the scope of responsibility expands, the measure of success changes. These are distinctions in responsibility, not a mandatory timetable for promotion.

### In school, connect interest, goals, and information

Feng studied communications engineering. The course exposed him to relevant subjects, but programming and software activities helped him discover that he wanted to pursue software development. A major's name does not decide what a student will enjoy doing. He suggested trying work and projects, then setting a near-term aim: graduate study, studying abroad, or entering a specific development field require different preparation.

The host drew out the relationship: interest suggests where to invest attention, broader information corrects an early impression, and a goal converts the two into action. Feng encouraged students to talk to people who had already taken a path and read beyond their immediate surroundings. If the direction remains uncertain, exploration and conversations can be the next task rather than forcing an early fixed decision.

### Choose work by more than one condition

Feng described two career choices. In the first, a company reorganized its business and moved him to a direction he did not value as much. Even with a promotion opportunity, he sought an environment that better suited his growth aim. In the second, at ByteDance, he chose between remaining in business work and moving toward infrastructure. He was more interested in the underlying problems, and a shared capability could serve multiple products. Neither choice came with certainty about the future.

The host added that pay is a real consideration but should not be the only condition. Neither argued that every engineer should ignore income or imitate Feng's exact changes. He also advised seeking new challenges after familiar work becomes easy and learning how more experienced people handle problems, rather than measuring oneself only against the immediate team.

### An expert's value appears in solving problems and helping others

For a technical expert, Feng first emphasized professional depth. When a team faces an architectural problem, a performance bottleneck, an urgent failure, or an old unresolved incident, is this someone colleagues seek out and trust to move the problem forward? A title alone does not provide that evidence.

An expert also needs a view of how the field is changing, a workable proposal, and the ability to help engineers at different stages execute it. Formal management responsibility is not necessary for helping others. The value grows when a difficult solution becomes a repeatable method the team can use.

### Reading and the qualities he looked for

Asked for reading material, Feng distinguished habits in daily programming from deeper systems knowledge. He mentioned iOS memory and threading books and the Effective series for noticing design choices and risks. For infrastructure work, he recommended learning about linking, loading, memory, and operating-system principles, including the book on linking and loading he named in the conversation. Some examples in older books use other platforms or outdated versions; their concepts need to be compared with current toolchains.

Articles, newsletters, conferences, and discussions can provide a stream of leads. He did not expect every item to be studied immediately in full. Knowing that someone has solved a similar class of problem, and where the original material is, helps when the problem appears at work.

He valued computer-science foundations, understanding of a concrete field, communication, collaboration, and the initiative to move work along. A person without APM experience can still demonstrate depth by explaining the layout and rendering details of an interface they built. A representative piece of work explained well reveals more than a list of technologies encountered. Hiring needs mentioned at the time may have changed.

## Career conversation, part two: Establishing value and trust for an in-house platform

### Needing APM does not mean building a whole platform

Feng traced the internal team's start to rapidly growing products and a thin layer of shared mobile infrastructure. Existing third-party monitoring covered common crashes, but not every failure type the team wanted to investigate; its alerting, attribution, and routing also did not connect as closely to their development process. Those gaps helped motivate in-house work.

When asked which teams need APM, he separated the capability from its implementation. A small team still needs to know if users cannot launch its product or a service is failing, but it can begin with an existing, open-source, or purchased system that fits its resources. As the product and engineering group grow, they can choose which deeper diagnostics justify investment. The comprehensive system in his talk was not a starting checklist for every company.

### Staff, priorities, and maintenance have to arrive together

Feng separated “client engineers write an SDK” from “a team continuously provides an APM service.” The SDK collects data, but a backend must receive, aggregate, and analyze it, and developers need an interface that turns the information into a usable diagnosis. Planning, tests, and long-term maintenance require owners too.

If backend engineers are only borrowed from another group for a month or two, a first version may be written and then left without support. Before deciding to build in-house, someone needs to secure responsibility across the whole chain and support for ongoing work. Priorities also depend on the product: online stability may come first, while a short-video experience makes smoothness and power use especially important. The plan should answer real user problems rather than reflect only the team's favorite tools.

### Convince a product team with comparable evidence

The host asked a blunt question: If a product already uses another platform, why should it switch to yours? “It is made internally” is not enough. Feng used illustrative numbers: if the incumbent sees 100 crashes in a comparable set and the new system sees only 90, the product owner has a reason to doubt the switch. Even if the counts are close, the platform team should inspect missing events. Did the SDK fail while collecting, or did the processing and reporting pipeline break?

The monitoring system itself needs logs and measures to reveal those gaps. Repeated comparisons of the same version and incident types can establish collection quality, SDK stability, performance impact, and added value such as hangs or memory diagnosis. A platform earns trust by explaining differences and agreeing in advance with the product team on the conditions for adoption, not by claiming it must be better.

### When adoption stalls, narrow the promise and deliver one thing well

Asked what had been most discouraging, Feng did not blame product teams for being “uncooperative.” A new crash-monitoring SDK that itself crashes, drains resources, or performs worse damages trust with each incident. He recalled months of difficult feedback early in the rollout. The team responded by limiting the initial scope, for example perfecting crash monitoring before promising every performance capability, and agreeing on measurable criteria for switching.

A smaller scope controls risk and makes quality easier to demonstrate. Repeated measurement, iteration, and communication made the platform more credible. The lesson is to answer what a product team gains and risks before asking it to change, not to rely on organizational authority.

### A mature platform can still have unsolved problems

After a few years, another question appeared: if familiar monitoring features exist, is the work now merely maintenance? Feng returned to the problems developers still cannot solve. Can an online crash always be attributed quickly? What long-tail memory, hang, or jank cases still resist explanation? Could an incident first discovered online have been exposed during testing? These are reasons to invest if they are genuine pain points. A complete-looking alert dashboard does not mean the diagnostic process is complete.

### Individual progress and team results reinforce one another

Feng thought better individual judgment and skill could improve designs, speed, and outcomes; a growing business then creates harder problems that develop the individual further. He suggested several working principles. Choose the solution that addresses the real cause rather than merely changing syntax until a symptom disappears. A platform team can apply a verified improvement to multiple products, and document it so others can use it. Sharing a technical result in different formats can spread knowledge efficiently.

The host added a practical constraint: a business team may have to accept a cost-and-benefit compromise, while a shared platform team may be justified in investing more deeply in common capabilities. Depth of investigation is valuable, but every task does not require the same level of effort.

The [episode 5 page](/articles/tchat-5/) links to all three full videos and their segments.
