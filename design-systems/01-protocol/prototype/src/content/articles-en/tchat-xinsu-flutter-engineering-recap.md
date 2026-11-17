---
title: "Xinsu and Zongxin on Flutter at Xianyu: PowerImage, Engineering and Team Choices"
summary: A detailed recap of T Chat episode 2, from PowerImage's Texture and FFI paths, cache design and rich text editing to Xianyu's Flutter adoption, multi-engine experiments, open-source work and build performance.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 25
author: editorial-team
topics:
  - Flutter
  - Cross-platform
  - Engineering
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-2
cover: /images/talks/tchat-2.jpeg
coverAlt: The T Chat episode 2 poster for Xinsu's talk on Flutter engineering at Xianyu
citations:
  - label: Xinsu's technical presentation on Flutter at Xianyu (Chinese)
    url: https://www.bilibili.com/video/BV1P34y1a7vw
  - label: Full conversation with Xinsu, Zongxin and the host (Chinese)
    url: https://www.bilibili.com/video/BV1AY411w7QQ
  - label: PowerImage official repository
    url: https://github.com/alibaba/power_image
  - label: Fish Redux official repository
    url: https://github.com/alibaba/fish-redux
  - label: Xianyu engineering article on Mural's rich-text protocol (Chinese)
    url: https://developer.aliyun.com/article/1225977
tldr:
  - "The problem was cooperation between two image systems: A mature native image library can request a CDN asset suited to the displayed dimensions, decode formats supported by its platform implementation and load bundled resources."
  - "Delivery efficiency and people's long-term growth: Zongxin traced the decision back to the team's circumstances around 2017."
  - "Separate the Flutter artifact from the host build: The final audience question concerned slow builds in a hybrid application."
faq: []
featured: false
draft: false
translationOf: tchat-xinsu-flutter-engineering-recap
translationStatus: reviewed
seo:
  title: Flutter Engineering at Xianyu | Xinsu and Zongxin at T Chat
  description: PowerImage's rendering and caching design, Mural rich text, Flutter adoption, production migration, multi-engine work, open-source contributions and build optimization.
  noindex: false
---

> These recordings were published in 2022. Technology versions, team plans and individual views below describe that period.

In the first half of T Chat episode 2, Xinsu explained his work on Flutter business features and middleware at Xianyu, concentrating on the PowerImage library and briefly showing the Mural rich-text editor. In the second half, Xianyu client-team lead Yu Jia, known as Zongxin, joined Xinsu and the host. They discussed why the team selected Flutter, how it moved core work toward it, and what engineers had to learn along the way. The two recordings total about 85 minutes.

Zongxin's role can also be checked against a contemporary [public Xianyu team interview](https://developer.aliyun.com/article/819373).

## PowerImage: bring existing native image capabilities into Flutter

### The problem was cooperation between two image systems

A mature native image library can request a CDN asset suited to the displayed dimensions, decode formats supported by its platform implementation and load bundled resources. Xinsu gave three examples. Fetching an original file for a small view wastes transfer; support for formats such as HEIC differed between Flutter versions while a native library could already handle them; and including the same static image separately in native and Flutter assets inflated the app package. The question was not whether Flutter could display images at all. It was how the new interface layer could reuse capabilities the application already had.

Before PowerImage, Xianyu had an image component based entirely on external textures. It did not give Flutter an ordinary `ui.Image`, and texture display on a simulator depended on the Flutter version. Its lifetime was managed separately from Flutter's ImageCache. Meanwhile, business code might still use Flutter's normal Image, and the photo album could have its own loading channel. Lowering the regular cache limit did not make those three resource policies coherent. A low-frequency image could remain in one cache while textures were tied to page lifetime and album images followed a third route. PowerImage aimed to unify how those paths were invoked and accounted for, while keeping the native loading strengths.

### The Texture path: register, identify and draw

Xinsu used iOS to walk through external textures. Native code implements the texture interface and registers it to obtain an ID. Flutter's Texture widget receives that ID, constructs the relevant layer, and the engine uses the ID to find the registered texture and request a pixel buffer. In the example, drawing does not mean creating an entirely new copy of all pixels on every frame. That can make textures attractive for certain workloads.

Yet a Texture widget is not a normal `ui.Image` in Flutter. Code that expects to manipulate an image object cannot simply take one from it. Cache size calculation and resource release also need design beyond the visible widget. Xinsu first explained this underlying path so that the later cache changes would not look like an arbitrary collection of workarounds.

### Follow Flutter's ordinary Image path before extending it

For a network image, an ImageProvider describes the source and participates in cache lookup. An uncached request enters a pending state; once loaded, the cache and active listeners help determine when it remains available and when it can be removed. The widget eventually draws the returned `ui.Image`. Xinsu identified two key connections: the image object used for drawing, and the information and lifecycle the cache uses to count and release it.

PowerImage therefore had to solve three connected problems. First, the ordinary Image widget builds a RawImage from `ui.Image`; a texture needs an extensible builder that can create a Texture widget instead. Second, ImageCache measures size through image information such as width and height. The implementation uses a placeholder to meet the expected type, while returning the texture's real dimensions where the cache needs them. The placeholder does not mean that a real texture consumes only one pixel of memory. Third, native textures have their own lifetime. The team extended cache behavior to detect when the relevant entries leave pending, cached or live states, then notify native code to release resources. Replacing the visible component alone would have left these behaviors out of sync.

### FFI provides an image object, at a memory cost

The second path passes a native pixel-data address and length to Flutter through FFI, then decodes the data into a real `ui.Image`. Once that object is ready, native resources can be released. This supports code paths that truly need an image object, but involves a copy. For part of the operation, memory may be held on both sides, producing a higher peak than a texture path in some cases.

That is why Xinsu did not describe either path as universally faster. Texture can reuse an efficient existing display route; FFI integrates more naturally with APIs that require `ui.Image`. The choice depends on the task, sizes of the images and costs of conversion. A screenshot showing that both paths render the same final picture says little about their respective memory profiles.

### Familiar entry points and custom native loaders

The public API was designed to resemble ordinary Image usage. It included network images, native bundled assets and custom types. For an album image, Flutter code could declare an album type and pass an asset identifier. The integrating application registers a native loader for that type, which finds and decodes the photo. Business code does not need to create a separate Texture component for every custom source or decide whether its eventual rendering uses Texture or FFI.

PowerImage cannot assume that all adopters use the same native image library, so the native loader is supplied by the integrating application. The common framework coordinates the request and rendering path. A network image can also take dimensions so that the loader requests an asset appropriate for the view. The [PowerImage repository](https://github.com/alibaba/power_image) records the project and its extension model; actual integration still requires checking the versions in use rather than copying the recording's dependencies.

### Animation, measurement and maintainability

An animated image loader returns frames and timing information. At the time, this was mainly a texture-based path. Because animated images were not common in the team's business, they did not need to stay in the ordinary image cache indefinitely. Removing one when its widget was released meant native code did not keep refreshing an image no longer on screen. Sharing an API did not force static and animated resources to have identical caching policies.

Xinsu described a performance comparison on an iPhone 11 Pro running Flutter 2.5.3, with about 300 network images in a three-column list and specified cache settings. FFI's copy could raise peak memory usage; the sample did not contain especially large images, so a list with large files could look worse. Texture remained the default then, while the team continued to evaluate FFI. Native image code also had strategies such as delaying some loads during very fast scrolling and resizing images. Those choices need to be considered when interpreting a benchmark, rather than crediting every difference to the FFI-versus-Texture switch.

The team separated core image behavior from extensions tied closely to Flutter's Image and ImageCache implementation. Tests covered important behavior, and initialization included cache settings, a default render path and error callbacks, followed by native loader registration. This organization mattered when Flutter versions changed: a failure could appear at a particular resource type or release moment, not in the business page that first displayed an image.

### Mural rich text reaches down to platform input

At the end of his technical presentation, Xinsu showed the Mural editor in publishing and detail screens. Rich text involves more than drawing formatted characters. Its content protocol, selection, cursor, text input and native platform behavior have to stay synchronized. The editor's content and selection state are translated into the platform input protocol; changes from a system keyboard have to be translated back into the editor's own operations.

He used cursor movement and the magnifier to show why this is difficult. Platforms may return position information or directional commands differently, while the editor still needs a coherent selection. The demo included themed text, emoji and interactions in a detail view. It was a short introduction, not a full walkthrough of the editor. Xianyu's later [Mural protocol article](https://developer.aliyun.com/article/1225977) gives more detail, including the influence of Slate, but the later article should not be mistaken for material all presented live.

## Why the team chose Flutter

### Technical curiosity connected to product details

Xinsu described an atmosphere in which engineers investigated a technology and brought the finding back to a real product problem. One colleague compared the upload resolution, display resolution and file formats of competing apps, then documented the findings for product colleagues. That contributed a technical view to a product comparison that might otherwise miss image quality and loading behavior. The team also looked at user feedback regularly and followed up on small experience problems.

Managers encouraged these investigations. Optional technical talks were incorporated into a weekly meeting without a fixed topic: a business problem or a recent discovery could both start a discussion. Xinsu's point was that curiosity became useful when it could enter a product decision or an engineering improvement, not merely remain a private side interest.

### Delivery efficiency and people's long-term growth

Zongxin traced the decision back to the team's circumstances around 2017. Xianyu's business had grown quickly, while its client team was relatively small. Leadership asked what engineers would gain from the work beyond completing business targets: reusable skills, a professional reputation and future opportunities mattered. At the same time, the team needed better efficiency across platforms. It had tested other cross-platform routes but had concerns about consistency, tools and performance.

Choosing an open, broadly used technology mattered to the people question. A proprietary solution useful only inside one company would give a contributor less transferable experience. Zongxin described a long verification period beginning around 2017, gradual business use around 2019 and wider application around 2021. The perceived efficiency gain was the result of years of validation and infrastructure work, not a benefit delivered by one successful demo.

He argued that technical innovation sometimes means persisting with a direction a team believes is valuable before it becomes a consensus. But it also means knowing which wheels not to rebuild. If a strong native capability already exists in the organization or the industry, use it; spend scarce engineering time on the gaps in integration and user experience. PowerImage was a concrete instance of that logic. Client-side containerization was a longer-term direction he considered promising, while acknowledging uncertainty about its eventual form.

## Learning Flutter beneath business code

Xinsu had worked in iOS before concentrating on Flutter Framework problems. His first recommendation was to stop treating a workaround as the end of an investigation. If a widget nesting produces surprising behavior, finding another arrangement that happens to display correctly is useful, but understanding why the original arrangement failed teaches more. Read the source code, then inspect blame history, commit messages and linked issues. The change and the discussion around it reveal the constraints the framework's authors were responding to.

His suggested foundation for a Flutter engineer included native platform knowledge, the framework and its principles, Dart features such as the event loop and null safety, and effective use of tools. His own start combined an official demo with integration into an app he already knew. A real task connects abstract material to concrete constraints; a person need not finish every tutorial before attempting a project.

### Flutter 3.0 raised a multi-screen question

The interview took place near Flutter 3.0's release. The speakers discussed desktop support, performance and adaptation to new devices. Zongxin focused on the limits of a hybrid application built around one engine. A phone might work well with one active interface, but an iPad split screen, a foldable device or a future desktop application could need several independent interfaces at once.

Simply starting a full engine for each interface could raise memory usage and complicate state sharing. His team was exploring multi-engine support, how isolates could communicate or share the data the upper layer needed, and how to preserve existing development practices while keeping memory levels reasonable. The iPad was an initial experiment. These were goals and work in progress in 2022, not capabilities automatically completed by the Flutter 3.0 release. Zongxin also cautioned against immediately upgrading a large production application solely because a new version was announced; compatibility, stability and the cost of migration still required evaluation.

## Moving core flows requires a business case and missing capabilities

When a viewer asked how to persuade a team to put Flutter into a core flow, Zongxin first questioned the premise: what problem would it solve for that team? Xianyu's client-heavy staffing and imbalance between Android and iOS engineers made shared implementation valuable. A product whose main engineering bottleneck lies deep in video or other platform-specific work may see far less benefit from a common page layer. Commerce, forms, image-heavy screens and complex shared business logic might present a stronger case. The answer depends on a product's constraints, not the framework's popularity.

If there is a real benefit, the next step is to inventory core-flow requirements. Does the proposed implementation have an adequate image library, player, rich-text capability and performance profile? Put each requirement in a document, build a working demonstration, and check the user experience before migrating a critical path. Moving prematurely can make the business pay for an obvious regression. Zongxin described the efficiency of a new technology as falling before it rises: learning and infrastructure cost arrive first, while the return may come later. A team must decide whether it can fund and sustain that middle period.

Looking back, he grouped the work into experience improvements, infrastructure and people's skills. Image and rich-text middleware addressed visible user problems. Tests and CI had to become credible before broader reuse; build tooling, code review and quality requirements also had to develop. Engineers moved from building business features on top of Flutter to investigating the build, framework and engine, sometimes contributing fixes upstream. He spoke openly about questions from the business and from managers while these gaps remained. A team cannot adopt a framework and assume the surrounding production work has already been paid for by someone else.

Zongxin also imagined a more unified terminal container that could hide some operating-system differences, perhaps informed by cooperation across the industry. He separated that long horizon from immediate tasks: mixed-stack reliability, multi-screen behavior, performance and tools had to be solved in actual applications before the broader concept could be judged.

## Tools, interviews and contributing upstream

### Use the official debugger before looking for a novel shortcut

Asked for a tool that improved development efficiency, Xinsu recommended Flutter DevTools. Inspector helps expose widget hierarchy, locate code behind a visible element and highlight rebuilding areas. Performance, memory and package-size views serve other stages of diagnosis. A new engineer who sees a screen but does not know the repository can navigate from a chosen widget toward its implementation, rather than searching unfamiliar files blindly. A tool narrows the investigation; it does not replace reasoning about why the behavior occurs.

### Interviews probe the way a person works through a problem

Zongxin said he cared about what a candidate had built, how they analyzed a difficulty, what they learned and how they habitually wrote code. Several team members had not used Flutter before joining. Native or other engineering experience could transfer. He was not interested in inventing a question from an unrelated field merely to defeat an applicant.

Someone claiming production Flutter experience could be asked about mixed-stack integration, performance, infrastructure and a genuinely hard incident. Shipping a demo is much easier than operating and evolving a real application. Someone without professional Flutter work could still show curiosity through an experiment and a thoughtful assessment of the framework's current limitations. The useful signal is how the person reached and explained a judgment, not whether they memorized the team's own solution.

### A useful upstream issue starts with a reproducible problem

Xinsu outlined how he approached contributions to Flutter. Search existing issues and discussions first. If the problem is not documented, describe the environment, provide a minimal reproduction and, when useful, a screen recording. A proposed change should be linked to the issue and have tests for the behavior it changes. The contributor then deals with the project's agreement, automated checks and maintainer review, revising the patch as questions arise.

Even after a change reaches the main branch, later tests may reveal a regression and cause a revert. That is not a reason to stop caring about the change; it is part of maintaining quality in a large shared project. Labels and exact steps can change, so a new contributor should check the project's current guide. The enduring lesson is to make a problem easy for others to verify and to support the fix with evidence.

## Programming style and build performance

### Declarative interfaces help when state is organized

Xinsu compared the declarative style of Flutter, React and SwiftUI with the more imperative patterns he had used in native development. Declarative code can make a page quick to assemble and easier to read, but a complex feature still needs a clear arrangement of state, effects and interactions. In the team's then-current detail, publishing and transaction work, Fish Redux helped split a page into components, each with its own effect and reducer. That made parallel work and later navigation to a module easier. The cost was a larger vocabulary and a learning curve. The [Fish Redux repository](https://github.com/alibaba/fish-redux) documents the project; this is a record of a historical team choice, not a universal recommendation for current state management.

For business logic, Xinsu again emphasized the value of consistent behavior on both mobile platforms. If Android and iOS teams separately interpret and maintain a complex requirement, details can diverge as the feature evolves. A shared implementation can reduce that class of difference and may be relevant for products extending to desktop. Platform behavior and native integration still need attention; "one codebase" does not mean "no platform differences." A live question on dynamic updates and hot reload was left for a separate topic, rather than answered with a complete solution in this session.

### Separate the Flutter artifact from the host build

The final audience question concerned slow builds in a hybrid application. Zongxin split the timeline into the Flutter artifact and the native host. The Flutter side can be built with a small placeholder project whose configuration matches the host, instead of recompiling the entire host application every time the Flutter output is generated. The resulting artifact is then integrated into the native project.

For the native side, look at build logs and identify which targets and dependencies are taking time. Remove unused references and code; consider suitable prebuilt artifacts. He mentioned that accumulated compiler warnings and their output can create extra work too. CI machines should reuse prepared dependencies, package caches and SDKs where appropriate instead of downloading everything for each run. If plugins or artifacts must be uploaded to and fetched from an internal repository, serial transfer can become another bottleneck and may be parallelized.

None of these measures promised one speedup number across every application. Their common method was to divide the build into stages, see where repeated work and waiting actually occurred, and then remove the specific cost.
