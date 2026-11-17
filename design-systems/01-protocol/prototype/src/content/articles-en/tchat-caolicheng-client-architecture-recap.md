---
title: "Cao Licheng on 1688 Client Architecture: Dynamic Containers, Low-Code Pages, and Growth"
summary: "A recap of both T Chat episode 13 recordings, from dynamic campaigns, client containers, and page building to architectural consolidation, cross-platform consistency, Cao's Android career, technical communication, and team building."
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 29
author: editorial-team
topics:
  - Client Architecture
  - Engineering
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-13
cover: /images/talks/tchat-13.jpeg
coverAlt: Cao Licheng discussing 1688 client architecture in T Chat episode 13
citations:
  - label: "Cao Licheng on the evolution of 1688 client architecture"
    url: https://www.bilibili.com/video/BV1YD4y1b7T9
  - label: "Full interview with Cao Licheng on his career"
    url: https://www.bilibili.com/video/BV1iG4y1h7FY
tldr:
  - "Pages multiply faster than people or app releases: In an operations-heavy business, the first problem is the mismatch in speed."
  - "Consolidate approaches and make the flow observable: A long-lived client can accumulate too many ways to solve the same problem."
  - "Several growth directions can build on existing strengths: For client engineers, Cao outlined different paths: deepen a technical specialty and solve hard problems; improve architecture and development efficiency; or work close to business outcomes such as growth and retention by combining technologies."
faq: []
featured: false
draft: false
translationOf: tchat-caolicheng-client-architecture-recap
translationStatus: reviewed
seo:
  title: Cao Licheng on 1688 Client Architecture and Growth | T Chat
  description: Both parts of episode 13 cover container protocols, dynamic DSLs, low-code page building, observability, Kotlin, technical writing, and team development.
  noindex: false
---

> These videos were published in 2022. Technical conditions, personal experiences, and opinions below belong to that period.

In the first part of T Chat episode 13, Cao Licheng used 1688 to explain how a large client app supports rapidly changing campaigns. In the second, he traced his path from modifying Android phones to infrastructure work, technical communication, and team building. The two recordings total about 93 minutes.

## Design the container around changing business needs

### Pages multiply faster than people or app releases

In an operations-heavy business, the first problem is the mismatch in speed. A campaign may launch in the morning and change that afternoon, while the mobile app follows a fixed release cycle. The number of promotion pages grows faster than the client team. Native pages, H5, and several cross-platform approaches can coexist in one app, making presentation and interaction harder to control.

Cao's starting point was to separate a page into a container and components. The container owns common lower-level capabilities; components form the visible sections. If a component can be changed, added, or removed independently, many campaign adjustments no longer require a full app release.

He broke down the 1688 home page rather than treating it as one fixed implementation. The container holds the page; campaign slots and recommendations become replaceable pieces. A finished promotion can be removed, and a new one can use an existing component. This addresses fast campaigns, many pages, and limited staff together. It still requires a library of components and container capabilities built beforehand.

### A container provides efficiency, an experience floor, and reuse

Cao gave the container three goals. It should let developers build around components; maintain a minimum level of stability and experience despite dynamic content; and allow business capabilities to serve several client apps, including merchant and category-specific products.

His analogy was a common network library. Engineers with different levels of experience can use one shared capability and get more consistent behavior. A container similarly centralizes repeated work in resources, communication, and error handling without preventing business developers from assembling new pages.

The “experience floor” matters precisely because more people can produce dynamic pages. A configuration may run on many Android devices; without consistent resource handling, failure fallback, and data access, one campaign can freeze or fail to respond. The container lowers that risk. Whether the resulting page meets its goal still has to be checked on devices and through live observations.

### Separate scenarios before unifying foundations

Home, search, and product-detail pages affect browsing and purchases, so they emphasize performance. Marketing pages emphasize quick change. Open business scenarios need interfaces for merchants. Tools such as favorites, history, and live-streaming utilities often change more slowly. One rendering technology need not be the answer to all four.

Cao separated these upper-level scenarios from shared capabilities. Businesses use a common API; beneath it are plugins, events, scheduling, interactions, analytics, resources, data, and script execution, connected to data platforms. A floating button, popup, and page content can all compete for attention, so scheduling needs priority rules. Resource prefetch and caching influence the first screen. Performance, business results, and audience segmentation require a common data foundation.

For the four scenario groups he first asked what each business needed, then which capabilities the container should provide and which differences belong above it. A product page cannot casually interrupt a purchase; a campaign might need to vanish the same afternoon; merchant extension needs an external contract. These constraints are more useful than declaring one framework the winner in advance.

### Protocols and workflow matter more than the number of stacks

Four kinds of agreement connect container and business. Plugins let the container call supplied business capabilities. Events carry communication between pages or containers. Scheduling decides when tasks and overlays appear and for whom. Interaction rules handle touches, swipes, and feedback. The container must do more than draw a draggable badge or popup: it must know display order and how events travel.

Different rendering stacks can use a bridge, channel, or native interface to honor those agreements. Business developers should not have to relearn the container's internals for each stack. Once common capabilities and protocols stabilize, most variation can stay in the business layer.

The simplified flow is: start the container, load the protocol, obtain component structure and data, render, then handle interaction. A full page, a card, and a floating layer can follow the same flow. After loading the protocol, the first two questions are which components exist and what data each shows. Keeping the flow recognizable also tells engineers whether to inspect delivery, data, rendering, or events when something fails. An architecture drawing that shows several adapters does not mean every team must deploy them all; one suitable dynamic approach can be a starting point.

### Reuse business modules and components across clients

Below the container, base libraries and business capabilities should be decoupled. Above it, search, recommendations, products, membership, and messaging modules can form different pages. The same recommendation module can appear on a home page and a workbench. Skins, assets, data parameters, and interactions distinguish one client from another.

Cao showed the main app and an industrial-category app to illustrate how products that look different can share modules. The condition is genuine common business structure, captured as components. A shared data shape and much of the UI may remain, while a skin or API parameter changes. “Copy this whole page” becomes “reuse the module and configure its differences.” A small team need not support every container in his architecture diagram to begin doing this.

## Make dynamic pages real with a DSL and a builder

### A small starting point: describe in a DSL, render with native components

To make the idea portable, Cao proposed a simpler model: describe layout and components in a DSL and parse them into native client UI. He called this native enhancement. It reuses native rendering and adds less runtime and learning overhead than a full new engine, while allowing the layout description to arrive dynamically.

His analogy was Android XML layout. Normally it ships inside the app and changes with the next release. A developer could instead edit a similar description in a Web environment, deliver it to the app, and let existing native components form the new layout. A cross-platform layout expression such as Flexbox can reduce separate work for each side. The client still needs to request, parse, and bind data; performance must be checked in the intended page.

The delivered XML or JSON names layouts, components, and styles, but the app's existing native components still do the drawing. The host asked whether this was “hot update.” Cao distinguished updating layout and data descriptions from downloading new executable client code. A click can trigger an event already supported by the protocol; a completely new interaction requires a client release. Older app versions cannot materialize components that were never built into them, so compatibility remains part of the design.

The demo-scale parser is only a starting model. Production also needs publishing, stability, performance controls, and business customization. Cao mentioned open-source layout or container projects as references, while saying that 1688 at the time used considerable group-wide dynamic infrastructure.

### A page builder needs materials first

Low-code assembly begins with usable components. After publishing a component to a materials pool, business users can create a page, place components into container levels, and set data. Not every operation must look like free-form drag and drop; adding and removing components works if component and protocol meanings are clear.

Data can be embedded in the delivered page protocol or defined as a dynamic source that the client requests and binds later. Skins, experiments, analytics, and performance settings can be added as extension fields. Page-level plugins can handle common functions instead of making every component repeat them.

Cao walked through the sequence: publish materials, create a page, select components and hierarchy, choose each data source, preview, then publish. Hierarchy determines which data and events apply where. He recommended getting hierarchy, data, and component agreements right before copying all the configuration fields of a large internal platform.

### Preview the real client conditions

A builder's static canvas may show all candidate components. A real user may see only a subset because login state, app version, audience, and campaign time determine what appears. Cao showed more than ten candidates in the editor while explaining why a device would display fewer.

Scanning a code and opening the page in an actual client lets the team inspect hierarchy, spacing, backgrounds, waterfall layouts, data, and targeting conditions. It can reveal that a component is missing in an older app version. Operators can schedule different skins or assets for different periods. Once published, a page address reaches the app and the container handles protocol requests, binding, and drawing. This automation is why an operator can change a campaign without asking a client engineer to rebuild the entire page each time.

### Turn a delivered protocol into an interactive page

The protocol describes layout hierarchy, component data, templates, and style. Data may be embedded or requested later. Templates name the components and properties, while styles cover details such as backgrounds, spacing, and opacity. Preset interactions, including a supported click-through action, can also be described there.

Cao used a text component to explain binding. Its template has a `text` property whose value points to a field in an API response. The container first recognizes that placeholder, then fills it after the dynamic request returns. A large protocol may contain layout, data, template, and style together, but runtime assembly follows their dependencies. If the API field moves without updating the template contract, the client can parse the protocol yet show the wrong content.

### Audience questions: large protocols, custom entry points, and old clients

Asked whether a large JSON document slows the page, Cao acknowledged the cost of delivering everything at once. Teams can reduce descriptions, cache some resources, split dynamic requests, and assemble results. This is more precise than saying “just add a cache”: reducing what the first screen must await may matter as much as shrinking total data.

For core pages such as home, search, and product details, a standard customization entry point can modify the default loading flow. A common container does not require every page to request data in exactly the same order. The base model still delivers descriptions, not arbitrary executable code; an old client cannot render a missing native component. The entire internal platform shown in the talk was not then released as a single open-source project.

## Where architecture goes after the foundations mature

### Consolidate approaches and make the flow observable

A long-lived client can accumulate too many ways to solve the same problem. Cao wanted to reduce duplication and unify the key flow. He also called for a “white box”: business engineers should know the important steps and extension points and have an obvious place to start debugging.

His analogy was Android View's `measure`, `layout`, and `draw`. Knowing those steps lets a developer locate the stage of a failure. A container also needs a few legible steps. Crash alerts only report visible failures after the fact. Logs, traces, and measures segmented by page, audience, and device may reveal an experience drifting below target before a crash, allowing the team to inspect dependencies and decide whether the protocol, resource path, or component needs changing. Building an observability platform is a means, not the final business benefit.

### Cross-platform consistency needs engineering mechanisms

As business logic grows, iOS and Android may respond differently to the same condition. Cao proposed two degrees of consistency. The weaker approach keeps separate implementations but aligns business rules and adds cross-review. He noted similarities in Kotlin and Swift style that may help developers read the other side's logic. This relies on review and tests.

The stronger approach puts suitable shared logic into one Kotlin Multiplatform codebase and compiles outputs for each platform. It requires deciding what truly should be shared and how the toolchain fits the existing architecture. Using one language alone does not remove platform differences.

### Move from a single SDK to a solution for a scenario

Business gains often come from combining several capabilities. User operations might identify browsing behavior, evaluate a trigger, present a retention prompt, and measure the outcome. Performance work might arrange resources, requests, and rendering for a specific page path.

Finding one slow function rarely drives sustained improvement across an entire app. An architecture team must understand the scenario, combine foundational capabilities, and judge the result through user experience or business measures. Cao also mentioned AR, VR, digital avatars, and on-device intelligence as possible client-engineering directions in 2022, not as completed plans.

## Career conversation: interest, feedback, and the limits of one's skills

### From modifying phones to completing a real project

Cao's interest in Android began at university with changing his phone. He read forums, flashed software, changed themes, and replaced images and text resources because he disliked how the default interface looked. Repacking something he wanted to use taught him roughly what was inside an APK before he could build a full app. His first small program displayed his name when he pressed a button. Immediate visible feedback kept him learning.

He entered app competitions and built more small projects. A research project on disaster search and rescue then moved him beyond a single-device interface. Could phones near trapped people establish contact when conventional networks failed and help rescuers locate them? The project required thinking about ad hoc communication, data transfer, and search routes and continued into his graduation work. It was not a deployed rescue system; it was a sustained practice that made him connect several technologies for one purpose.

### From “it runs” to understanding one's limits

Cao did not portray growth as steadily increasing confidence. Leaving university with project experience, he felt capable. During an internship at Ele.me, he even tried to introduce still-young React Native into an engineering project, learned frontend skills, suggested improvements to the community, and shared his experience with other teams.

At Meituan's infrastructure team, mature code challenged that confidence. He could understand individual words and statements yet not see why the system was organized that way. Making a demo run and understanding a mature design were different abilities. Rather than dismissing his earlier work, he began asking colleagues, reading implementations, comparing solutions, and solving harder real problems. Over time he developed a more realistic sense of what he could solve and which existing approaches were available.

### Kotlin's value came from ecosystem and cross-platform possibilities

In the 2022 interview, Cao regarded Kotlin as worth continued investment for Android developers. Platform and tooling support, cooperation with Java, expressive syntax, and expanding cross-platform use all mattered. He extended the discussion from Android to backend and shared native logic: one language skill could connect different domains and preserve some earlier investment. These were observations from that period, not a substitute for checking today's versions or platform support.

## Explain technology clearly and make team contributions visible

### Begin by organizing the ideas

For Cao, a technical talk should help listeners reach something close to the speaker's understanding. Building a system does not automatically mean one can explain it. Writing is a relatively inexpensive practice: set out the problem, design reasoning, key modules, delivery path, and observed outcome, instead of recording events as a chronological log.

Speaking takes separate practice. Slides should show an abstract model and progress from problem to solution, while the speaker supplies explanation. Nerves, volume, and pace improve through actual talks. He also recalled strict reviews of technical articles down to wording, typos, and punctuation: those details influence how seriously readers take the work.

### Build a personal technical reputation on durable content

Asked how to develop a technical profile while busy, he started with content. A good article abstracts a real work problem into a model others can understand and use. He preferred spending time on a strong article over increasing the count of shallow posts.

Once there is substantive work, community discussion, submissions, and conferences can broaden its audience. A stable reputation forms when readers repeatedly gain something from the material. After serious preparation, an engineer also needs enough confidence to publish and discuss the result.

### Team culture needs both transmission and specific recognition

Sharing sessions, salons, onboarding, and mentoring move knowledge through a team. Culture also needs to recognize work that is easy to miss: maintaining stability, improving user experience and code quality, and consistently helping colleagues.

Cao described projects and rewards that recognized different contributions. The host connected internal culture to external technical reputation: valuable internal practice produces useful public sharing; external recognition can attract people who reinforce the team. This cycle takes time.

### Hire for fundamentals, cooperation, and continuing learning

Technical foundations, engineering habits, and an ability to keep learning matter because architecture and solutions change. An individual's output has limits; larger goals require splitting work, coordinating people, and integrating results. Communication is therefore part of engineering responsibility, not an unrelated soft add-on.

### Several growth directions can build on existing strengths

For client engineers, Cao outlined different paths: deepen a technical specialty and solve hard problems; improve architecture and development efficiency; or work close to business outcomes such as growth and retention by combining technologies. Each path calls for different skills. Business-facing work is not inherently technically shallow.

For someone considering a change, he recommended extending existing client experience into areas such as new interaction or graphics rather than discarding all prior investment. The choice still depends on individual interests, skills, and actual opportunities.

## Full recordings

- [Cao Licheng on the evolution of 1688 client architecture](https://www.bilibili.com/video/BV1YD4y1b7T9)
- [Full interview with Cao Licheng on his career](https://www.bilibili.com/video/BV1iG4y1h7FY)
