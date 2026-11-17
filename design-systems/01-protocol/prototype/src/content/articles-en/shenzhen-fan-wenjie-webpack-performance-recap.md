---
title: "Fan Wenjie on webpack Performance: Measure Before Caching or Parallelizing"
summary: Fan Wenjie traces webpack's workflow, explains Stats and lifecycle timing, then weighs caching, parallel work, narrower processing, and delayed compilation against measured bottlenecks.
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 18
author: editorial-team
topics: [webpack, Frontend, Engineering, Performance]
relatedEvents: []
relatedRecordings: [shenzhen-frontend-challenges]
cover: /images/default-cover.svg
coverAlt: Generic cover for a historical T Salon Shenzhen frontend talk, not a photo of the guest or event
citations:
  - label: Frontend Challenges and Opportunities Part 5, webpack Performance by Fan Wenjie
    url: https://www.bilibili.com/video/BV1HY4y1r7rJ?p=5
tldr:
  - "The core workflow: initialization, module building, and output generation: Initialization reads and merges configuration, creates a Compiler, installs plugins and factories, then starts the run."
  - "Cache intermediate work, not only final files: Caching is his first optimization family."
  - "Lazy compilation and project boundaries reduce what must happen now: Fan ends by comparing strategies."
faq: []
featured: false
draft: false
translationOf: shenzhen-fan-wenjie-webpack-performance-recap
translationStatus: reviewed
seo:
  title: Fan Wenjie on webpack Build Performance | T Salon
  description: A 2022 talk on finding webpack bottlenecks with Stats and hooks, then choosing cache, parallel work, smaller processing scope, or lazy compilation.
  noindex: false
---

Fan Wenjie starts with the experience of inheriting slow builds. A custom framework or a sizable older project can take a long time, but “the build is slow” does not tell a team what to change. He organizes the work into three steps: understand the workflow, measure where time goes, and choose a technique for the actual bottleneck.

He recalls a mini-program precompilation framework with challenging performance requirements and older applications with tens of thousands of lines of code that could take seven or eight minutes or longer to compile. At first he did not know where webpack was spending that time. Several investigations gradually gave him the diagnostic sequence he shares.

> This is part 5 of the Shenzhen recording; the original event recap was published on May 9, 2022. The talk concerns webpack 4 and 5 and related tools at that time. Demonstration timings are not general performance guarantees.

## The core workflow: initialization, module building, and output generation

Initialization reads and merges configuration, creates a Compiler, installs plugins and factories, then starts the run. Fan does not treat it as the main target in his example projects because module work and output generation consumed more time there.

Building follows a file recursively. webpack resolves its path, reads it, runs loaders, parses imports and requires into a syntax tree, then visits dependencies and repeats. The result is a set of modules and a module graph. More modules imply more file I/O, parsing, and transformation. Some pipelines also move between strings and syntax trees more than once, while an individual loader may be expensive.

In Fan's personal measurement of one build, this part took roughly half the time. That is a reason to inspect I/O, repeated transformations, and loaders, not proof that every slow project has the same distribution.

Generation constructs a chunk graph, decides how entry, runtime, and asynchronous chunks are grouped, performs optimizations such as tree shaking and module merging, compresses code, and writes files. Fan openly calls the splitting rules complex. In his measurements, this stage also took a substantial share. Terser compression and SplitChunks are among the tasks he names as potentially costly. A compressor taking time does not make it defective; its work itself has a computational cost.

Understanding these stages lets a developer ask what a configuration actually causes webpack to do, rather than assuming any long wait is wasted work.

## Stats shows what the build contains

Fan's first diagnostic route is exporting webpack Stats, with profiling enabled where needed. He reads it from the output inward: an asset is a generated file, which relates to chunks, and chunks contain modules. Module profiling can show time spent resolving and building it. The object also records context such as webpack version and overall duration.

That chain helps answer why an output is large and where module-processing time might be spent. It does not mean every nested time can simply be added to get wall-clock duration. Shared modules, overlapping work, and the distinctions between relationships and timing need care.

## Different analysis tools answer different questions

Fan shows several tools rather than promising one plugin will finish a diagnosis.

- **webpack analyse and similar tools** expose modules and dependency relationships. The official analyzer had broad information, though Fan found its experience unstable at the time on some projects.
- **Statoscope** displays relationships among entries and modules, lets developers look for unnecessary or duplicate packaging, and can diff two Stats files. It is useful for composition and size, but does not answer every timing question.
- **webpack-bundle-analyzer** makes relative module and package size visible at a glance. A large npm dependency may stand out immediately, but size is not the same thing as build time.
- **speed-measure-webpack-plugin** reports plugin and loader-rule duration. It complements a size view rather than replacing it.
- **webpack-dashboard** presents development-build information more attractively, but Fan notes limits to using its displayed data for deeper analysis.

He asks listeners to decide whether they need to know “what is in the package,” “which transformation takes time,” or “what changed between two builds.” Combining tools around those questions is more useful than installing a dashboard and reading every number as performance.

These are his observations about versions available in 2022, not current maintenance or compatibility advice.

## Hooks can time stages that Stats does not expose

Stats does not directly answer every question about internal optimization or chunk generation. Fan proposes recording timestamps at suitable start and end lifecycle hooks. Initialization, for example, has hooks around it; similar points can be found for other work.

A measured interval is the duration between those hooks. It may include several operations, so hook names alone do not prove that the value is the net execution time of one plugin. Fan wrote a prototype to collect module-build and generation-stage timing for his presentation, but said it was not finished. The video does not introduce it as a mature, released product.

## Cache intermediate work, not only final files

Caching is his first optimization family. With webpack 5's filesystem cache, a first build saves intermediate state such as dependency information. Later builds can restore a valid snapshot and skip parts of repeated resolution, parsing, and transformation.

Fan demonstrates on Three.js. In his personal test, a build of about 18 seconds was followed by an approximately 0.8-second build with a warm cache. The two figures describe different conditions. They show what a cache hit can do in that case, not that arbitrary webpack builds take 0.8 seconds or that a warm result is directly comparable with another tool's cold start.

He then reviews historical webpack 4 approaches. A loader-result cache reuses one level of transformation. HardSource-style tooling attempted to save a broader build state, closer to the idea of webpack 5's cache, but came with more complexity and assumptions about context. Babel could cache its own output too. The broader the saved state, the more care invalidation and compatibility require. Fan presents his improvement figures as personal examples, not gains that can be added together by stacking plugins.

## Parallelize work only where it can run independently

Another family uses more than one process. Threading a suitable loader transformation, running independent webpack configurations in separate processes, and parallelizing compression address different bottlenecks.

Fan discusses thread-loader for appropriate tasks. Some loaders need particular compilation context or emit resources and cannot simply be moved to a worker. Running multiple configuration objects separately helps when those configurations are independent, but does not speed every step inside one instance. Terser has a parallel route for compression. The right layer depends on what measurement identified; otherwise process startup and communication can add cost rather than remove it.

He also notes the historical status and limitations of tools mentioned in the talk. They are examples of parallel-work patterns, not a ready-made current configuration.

## Process less work and place checks at the right stage

Rules such as `include` and `exclude` can keep loaders from repeatedly transforming files that do not need it. Yet a blanket exclusion of third-party code can be wrong if the target browser still needs that code transformed. `noParse` has an even stronger prerequisite: the selected file must not need normal dependency parsing. Using it without confirming that condition risks a broken build.

TypeScript transpilation and type checking can be separated. Fan discusses `transpileOnly` for quick local conversion while an independent process continues type checking. Linting can likewise be performed in the editor, at commit, or in CI rather than making every local build wait for the same work. Moving a check is not removing the quality gate.

Source maps cost time and can use different settings for fast development feedback and production diagnosis. Image or other resource compression may also be done outside repeated local builds when appropriate. Dependencies and Node or tool versions can constrain the whole pipeline. Optimizing the path as a system matters more than targeting one plugin in isolation.

## Lazy compilation and project boundaries reduce what must happen now

Fan ends by comparing strategies. Beyond changes to webpack 5's module and chunk data structures, its experimental Lazy Compilation feature at the time tried delaying some entry or asynchronous-module work until that code was needed. This shifts “what must be compiled now”; it does not erase the deferred cost.

A micro-frontend split or Module Federation can let a developer build the relevant subapplication rather than a whole large project, provided the dependency boundary actually allows it. Fan also contrasts Vite's development startup, which need not bundle the entire application at the beginning and can process modules on demand. This explains why the starting wait may be shorter, not why one tool must win across every production build.

The talk comes back to one habit: distinguish cold starts from cache hits, size from duration, and work required now from work that can wait. Then test whether a change addresses the measured bottleneck. This segment ends with his appendix; it does not include audience Q&A.
