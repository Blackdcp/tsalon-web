---
title: "Cui Minghui on MPFlutter: Bringing Flutter Layout to WeChat Mini Programs"
summary: Cui Minghui explains how MPFlutter serializes Flutter layout, maps output to host components, updates reusable nodes, and balances code sharing with native experience.
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 10
author: editorial-team
topics: [Flutter, Mini Programs, Frontend, Cross-Platform]
relatedEvents: []
relatedRecordings: [shenzhen-frontend-challenges]
cover: /images/default-cover.svg
coverAlt: Generic cover for a historical T Salon Shenzhen frontend talk, not a photo of the guest or event
citations:
  - label: Frontend Challenges and Opportunities Part 2, Building WeChat Mini Programs with Flutter by Cui Minghui
    url: https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2
tldr:
  - "Where the problem begins: cross-platform still depends on the host: Cui first describes his experience in iOS and Web development and as the author of the SVGA animation library."
  - "Serialization and incremental updates: In his explanation, Cui organizes data around reusable Element nodes, serializes relevant layout information as JSON, and sends it to the renderer."
  - "The build still centers on Dart and Flutter tools: Cui says the project did not begin with webpack or a TypeScript build."
faq:
  - question: Why can't a standard Flutter Web build run directly inside a WeChat Mini Program?
    answer: WeChat Mini Programs do not expose a full browser DOM or standard WebGL/Canvas runtime and enforce strict bundle-size caps; at the time of the talk, a baseline Flutter Web output carried a multi-megabyte bundle and uneven scrolling on some Android devices.
  - question: How does MPFlutter render Flutter layouts inside a WeChat Mini Program?
    answer: MPFlutter keeps business logic and layout computation inside Dart/Flutter, serializes reusable Element node positions, dimensions, text, and image fields as JSON, and maps incremental diffs onto mini-program host components through a DOM-simulation adapter layer.
  - question: What is the core engineering tradeoff of using MPFlutter for WeChat Mini Programs?
    answer: Teams can share one Dart/Flutter codebase across iOS, Android, Web, and WeChat Mini Programs, at the cost of maintaining Dart-to-JS bundle trimming, host bridge adapters, and accepting a gap compared with native mini-program scrolling and interaction polish.
featured: false
draft: false
translationOf: shenzhen-cui-minghui-mpflutter-recap
translationStatus: reviewed
seo:
  title: "Flutter for WeChat Mini Programs: Cui Minghui on MPFlutter"
  description: "How MPFlutter brings Flutter apps to WeChat Mini Programs via Element layout serialization, incremental JSON diffs, DOM adaptation, and Dart-to-JS bundle trimming."
  noindex: false
---

At the Shenzhen event on frontend challenges and opportunities, Cui Minghui introduces his open-source project MPFlutter. It keeps the Flutter development model while attempting to bring one application to WeChat Mini Programs and the Web. The question is how existing Flutter code crosses the limits of a mini-program environment, not whether every platform should use Flutter.

> This is part 2 of the historical recording. The original event recap was published on May 9, 2022. Platform support, performance, and the example project reflect the versions and experience discussed then, not the capabilities of current releases.

## Where the problem begins: cross-platform still depends on the host

Cui first describes his experience in iOS and Web development and as the author of the SVGA animation library. He then narrows the question to WeChat Mini Programs. Flutter could already target multiple platforms, but mini programs have their own runtime. A Flutter Web build cannot simply be shipped there unchanged.

He distinguishes “Flutter is cross-platform” from “the application can be delivered on this target.” iOS, Android, and desktop systems have corresponding implementations. WeChat's mini-program environment cannot directly consume the browser output. Even starting with Flutter Web raised concerns in his experience: a simple application carried a base bundle of several megabytes, and scrolling on some Android devices was visibly uneven. Those observations belong to the time of the talk, not a present-day benchmark.

JavaScript work could also block interface updates. Cui sought a rendering route better suited to the target host, rather than treating reuse of one framework as a complete answer.

## Separate application logic, layout, and host rendering

Cui uses Flutter's architecture to explain the proposed route. Developers describe the interface and logic in Dart. The framework computes layout and coordinates rendering, while lower layers connect to the platform. In a browser, a separate choice remains: how should this information appear in the host?

He compares the HTML path with Canvas and WebGL. Repeated changes to the styles of many elements can make JavaScript-to-DOM interaction expensive. His scrolling example aims for roughly 60 frames a second: if each movement repeatedly rewrites element styles, that interaction is on the critical path, and other JavaScript on the main thread can interfere.

WebGL does not automatically remove every difficulty. A small English font is one thing; a set of Chinese glyphs is much larger. Drawing text into a 2D Canvas and uploading it as a texture is one possible adaptation, but selection, input boxes, and accessibility still need separate treatment. Cui presents these as problems that the host integration must solve, not proof that either rendering route can never work.

## The central idea: send the layout already computed to another end

MPFlutter starts from work the framework has already done. If Flutter has calculated the layout and handled application logic, why make another host calculate all of it again? Could the result be serialized and restored as a display structure elsewhere?

Cui contrasts this with lightweight virtual-DOM approaches that pass styles and nodes to a host which still does layout. Flutter's framework already contains the layout result, so the output can include it. He describes this as trading space for time: logic and layout stay on the Dart/Flutter side, while the receiver renders the result. Platform-specific adaptation remains necessary.

The receiver need not reimplement the full behavior of every Flutter Widget. Ordinary nodes need position, width, and height; text and images need their particular content. The crucial work becomes the mapping from framework output to host components, with costs in serialization, communication, updates, and compatibility.

## Serialization and incremental updates

In his explanation, Cui organizes data around reusable Element nodes, serializes relevant layout information as JSON, and sends it to the renderer. JSON is the format used in his demonstration, not an inherent restriction of the concept. A browser, mini program, or another suitable receiver can render the application if it reconstructs the needed positions, dimensions, and content.

The Element tree also gives an opportunity to avoid starting over on every update. Cui uses node identifiers to compare previous and new state, then updates the differences. If every frame required a full reconstruction and transfer, serialization itself could become the new bottleneck. Incremental work is therefore part of the proposed performance story.

This is more specific than saying that any Flutter tree can be converted to JSON and run anywhere. The design depends on which tree is used, which layout and content fields are sent, how node identity survives updates, and what the receiving platform can actually display.

## A mini program has no ordinary browser DOM

The mini-program host does not expose a complete browser DOM. Cui discusses a DOM-simulation layer in the WeChat environment to bridge this gap. Flutter emits layout information, an adapter turns node operations into a form the mini program accepts, and the host displays and updates components. Shared business code does not mean zero work per platform.

He cites the mini program Yidoutang from an earlier company as a practical example. In his account, the team used Flutter across iOS, Android, Web, and the mini program, aiming to support four ends with one codebase. He explicitly acknowledges that the mini-program experience was worse than a native mini program. The benefit was shared code and coordinated team effort; whether that tradeoff is attractive depends on performance, compatibility, and interaction requirements on the target platform.

## The build still centers on Dart and Flutter tools

Cui says the project did not begin with webpack or a TypeScript build. It followed the Dart-to-JavaScript path and Flutter's resource bundling for static assets, with changes to trim an otherwise large output. The runtime adapter was only one part of the work; compilation and resource handling also had to fit the mini-program constraints.

Evaluating MPFlutter therefore requires more than asking whether writing the page still feels like Flutter. Teams must inspect the generated bundle, the host bridge, the cost of adapting future Flutter releases, and the actual scrolling and text experience on each target. Cui closes by pointing to the open-source project and its toolchain. This recording ends at his invitation to move into Q&A; further audience questions are not included in this segment.

## Comparison Table: WeChat Mini Program Rendering Approaches vs MPFlutter

| Dimension | Native Mini Program / JS Cross-Compile | Direct Flutter Web Output | MPFlutter (Layout Serialization + Host Bridge) |
| :--- | :--- | :--- | :--- |
| **Primary Language** | JavaScript / TypeScript + WXML/WXSS | Dart (targeting full browser DOM/Canvas) | Dart (reusing existing Flutter Widgets & layout) |
| **Where Layout Runs** | Mini-program host layout engine | Browser engine | **Computed directly on the Dart / Flutter side** |
| **Host Rendering Bridge** | Native mini-program view components | Cannot run unchanged without full browser DOM | **Serializes Element geometry to JSON + WeChat DOM adapter** |
| **Update Mechanism** | Scoped `setData` state updates | Heavy full-tree or canvas redraws | **Stable Element node IDs send incremental diffs only** |
| **Best Fit & Tradeoff** | Best native UX, zero code reuse with Flutter apps | Multi-MB base bundle & mobile scroll lag | **Best for existing Flutter teams adding a Mini Program**, trading bridge maintenance for 4-end code reuse |
