---
title: "Guo Shuyu Explains Flutter Web: Bundle Size and HTML Rendering"
summary: Guo Shuyu compares Flutter Web renderers, walks through icon trimming and lazy loading, and traces why text and graphics switch between browser elements and Canvas.
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 16
author: editorial-team
topics: [Flutter, Web, Rendering, Performance]
relatedEvents: []
relatedRecordings: [shenzhen-frontend-challenges]
cover: /images/default-cover.svg
coverAlt: Generic cover for a historical T Salon Shenzhen frontend talk, not a photo of the guest or event
citations:
  - label: Frontend Challenges and Opportunities Part 4, Flutter Web by Guo Shuyu
    url: https://www.bilibili.com/video/BV1HY4y1r7rJ?p=4
tldr:
  - "A shared framework still needs distinct browser implementations: Guo begins with Flutter's origins in web-related work, then contrasts it with approaches that started as web frameworks and later gained client support."
  - "Why adding a background changes the same text's output: Guo starts with a simple Text widget."
  - "Remove the text to inspect shapes and layers: In the final example, he removes text and leaves a simple rectangle and styling."
faq: []
featured: false
draft: false
translationOf: shenzhen-guo-shuyu-flutter-web-recap
translationStatus: reviewed
seo:
  title: Guo Shuyu on Flutter Web Rendering | T Salon
  description: A 2022 deep dive into Flutter Web bundle size, renderer choice, lazy loading, and how text and graphics move between DOM and Canvas.
  noindex: false
---

What changes when Flutter's cross-platform consistency reaches a browser? Guo Shuyu divides the question in two: how the build is loaded, and how the interface is drawn. The first affects the cost of opening a page; the second explains why similar-looking components can produce different structures and different text results.

> This is part 4 of the Shenzhen recording; the original event recap was published on May 9, 2022. Guo is discussing the Flutter Web implementation of that period, particularly its HTML renderer. This is not a configuration guide for the current release.

## A shared framework still needs distinct browser implementations

Guo begins with Flutter's origins in web-related work, then contrasts it with approaches that started as web frameworks and later gained client support. Flutter first established its framework and rendering system on mobile, then brought them to browsers. It was not simply the reverse of moving existing HTML components onto phones.

Many framework APIs can be shared across mobile and Web, but host capabilities differ. During Web compilation, part of the engine implementation is replaced with Web-specific code; drawing interfaces such as Canvas particularly need adaptation. Guo describes the two routes at the time. The HTML renderer relies more on browser elements and APIs. CanvasKit uses WebAssembly and Skia-related drawing to more closely reproduce mobile appearance, but carries additional resources and loading cost.

The HTML route is closer to the Web platform and is more affected by its details. CanvasKit can offer more visual consistency while requiring more bytes. In Guo's demonstration, a default build could include resources for both routes and then select by target environment. Inspecting what was actually built had to come before optimizing it.

## Inspect the output before saying the bundle is large

Guo shows the initial output of one of his projects. The main JavaScript file was about 2.3 MB, CanvasKit-related Wasm about 2.8 MB, the Material icon font about 1.5 MB, and another icon font smaller but still present. These were figures from his project and that version, not fixed Flutter Web costs.

The breakdown matters. A slow opening might be caused by application code, a renderer, font files, or transport settings. “Flutter Web is large” does not identify which change would help. Guo first removes an unused icon dependency and specifies the HTML renderer for the production build instead of carrying both engines. Choosing HTML reflects his assessment of control and optimization room at the time, not a recommendation that every application make the same choice.

## Icon trimming, deferred loading, and compression solve different costs

Even a font the application needs can contain far more glyphs than it uses. Guo tries retaining only referenced Material icons. In his demonstration the resulting font is about 3.2 KB. At the time, direct trimming in the Web build produced an error, so he used a result from another platform build as a workaround. That is a historical version-specific response, not a command sequence to copy today.

For JavaScript, he uses Dart's `deferred as` and `loadLibrary()` to put pages or components that are not immediately needed into separate `part.js` files. The main script in his example falls from roughly 2.2 MB to 1.6 MB. Deferred code still has to be downloaded when the user reaches it; the improvement is that it need not block the first view.

Guo then uses source maps to see which parts of the output come from application logic and which from framework or engine code. Some bytes offer too little room for optimization to justify changing the framework. Applying Gzip to the roughly 1.6 MB script reduces the transferred bytes in his example to a little over 400 KB. That does not delete the logic the browser ultimately parses. Renderer selection, font cleanup, code splitting, and network compression each address a different part of the first-open cost, and their figures cannot be collapsed into one universal percentage.

## The HTML renderer does not use ordinary HTML for everything

The second half follows the implementation. Flutter's Canvas interface is supplied by a platform-specific engine. On the Web path of the time, Guo examines SurfaceCanvas and its branches to DomCanvas and BitmapCanvas.

He slows down a scrolling-list demonstration. The page contains custom elements whose names begin with `flt-`; an item outside the visible area does not always retain the same internal structure as one currently on screen. The engine controls and replaces elements as the list moves. He then asks a sharper question: when is Flutter Text drawn as pixels in Canvas, and when does it become a paragraph and span in the browser?

DomCanvas chiefly takes an element-based path. BitmapCanvas favors bitmap drawing but can still produce elements for some capabilities and compatibility conditions. An “HTML renderer” is therefore not a promise that every result will be ordinary tags like a handwritten webpage. One must follow the branch chosen for the actual drawing operation.

## Why adding a background changes the same text's output

Guo starts with a simple Text widget. In the implementation he demonstrates, it is drawn into a Canvas. He adds a red background and inspects the result again: the text now appears through paragraph and inline elements.

He follows the operation that draws the rectangle and the later operation that draws the text. The background triggers an element-based path; the current drawing state then affects how the following paragraph is handled. The difference is not a rule that “red text uses the DOM.” Operation order and state have changed. Text output depends not only on the string and font properties, but also on surrounding drawing work.

This makes the example useful for debugging. If text clarity or the browser structure changes, comparing only the text property may miss the condition that actually changed.

## Shadows, filters, and matrices change the branch again

Adding a shadow to the text and red background sends Guo's next example back to a Canvas path. Adding a color filter shifts it to elements again. He traces these choices to filtering parameters and host compatibility. Some effects could not reliably pass through a target browser's Canvas route in that historical implementation, so the engine used another representation.

He mentions Safari compatibility around certain filters and shadows. In the sequence “text,” “text with red background,” “with shadow,” and “with color filter,” the visible result may stay similar while the output alternates between Canvas and elements. Inspecting one final screenshot cannot reveal which change triggered the branch. Adding effects one by one and checking the generated output is the method he demonstrates.

A more complex matrix transform likewise takes a different path. The engine is coordinating Flutter's effect model with browser capabilities, so neither the word “HTML” nor a single component property can explain every outcome.

## A Canvas background can still have DOM text

Guo removes the filter and complex transform, then adds a text decoration to the shadowed example. The background remains drawn with Canvas, while the text becomes paragraph and span elements.

Text has its own decisions. Decoration and font-feature handling can be easier to express through browser elements and CSS. A parent or background being Canvas does not settle how every child will be represented. Guo discusses these details to show why two components that look alike can differ under the hood.

## Remove the text to inspect shapes and layers

In the final example, he removes text and leaves a simple rectangle and styling. Without a paragraph operation, the path can differ again. He relates the resulting `flt-` custom elements to Flutter's layer operations. Adding a picture creates a corresponding layer, and inside that layer the renderer may still choose Canvas or elements.

His practical decision sequence is to check filters, complex transforms, and drawing state; then ask what the current shape needs; and finally inspect the paragraph's own text features. This explains why a simple rule such as “the HTML renderer always uses the DOM” fails.

Guo closes with the reason to understand these internals. Build changes can improve loading, while drawing-path analysis helps explain visual differences, including text sharpness at certain resolutions or under specific conditions. A different platform or Flutter version may make another choice. Diagnosis must use the actual build and rendered output. This segment ends with his conclusion; no audience Q&A is included.
