---
title: "Kabi on Bilibili's Mobile Architecture: Modules, Monorepo, and Evolution"
summary: "A recap of three T Chat episode 3 recordings: Kabi discusses the practical tensions of modularity, Monorepo, generated APIs, and declarative UI, then answers questions on technology choices, architecture careers, refactoring, cross-platform tools, tests, low-code systems, and hiring."
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 27
author: editorial-team
topics:
  - Architecture
  - Mobile Development
  - Monorepo
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-3
cover: /images/talks/tchat-3.jpeg
coverAlt: Kabi discusses Bilibili mobile architecture and the growth of an architect
citations:
  - label: Kabi's talk on architecture at Bilibili
    url: https://www.bilibili.com/video/BV1jB4y1R7fj
  - label: One-to-one conversation with Kabi, part one
    url: https://www.bilibili.com/video/BV1Z54y1d7aq
  - label: One-to-one conversation with Kabi, part two
    url: https://www.bilibili.com/video/BV1j54y1o7v5
  - label: Official Protocol Buffers overview
    url: https://protobuf.dev/overview/
  - label: Android's explanation of declarative UI
    url: https://developer.android.com/develop/ui/compose/mental-model
tldr:
  - "Why modularity can depart from its intended shape: Kabi made familiar terms such as high cohesion and low coupling concrete with two extremes."
  - "Refactoring must work with the business and the team: For refactoring, Kabi used the analogy of a city's drainage system."
  - "Curiosity, depth, and ownership in hiring: For mobile candidates, Kabi first valued the willingness to investigate and the ability to find documentation."
faq: []
featured: false
draft: false
translationOf: tchat-kabi-mobile-architecture-recap
translationStatus: reviewed
seo:
  title: Kabi on Bilibili Mobile Architecture | T Chat
  description: Kabi discusses modularity, Monorepo, generated APIs, declarative UI, refactoring, testing, cross-platform systems, and architecture careers.
  noindex: false
---

> These videos were published in 2022. Technical conditions, personal circumstances, and opinions described here reflect that time.

In T Chat episode 3, Kabi began with familiar engineering situations to explain his work on mobile architecture at Bilibili. He said he had joined in 2014 as an iOS developer and subsequently worked on business features, playback, and technical architecture, while also learning about Android, Web, and server-side work.

One question runs through the episode: as the business, codebase, and number of contributors grow, how can architecture help people keep delivering? His answers involve repositories and APIs, but also whether developers actually want to use a proposed design, how refactoring receives resources and recognition, and how a design performs as the product changes.

## Technical talk: Design around how people actually work

### Why modularity can depart from its intended shape

Kabi made familiar terms such as high cohesion and low coupling concrete with two extremes. A networking or logging library has a relatively clear scope and can remain distant from business features, but its caller may have to assemble many steps. A business module, wishing to offer “one call and it works,” may instead absorb context lookup, navigation, and presentation. An architect can draw cleaner boundaries, but developers under a deadline still bear the communication and integration cost. If the recommended design only adds friction, they may return to the familiar one.

He argued that bottom-layer tools, common components, and upper-layer business code face different users and delivery conditions. Splitting a capability into many small pieces can push assembly onto callers. Putting every step inside one module can make it pleasant to call but concentrate dependencies and future changes. This is an engineering trade-off, not a new definition of cohesion or an assertion that a tool library should always have low cohesion.

He also compared growing system complexity with the limited amount a person can hold in mind. The curve was a metaphor for why bugs become hard to reason about as relationships multiply, not a mathematical forecast of a project's defect rate.

His youth-mode dialog example gave the tension a face. The dialog can appear from multiple pages, so its placement depends on navigation context and view hierarchy. A simple `static` presentation entry does not ask the caller for that context; the module must look for a global window and choose a display location internally. The caller saves effort, while testing and reuse become less predictable. Kabi even compared developers to a cat that cannot simply be ordered to behave differently: a technically “correct” module boundary will not stick if the interface ignores real work pressure. An architect needs to make the better path usable.

### Automation, predictability, and declarative expression

Kabi offered several principles in response: automate repetitive work, be cautious about adding an intermediate layer, and prefer predictable results. Clear inputs should lead to comprehensible outputs, making the system easier to reason about, test, and coordinate. His interest in reproducible build systems illustrated the goal of removing unnecessary uncertainty.

Declarative programming was another line of thought. Instead of specifying every operation needed to update an interface, it describes the desired state. When page data changes, the developer can describe the UI for the new state and let a framework organize the update. This does not eliminate state management; it makes clear state and inputs more important. Kabi connected this change to React, SwiftUI, Compose, and his team's own experiments. Android's [declarative UI explanation](https://developer.android.com/develop/ui/compose/mental-model) describes the same general model.

### Monorepo supports shared evolution across businesses

The first practice was Monorepo. Bilibili's engineering work extended beyond one video app: live streaming, commerce, editing, shared libraries, and cross-platform audio/video capabilities all had code that needed to evolve. Kabi described a large number of build units and developers. In that setting, a base-library change can affect many callers; having their source together makes it possible to change the library and its users in one coordinated commit.

He questioned mechanically imposed barriers between business modules that genuinely need to communicate. If two modules are first prohibited from calling one another and then reconnected through a routing bus merely to satisfy an isolation rule, the intermediate mechanism may be adding cost rather than solving a real problem. This is not a claim that all routers or decoupling mechanisms are useless; the boundary must fit the actual dependency.

The architecture still used more than one distribution path. A central binary-component repository served smaller apps that did not need the whole source tree. Monorepo and component distribution had different roles. The monorepo also carried costs: more code to obtain and an unfamiliar build system for some developers. Its benefits depended on accompanying engineering practices, not just placing files in one directory.

### One definition reduces duplicated client-server conversion

The second practice concerned communication between clients and services. Kabi first described the traditional coordination burden: teams agree on JSON fields, then independently decide where a value lives in a path or request body and each write conversion code. The freedom of an HTTP API can become ambiguity when the agreement is only informal.

The team's BAPI approach drew on Google API ideas. A centrally managed Protocol Buffers definition described a service, its request, and its response. Kabi used Bilibili's “one-click triple engagement” action as an example: one definition generated Kotlin and Swift calling code and a Go service entry. This reduces repeated structural conversion and mismatches between endpoints. It does not decide the business meaning of success, how errors are communicated, or how an API changes over time. Those still require agreement. The [Protocol Buffers overview](https://protobuf.dev/overview/) explains the general mechanism for generating code from `.proto` definitions.

### Combine language, UI, state, and dependency management

The third practice was a mobile design direction Kabi was advancing in 2022: a modern language, declarative UI, Model–View–Intent (MVI), and dependency injection. On Android he discussed Kotlin, Compose, ViewModel, and dependency-management tools; on iOS the team used internal pieces to align similar ideas with its deployment requirements. The intention was to make the relationships between view state, actions, and services clearer, not to claim both platforms shared identical source code.

In the example, a page declares its button and layout and also identifies the service it needs. The Activity supplies a service at the page boundary, and child nodes obtain it through the agreed dependency mechanism. They do not each have to search for a global object, and a test can provide a controlled substitute. The team kept familiar Activity and Fragment navigation rather than declaring every part of page organization anew. That constrained the migration: improve the important state and dependency problems without replacing every working convention. Kabi said SwiftUI was not yet directly usable under their conditions, another reason for an internal iOS counterpart rather than a literal copy.

### Architecture has a life cycle

At the end, Kabi used cooperating systems in the human body as a metaphor for what he enjoyed about architecture: each part manages its own responsibilities while the parts work together toward a purpose. A software architecture also has a life cycle. Its best outcome may be to evolve and eventually give way to a better arrangement, not remain untouched forever.

## Conversation, part one: Choice, growth, and conditions for change

### Technology choices need principles first

Asked about technology selection at Bilibili, Kabi began with the ability to evolve. If an internal module has a poor interface, he did not want every future version to accumulate compatibility branches indefinitely. Unified source and automated migration can sometimes let a team update callers together. That claim applies to internal code within their control; it does not mean public APIs or already released client binaries can disregard compatibility.

He also valued capable new toolchains and a willingness to build in-house where a real need justified it, citing language changes and player technology. An existing external solution can still be the right choice; making something internally is not an end in itself.

The host asked why Kabi had changed from pushing solutions strongly to pushing less. His answer was direct: the same “please use this” sounds like a suggestion early in a career, but can sound like an order once the speaker has more authority. When he stopped forcing adoption, he could see that some of his own solutions had not been good enough. Use and non-use are both feedback about the interface, migration cost, and actual benefit. A new tool needs to prove its value in work, not only in an architecture presentation.

### How an architect keeps judgment grounded

Asked how someone becomes a mobile architect, Kabi said the subject was too broad for a universal recipe and offered his own practices. The first was to keep writing code. Even if someone else implements a requirement, he could take the same specification, write a version himself, and compare the result with the team's. A difference opens a useful discussion; the exercise also makes API friction, dependencies, and debugging costs tangible to the person proposing designs.

The second practice was studying adjacent and upstream technologies: Android, iOS, Web, and server-side work often face related problems with different solutions. The third was forming one's own principles after reading and listening widely. He would hear many opinions, then decide according to the problem at hand. These habits need not begin only after receiving an architect title. Their scope changes as responsibility expands, and no number of hours guarantees expertise.

### Use another platform to understand your own

When the host asked what an engineer with a narrow stack could do, Kabi suggested Web as a source of ideas about state management, component composition, and declarative UI. The ideas raise questions for mobile development, but the platform implementations are not identical.

In the second conversation, an audience member who mainly wrote Objective-C asked for more specific guidance. Kabi then started with nearby Android examples. How do iOS delegate and data-source patterns for a list compare with Android's adapter? How does dependency injection work in each ecosystem? Comparing solutions can reveal a small, explainable improvement for one's own project. A useful change that the team can test and appreciate builds more trust than announcing a wish to “be an architect” before solving anything.

### Monorepo began with delivery pain

Kabi made the initial problem unusually concrete. Around 2018, modules were delivered as binaries. On release nights the team often could not assemble a working app package until late; then it had to debug version combinations and runtime faults. Going home before the early morning was rare. This was why a change was needed, not merely because Monorepo was fashionable.

The timing mattered. The codebase and its ownership were still manageable enough for a migration. Kabi described a difficult route, adjustments to repository organization, and different decisions for backend services. The main mobile project and small apps did not all adopt one pattern. Some developers disliked fetching so much code or learning new build tools. What he valued was coordinated changes across base libraries and callers, reuse across businesses, and better control of shared package contents. Those benefits required tooling and migration effort.

### Refactoring must work with the business and the team

For refactoring, Kabi used the analogy of a city's drainage system. Under deadline pressure, developers may need a controlled area that absorbs temporary compromises until a planned cleanup, rather than scattering them everywhere. It is unrealistic to demand complete redesign with every urgent feature, but indefinitely accumulating workarounds makes later changes harder.

Refactoring is also a chance to talk with product colleagues. When old code supports a feature nobody seems to use, ask why it took its present shape, whether it still belongs, and what behavior users actually need. The engineer who takes on a risky cleanup should be recognized, not treated as doing invisible maintenance while only new features receive credit. Recognition should still be tied to expected and observed business and engineering value.

### How to judge a refactoring afterwards

Kabi suggested setting an expectation before starting: what kinds of change should this design support, and for how long? After six months or a year, see who modified the area, what changed, whether those changes were anticipated, and whether every extension still required editing the core. Modification itself is not failure; the question is whether the design accommodates natural business growth.

The host pressed on investment and return. Kabi acknowledged that time, stability, and business benefit must be discussed with the relevant lead. An elegant diagram is not enough to justify the work. He again explained how unified source can make ongoing improvements possible: a library owner can change the library and its callers together rather than coordinate a sequence of binary releases across repositories.

### A glimpse of the workplace at the time

The first conversation also touched on Bilibili's daily atmosphere. Kabi mentioned family and anniversary events, birthday gatherings, cats around the office, shared gaming interests, and engineering activities with puzzles and prizes. These were things he saw in 2022; specific activities and benefits can change.

## Conversation, part two: Frameworks, tests, and responsibility

### What UIX was, and what it was not

When the host raised cross-platform UI, Kabi immediately clarified UIX's role. It was not a framework that ran the same UI on every platform. It was an iOS-side arrangement that aligned declarative UI, one-way state flow, and service dependencies with ideas the team was using on Android. UIKit and other existing capabilities still did much of the underlying work. A small amount of framework code did not mean all rendering and interaction had been reimplemented in that small amount.

He also responded to a live question about open source. In 2022 he had no plan to release UIX as a public package. He preferred to share ideas once the approach was mature enough for others to implement under their own conditions. There was no confirmed public download location to recommend.

### Cross-platform UI brings benefits and extra integration costs

Kabi described different choices across Bilibili businesses at the time: Flutter in comics, a mini-program-like approach in commerce, and Electron for a PC client. They addressed different products; he did not want one framework to govern all platforms. A cross-platform framework may deliver familiar scenarios quickly and reduce duplicated work, while deep customization or native integration can require plugins, rendering expertise, and additional engineering investment.

His language of “upper and lower bounds” summarized development and customization costs, not a benchmark proving that all cross-platform frameworks are slower than native code. Runtime, rendering path, and actual workload have to be assessed separately. When the host inferred that technological openness reflected a comfortable business environment, Kabi added a condition: leaders allow choice when the choice produces delivery and experience value. Openness cannot by itself pay the integration and maintenance cost. Hiring remarks made in that recording are historical, not a current vacancy list.

### Languages for shared logic

Asked about cross-platform languages, Kabi described the complexity he felt in C++ projects and his interest in Kotlin Multiplatform Mobile or Rust for shared logic. This was an area he hoped to explore, not an announcement that Bilibili had already migrated. Personal language preferences cannot replace checks of current dependencies, platform support, and the team's ability to maintain a solution.

### Tests should provide useful feedback to developers

Kabi resisted imposing one uniform coverage percentage on all business code. He recalled automatically generated tests that achieved coverage yet missed important logical problems. The number could be high without the tests answering a useful question.

He wanted module structure to make meaningful tests easier. Clear inputs and outputs, one-way data flow, and explicit dependencies can make state changes straightforward to verify. A developer who discovers that a test replaces repeated manual launches or helps locate a fault has a reason to keep using it. He gave a practical framework-maintenance example: when a user reports an issue, tests of the framework's contract help determine whether a recent framework change broke it before both sides start guessing.

There was an important qualification. For UIX itself, he said the team aimed for very high coverage, even 100 percent, to give its maintainers confidence when modifying a widely used framework. He distinguished framework work from a blanket metric imposed on every business. A passing test strengthens diagnosis but never proves that a module is free of every possible defect or that other levels of testing are unnecessary.

### Scope low-code tools to their users and problems

Asked about low-code, Kabi first compared it with visual tools such as Photoshop: packaging complicated operations into a usable interface has long been a way to lower barriers. The real questions are who will use the tool, what they need to accomplish, and which repeated work it removes.

An operations colleague may only need predefined campaign templates in a CMS and the ability to change content order. Building arbitrary layout, styling, and animation into that tool could turn it into a whole new professional development platform without a matching need. A programmer needs another form of “less code”: Kotlin DSL or Swift result builders can reduce repeated declarations while preserving expressive power. The audience and task determine the scope. Kabi described frontend experiments with visual builders but no equivalent comprehensive Native plan at that time. His examples of shorter code or delivery time expressed a possible gain, not a fixed efficiency guarantee for every team.

### Tools grow out of repeated work

When the host requested productivity-tool recommendations, Kabi said he still used the command line frequently. Of packaged tools, he mainly mentioned Notion for organizing knowledge and work. His development tools often began in repeated tasks: if build output, binary size, or memory data repeatedly requires manual analysis, write a script or small program to fix the steps, then let colleagues try it.

Repeated use and feedback make that tool an internal product to maintain, rather than a one-off command. Automating a task after it has appeared several times is a useful prompt, not an order to build software for every operation that happens exactly three times. He also valued protecting enough focused time to do the work the tool is supposed to improve.

### Curiosity, depth, and ownership in hiring

For mobile candidates, Kabi first valued the willingness to investigate and the ability to find documentation. Someone who can turn vague confusion into a clear question is already closer to solving it; English can expand access to original technical material. This does not mean every answer already exists in a document. The engineer still has to understand and verify what they read.

He also valued deep care about one kind of work. A UI developer might have early code that looks rough but has carefully worked through interaction details. Judging only the surface of the code can miss the result the person achieved. Curiosity goes beyond following documentation: why was an API designed this way, and how does its implementation work? Finally, ownership means continuing to drive an accepted task until it is complete and taking responsibility for the delivered result. All of these criteria echo the talk's main claim: architecture earns its value through real use, change, and collaboration.

The [episode 3 page](/articles/tchat-3/) links to all three full videos and their segments.
