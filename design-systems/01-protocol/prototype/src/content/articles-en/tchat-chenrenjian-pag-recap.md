---
title: "Chen Renjian on PAG: Motion-Graphics Workflows, Rendering Engines, and Engineering Growth"
summary: "A recap of Chen Renjian's 2022 T Chat technical talk and interview, covering four PAG generations, file compression, hybrid export, TGFX, real-project learning, technical leadership, code quality, open source, and interactive motion."
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 37
author: editorial-team
topics:
  - PAG
  - Motion Graphics
  - Engineering
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-17
cover: /images/talks/tchat-17.jpeg
coverAlt: Poster for Chen Renjian's T Chat presentation on Tencent PAG
citations:
  - label: "Chen Renjian's technical talk on reducing motion-graphics engineering costs"
    url: https://www.bilibili.com/video/BV11A411X7K5
  - label: "One-on-one interview with Chen Renjian"
    url: https://www.bilibili.com/video/BV1mM411m7C9
  - label: PAG official introduction
    url: https://pag.io/
  - label: PAG official optimization guide
    url: https://pag.io/docs/optimization.html
  - label: PAG official AE feature guide
    url: https://pag.io/docs/ae-support.html
  - label: TGFX official repository
    url: https://github.com/Tencent/tgfx
tldr:
  - "Why production gets stuck in engineering: Video editing constantly needs new stickers, transitions, animated text, and templates."
  - "Rebuilding a mature framework reveals why it was designed that way: In a game project, repeatedly assembling UI panels by code became tedious, especially as designs changed."
  - "Flash's history and the possible future of motion workflows: Chen described Flash through three stages from his experience: content that could be watched, interactive rich media, and eventually a platform capable of games and applications."
faq: []
featured: false
draft: false
translationOf: tchat-chenrenjian-pag-recap
translationStatus: reviewed
seo:
  title: Chen Renjian on PAG and Engineering Growth | T Chat
  description: Chen Renjian discusses PAG's four stages, compression, rendering, BMP precomposition, TGFX, project learning, leadership, open source, and interactive motion.
  noindex: false
---

> These videos were published in 2022. Technical conditions, personal experiences, and opinions below belong to that period.

How much engineering work does a motion graphic require between a designer's computer and a real product? For Chen Renjian, PAG first addressed that production workflow. File formats, rendering architecture, and tools served that goal.

Chen, also known as Dom, joined the event as a Tencent technical lead. He recalled spending the first part of his career in games before moving to short-form video and building shared infrastructure for audio and video publishing. That path also ran through the interview: learning from real projects, turning repetitive work into tools, and making an individual's expertise useful to a team that must keep delivering.

## Technical talk: replace one-off motion reconstruction with a reusable workflow

### Why production gets stuck in engineering

Video editing constantly needs new stickers, transitions, animated text, and templates. Operators want richer visuals in time for current events. The older workflow involved several handoffs: a designer created an effect in Adobe After Effects (AE) and exported a demonstration video; engineers reconstructed properties and timelines in code, scheduled missing effects for development, and repeatedly checked results with the designer.

Chen separated three costs. Engineering had to touch every asset, limiting production scale. Back-and-forth implementation lengthened release time. Complex effects could be too expensive to reproduce, causing designers to simplify their ideas. Even a released result might no longer match the original visual intention.

PAG moved much of that repeated work into tools. A designer exports a PAG file through an AE plugin, opens it in a desktop previewer, changes text and placeholder images or video to inspect the actual result, and then hands it to a business that already uses the SDK. PAG stands for Portable Animated Graphics; its [official introduction](https://pag.io/) presents it as an end-to-end motion workflow.

In the demonstration, the chain was visible: design in AE, export one file, double-click it to play in the desktop tool, replace sample content, and deliver the checked asset. Rather than reconstructing every property from a reference video, the runtime can use the designer's configured content. Integration and maintenance of the SDK remain engineering work, but individual assets need much less bespoke code. Chen described a historical video-template example in which a weeks-long cycle became hours; that was his team's case, not a promise for all assets.

### From playing an animation to editing and composing it

The use cases grew progressively more demanding. A live-stream gift may only need to play from start to finish. A UI animation may need progress control or text changes. Stickers and animated titles require content replacement. A video template must incorporate a user's material into a preset effect. A game highlight reel goes further: its clips, order, and duration depend on actual play, so the system must rearrange smaller elements.

For the highlight reel, the designer cannot export every possible final video. Instead, they produce atomic motion elements and let code select, position, time, and combine them. That changes PAG's target from playing a file to letting the business manipulate layers and their timeline. Progress control and replacement sit between simple playback and full composition.

Chen compared Lottie and SVGA as other attempts to reconnect design and runtime from different starting scenarios. He also recalled the more complete design-and-development workflow of the Flash era. Mobile platforms had made that connection something teams needed to rebuild.

### Four versions reflected four sets of business constraints

Chen did not present the releases as a feature list written in advance. Each major version responded to a new constraint.

**1.0 addressed motion and editable text in video editing.** The team needed animated stickers and text over video, with text still changeable. It built a rendering foundation and file format, borrowing from game-engine ideas so motion could enter a video rendering pipeline while accounting for live preview, caches, and file size.

**2.0 addressed complex effects and video templates.** Pure vector export retained editability but could not represent every AE effect. Hybrid BMP precomposition let designers prerender complex parts that did not need editing, while retaining structure for editable parts. A placeholder image gave user video an entry point. A designer could animate the placeholder's scale, transforms, effects, and depth; at runtime, a user's frames took its place and inherited the design. The placeholder and precomposition solve different problems: one admits changing content, the other preserves an effect that cannot economically be rebuilt live.

**3.0 made layers the control unit.** Automatic video creation and game highlights could not rely on one fixed template. APIs let business code add, remove, position, and time layers in a rendering tree and combine PAG files. Chen contrasted 2.0's “fill the reserved slots” model with 3.0's “inspect the input, then build the template” model. Several motions in one tree could also share a GPU rendering context rather than each creating its own.

**4.0 went down to the drawing engine.** As upper-level functions matured, SDK size and Web support became more pressing. The team concluded that its existing graphics library limited some optimizations and began TGFX for tighter control of GPU rendering, platform services, and resource management.

### Small files come from the structure of motion data

A deliverable should ideally be one file, quick to load, and small to download. PAG uses an extensible binary format with resources inside the same file and independent Tag blocks for different information. A later version can add a block. An older reader may skip an unfamiliar nonessential block under the format rules; essential new features still depend on the reader's capabilities. This is controlled extensibility, not a guarantee that every old SDK plays every new asset.

More compression comes from observing AE timelines. Many properties never move away from defaults, so a marker can represent “use the default” instead of storing a full value. Values of similar types can be grouped; sign bits and integers can use only the bits they need. Screen coordinates can be quantized to a selected precision and then compressed as integers. Saving a little on one property matters when an asset contains many timeline properties.

Chen used coordinates as an example: there is little reason to store two full numbers throughout a timeline if the position never changes. The general principle is to use the distribution and precision requirements of motion data, rather than merely asserting that binary is smaller than text. Results vary by asset. Single-file delivery, decode speed, and size all serve the path from designer handoff to first frame on a device.

### The video rendering pipeline and three cache levels

Motion in a video editor has different constraints from ordinary UI playback. It needs to combine with video and filters, ideally render directly into a target GPU texture, and run on a suitable thread without blocking interaction. Chen regarded one lower-level implementation as useful for both pipeline integration and cross-platform consistency.

After integration, the runtime must avoid repeated work. Some layers or whole frames remain unchanged for stretches of the timeline. Identifying those static intervals lets it reuse a result rather than recalculating and redrawing every frame.

He described three caches with distinct jobs. A file cache shares decoded data when the same asset is instantiated several times. A drawing cache retains interpolated text and vector results and can reuse them through static intervals. A content cache stores stable complex graphics as textures so the GPU need not redraw them repeatedly. Static-interval information tells the system when even those operations can be skipped.

Caching has a memory cost. If an asset appears only as a small icon, a texture as large as its original canvas may be wasteful. Results can be generated as playback proceeds rather than all at once. The design is a trade-off between execution time and memory, not a call to cache without limit.

### Hybrid export balances visual fidelity, editability, and size

Some AE effects take noticeable time to render even on a designer's workstation. A phone cannot be assumed to reproduce them every frame in real time. Pure vectors are compact and editable; prerendered frames preserve more complex appearances. Hybrid export lets each part use a suitable representation.

A designer can mark an effect-heavy layer that does not need runtime modification as a BMP precomposition, while keeping other parts editable. The precomposition preserves the image, not the full editability of the effect inside it; the [official optimization guide](https://pag.io/docs/optimization.html) describes that trade-off. This explains why “export AE effects” and “support more editable AE features later” can both be true.

The next question is how to store and play those prerendered frames. PAG can use video compression and hardware decoding. Transparent motion needs both color and alpha information, so Chen showed color on one side of an opaque encoded picture and grayscale alpha on the other. After decoding, a shader restores the transparent result while combining YUV-to-RGB conversion and alpha handling in one draw. Compression, hardware decode, and GPU composition form one path rather than isolated tricks.

Motion timelines also jump to arbitrary times. The file needs keyframe access and static-interval information, not only efficient continuous playback. Chen's Tetris-template example involved blocks that stayed visually unchanged for long periods even though they were in a precomposed frame sequence. Sending every identical frame to a hardware decoder still incurs a fixed wait; recording the static interval allows reuse of the first decoded result. File size alone therefore does not determine runtime performance.

### TGFX: choose around the actual workload

Why not continue trimming Skia? Chen said his team's emphasis had shifted toward package size, predictable timeline-driven motion, and GPU resource control. Skia serves a broad range of 2D drawing, with CPU and GPU routes and caching for less predictable drawing. PAG could focus on the GPU route it needed and let its upper layer decide more precisely when to cache. That does not make a general-purpose engine useless; it explains a different set of constraints.

TGFX favors operating-system image decoders, fonts, and other graphics functions when suitable and adds alternatives where a platform lacks them. This can reduce dependencies packed into the SDK but increases platform adaptation work. It also wraps platform views, devices, rendering contexts, and thread cooperation so each business integrator does not have to handle them all.

GPU resource lifetime is particularly subtle. An object losing its last reference on one thread does not mean its GPU allocation can be safely destroyed there. TGFX's API can defer cleanup until an appropriate rendering context is active. Without a shared path, a business might only discover a context or release bug on a certain device or when the app goes into the background. Other discussed optimizations included hardware buffers, reuse of important GPU objects, avoiding duplicate CPU/GPU copies, and letting a business-aware upper layer manage more caching.

Chen reported that the engine replacement reduced PAG's overall package size by about 65% on average and improved vector rendering performance by about 60% in his team's tests. Without a public comparison using the same devices, assets, and conditions, those figures cannot promise the same result in another app. An audience member also asked whether TGFX was open source: at the time it had no separate repository, but related code was in libpag. An independent [TGFX repository](https://github.com/Tencent/tgfx) is accessible today; that later status should not be projected back into the recording.

### Tools, community, and four next steps

The workflow needs more than an SDK. Designers need export, preview, and performance-checking tools; engineers need documentation, tutorials, and places to ask questions. Chen described open-source participation and business adoption at the time and emphasized that a complete toolchain lets more people use the approach without the core team's constant intervention.

He outlined four directions then: support more AE features in an editable form so fewer parts require prerendering; provide layer-level performance analysis for designers; add more rendering backends to TGFX; and develop a community for assets and designers. These were plans, not a list of already delivered features.

## Career conversation: learn from real problems and pass experience to the team

### The first foundation is finishing a real project

Asked how a beginner grows, Chen described two stages: first gather experience solving genuine problems, then learn how to do already-possible work better.

At university he learned programming systematically while taking outsourced projects through a computing club. Those projects had clients, requirements, and outcomes. When he could not deliver, he had to find documentation, learn the missing skill, and connect the pieces. That helped him reach a game-company internship early. The important reward was not the specific early income he mentioned but the “original experience” of completing work whose questions were not organized like a course exercise.

He applied the same approach to a new language: build a program with a concrete purpose. He recalled making Tetris near the start of a job, consulting syntax and documentation when the task required it. He has used C++ for many years without needing to memorize every feature before writing software. Good abstraction of a real problem matters more to him than showcasing elaborate syntax.

### Rebuilding a mature framework reveals why it was designed that way

In a game project, repeatedly assembling UI panels by code became tedious, especially as designs changed. Chen adapted ideas from Adobe Flex into a smaller system, FlexLite, and built a visual editor so the team would not reconstruct every panel by hand.

The personal learning lay in implementing an established idea himself. When a boundary appeared, he returned to the mature framework to see why it offered a particular interface or structure. Some designs he initially thought too conservative made sense after his alternative ran into real requirements. Reading source code alone did not give him architectural judgment; trying his own implementation and comparing it with a mature one did.

He called the resulting accumulation architectural intuition. At first a developer may sense which design is safer without fully articulating why. More attempts, feedback, and comparison allow the reasons to become explainable and teachable. Practice remains necessary; the mature project provides a reference, not a shortcut around it.

### Choose challenging business problems that extend existing strengths

Games and short-form video look like different industries, but graphics rendering connected Chen's work across them. When considering a new role, he looked at whether it would bring new problems to an existing capability, not only at the job title.

The host asked if interest and self-study were enough. Chen said interest starts a project, but an imagined open-source idea without real use cases can stall and offers little feedback on architecture. He had tried one in his spare time. In short-form video, stickers, templates, user-generated material, package size, and Web support kept presenting constraints that pushed PAG from one version to the next. He was not dismissing self-study; he wanted a setting where real, important, technically difficult problems would keep testing it. Product success is not entirely under an individual's control, but the capability built while solving problems can move with them.

### Leadership requires working across boundaries and giving work away

Chen separated technical problem-solving from management. He had led people at a startup largely as a technical expert. At Tencent he paid more attention to management itself.

The first change was horizontal: a technical lead should not merely receive a requirement. Understanding implementation can reveal early that a product request will cause avoidable rework. The lead can discuss the user's problem and alternatives with product colleagues rather than defending a rigid handoff boundary.

The second was vertical: a strong engineer may solve a difficult issue faster personally, but a manager must help other members own work, even before they are equally experienced. Otherwise every critical decision waits for one person. When the host contrasted management and leadership, Chen added that delegation does not require leaving code. He still coded to maintain technical judgment while giving teammates work they could grow into.

### Rigor appears in review, tests, and code structure

Asked about team culture, Chen chose rigor. A low-level engine may have less code than a whole app, but a bug can become a hard-to-diagnose crash much later. All changes, including his own, went through review; checks that tools could perform belonged in tests and CI/CD. Human review focused on structure, naming, responsibilities, and effects on neighboring modules.

He described a feature whose special cases had accumulated as branches in an upper business layer. Moving differences into appropriate lower implementations could preserve one clean upper interface. This was not a rule that every condition must become polymorphism. It was a discussion of where responsibility belonged. Sharing such reviews with the team helped people see why a design changed and acquire maintainability judgment they could carry beyond that workplace.

### Engineers should hear users directly

A tool team may not have a product manager who interprets every need. Chen and his colleagues participated in decisions about desktop-tool behavior, functions, and sometimes interaction design. They answered users in forums, groups, and GitHub.

One question might expose unclear documentation; another might reveal a real SDK gap. The person who heard the request could help bring it into implementation and see how the change affected users. Direct feedback thus improved both the tool and the team's technical judgment. A question about joining the team produced no concrete job listing; continued discussion and open-source participation were the clearer ways to connect at that time.

### Do not let one language or business label define your skills

Chen connected games and video again through rendering. Video editing uses codecs, but his particular work also needed composition, effects, and graphics. Rendering knowledge can extend into motion graphics, image effects, UI frameworks, game engines, AR, or VR. He encouraged developers to identify the capability they are really accumulating rather than confining themselves to a language or industry label. This describes his route, not every audio/video job; codecs, audio, and other specialties remain distinct.

### From Rive to open-source contribution

Asked what he was watching, Chen mentioned Rive and interactive graphics: an animation can change state in response to input, and several timelines can coordinate. He was exploring how that interactivity might combine with the established AE creation workflow, making interaction an important proposed next step for PAG.

He still followed Skia's GPU work even after developing a replacement better suited to his own constraints. TGFX, in his account, gave users another option rather than erasing Skia's value.

For someone wanting to contribute to open source, he recommended beginning with an understandable issue rather than a complex core module. Explain a mechanism in documentation, reproduce a bug, answer a user's question, or fix a small defect. Continued work can eventually lead to deeper involvement. The first step need not be intimidating, though its quality still matters.

### Why PAG began, and why it became open source

The host asked why Chen chose motion workflows. After moving into short-form video, he missed the efficient design-development connection he had known in the Flash ecosystem. Stickers and editable animated text could not sustainably be produced by hand-coding each asset. A systematic solution required more investment up front but could make each later asset cheaper. Existing approaches showed that a design-to-runtime path was possible, even though PAG had to solve its own constraints.

The host initially assumed PAG had been open source from the start. Chen corrected that history: development began in 2016 for internal motion needs, and public release came only in early 2022. Designers first used it internally and recommended it to other teams; subsidiaries adopted it and external users began requesting access. That breadth persuaded the team it was useful beyond one business. Company review, documentation, and removal of sensitive material still had to happen before a public repository could exist. More users then brought more feedback, which shaped the tools again.

### Flash's history and the possible future of motion workflows

Chen described Flash through three stages from his experience: content that could be watched, interactive rich media, and eventually a platform capable of games and applications. Vector animation, interactive advertising, social games, Flex enterprise applications, and AIR desktop tools formed more than a player; design, code, editors, and delivery were connected in a productive system.

On Flash's exit from mobile, Chen emphasized platform rules and commercial interests. That was his historical interpretation, not a complete explanation. Apple [changed and later relaxed app-development tool restrictions in 2010](https://www.apple.com/newsroom/2010/09/09Statement-by-Apple-on-App-Store-Review-Guidelines/). In its [2017 Flash Player announcement](https://blog.adobe.com/en/publish/2017/07/25/adobe-flash-update), Adobe also cited mature open Web standards and browser changes. These records resist reducing the industry's change to a single cause.

Chen saw PAG at the time as mainly in the content-output stage. The next clearer step was interactivity: let designers express state changes, multiple timelines, and user actions, then let the runtime respond to input. When the host asked whether PAG would follow Flash into mini-games or application development, Chen did not promise it. Whether a broader platform should follow would depend on future real needs.

## Full recordings

- [Chen Renjian's technical talk on reducing motion-graphics engineering costs](https://www.bilibili.com/video/BV11A411X7K5)
- [One-on-one interview with Chen Renjian](https://www.bilibili.com/video/BV1mM411m7C9)
