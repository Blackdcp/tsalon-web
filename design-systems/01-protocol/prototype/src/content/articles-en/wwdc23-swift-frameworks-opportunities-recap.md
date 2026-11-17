---
title: WWDC23 Developer Discussion on Swift, UIKit and Spatial Computing
summary: A detailed account of the WWDC23 discussion, from Swift macros and ownership through SwiftUI, SwiftData, a live UIKit result-builder implementation and the first questions about Vision Pro.
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 21
author: editorial-team
topics: [Swift, Apple, SwiftUI, Spatial Computing]
relatedEvents: []
relatedRecordings: [wwdc23-developer-review]
cover: /images/default-cover.svg
coverAlt: Generic T Salon cover for a historical WWDC23 developer discussion
citations:
  - label: 'New Technology, New Features, New Opportunities: complete recording in Chinese'
    url: https://www.bilibili.com/video/BV1Rh411T7ET?p=1
  - label: Apple WWDC23 Write Swift macros
    url: https://developer.apple.com/videos/play/wwdc2023/10166/
  - label: Swift 5.9 release notes
    url: https://www.swift.org/blog/swift-5.9-released/
  - label: Apple WWDC23 Discover Observation in SwiftUI
    url: https://developer.apple.com/videos/play/wwdc2023/10149/
  - label: Apple WWDC23 Meet SwiftData
    url: https://developer.apple.com/videos/play/wwdc2023/10187/
  - label: Swift Evolution SE-0289 Result builders
    url: https://github.com/swiftlang/swift-evolution/blob/main/proposals/0289-result-builders.md
tldr:
  - "Swift macros turn repetitive source into a compile-time problem: The first speaker, Rock, places macros in the longer development of Swift."
  - "Spatial interfaces give old abstractions a new role: The number of SwiftUI sessions gave the guests a sense of Apple's investment, while existing UIKit projects and lower platform targets remained real constraints."
  - "Developers can help find a use case; they cannot declare one in advance: For mobile developers, the new platform raises practical questions."
faq: []
featured: false
draft: false
translationOf: wwdc23-swift-frameworks-opportunities-recap
translationStatus: reviewed
seo:
  title: WWDC23 Discussion on Swift, UIKit and Vision Pro | T Salon
  description: Developers discuss Swift macros, ownership, SwiftUI and SwiftData, build a UIKit result builder live, and assess the first opportunities and uncertainties around Vision Pro.
  noindex: false
---

WWDC23 changed several layers of Apple development at once. Swift gained more ways to generate code and express ownership. SwiftUI expanded its state, scrolling and animation APIs. Vision Pro prompted developers to ask where an application might appear and how people would use it. In this discussion, the guests begin with language and frameworks, test an idea by building a UIKit layout helper live, and then examine the working environments and product decisions behind the technology.

The [complete recording](https://www.bilibili.com/video/BV1Rh411T7ET?p=1) was published on June 15, 2023 and runs for about 108 minutes. The framework experiences, employment observations and product expectations below belong to that launch period. In particular, the Vision Pro conversation took place before the speakers had a long-term opportunity to use the device.

## Swift macros turn repetitive source into a compile-time problem

The first speaker, Rock, places macros in the longer development of Swift. He encourages developers to read Swift Evolution proposals: the original problem, alternatives and objections can teach as much as the final API. He also uses proposals to learn how to write clearer technical design documents.

A macro generates code from a syntactic input. An expression macro, for example, can preserve both an assertion and the values inside the expression when it fails, so a developer gets more than a bare “condition false” message. Macros attached to declarations can produce members or supporting implementations. Different macro roles determine where a macro is written and what kind of code it may add.

Rock walks through examples such as `#stringify`, previews and observable models. The source contains a compact declaration; the macro is expanded during compilation; the compiler then checks the generated Swift. This is not the same experience as a C preprocessor performing raw textual substitution. Swift macros have typed declarations and work with syntax trees through SwiftSyntax. Writing one requires an understanding of that structure, rather than merely concatenating strings. [Apple's WWDC23 macro session](https://developer.apple.com/videos/play/wwdc2023/10166/) demonstrates the template, expansion and tests.

Other guests suggest practical possibilities. One is to produce better diagnostic output for an assertion, showing which value made a complex condition fail and saving time setting breakpoints. Another is to generate initializers for a type or wrapper code while moving an interface from completion handlers toward `async/await`. Preview and SwiftData show how platform frameworks can use the same mechanism. The attraction is that macros can work with declarations and structure, not only replace characters.

That power also raises a readability question. A property wrapper can already make a short declaration conceal significant behavior; a macro may do the same. The guests value Xcode's ability to reveal a macro expansion in place, making generated code easier to inspect. But a short source file does not by itself mean a smaller final program or an easier maintenance task. A useful macro needs clear generation rules, understandable errors and tests for its expansion.

## Ownership control, and how to learn a larger language

The conversation turns to `borrowing`, `consuming` and noncopyable structs and enums. Swift has usually applied default rules to ownership and copying. These features let an author express the use and lifetime of a value more precisely where it matters.

One example is a noncopyable value transferred to a new owner. Once a variable's value has been consumed, trying to use that old variable again produces a compiler error. Borrowing lets a function use a value without taking ownership; consuming expresses the transfer. Function parameter annotations can make the author's intent explicit rather than relying entirely on the previous default behavior. The speakers connect this to resource management and performance-sensitive code. It does not automatically give every program a complete concurrency-safety design. The [Swift 5.9 release notes](https://www.swift.org/blog/swift-5.9-released/) describe these as control mechanisms for code that needs them.

The guests also recognize the cost of a more expressive language: developers face more terms and rules. One response is to keep the learning path gradual. Ordinary application code can begin with familiar Swift; people can study ownership rules more deeply when building a library or solving a real performance and resource problem. The availability of an advanced feature does not make it a mandatory item on every beginner's checklist.

From there, they discuss Swift beyond Apple client apps: servers, C++ interoperability and historical attempts in machine learning. Swift for TensorFlow comes up as an example of exploration that did not become a broadly supported, continuously advancing product. They compare the ecosystem question with other languages and efforts such as Mojo. A language's technical ability to express a workload is only one part of adoption; libraries, tools, community practice and people to maintain projects matter too.

## SwiftUI changes the way state and interaction are expressed

`@Observable` is the main state-management topic. Where a team may previously have used `ObservableObject`, `@Published` and several property wrappers, a macro offers a new path into Observation. A view can track the properties it actually reads; a model can be declared more concisely. When a control needs to edit a model property through a binding, `@Bindable` has a specific role. [Apple's Observation session](https://developer.apple.com/videos/play/wwdc2023/10149/) explains that data-flow relationship.

The guests expect this to reduce confusion for some new learners, who previously had to distinguish many similar-looking wrappers. Existing projects have a different task: they need to decide which view owns a state value, which object comes from the environment and which property is only being bound for editing. A new API removes some boilerplate, not the need to understand the flow of data or plan a migration.

Scrolling and animation illustrate a similar move toward more direct expression. Advanced scrolling had often required a `ScrollViewReader`, custom position measurements, or UIKit. New transitions, target behavior and container-relative layout offered SwiftUI approaches for some of those tasks. For a layout related to a supported container's dimensions, `containerRelativeFrame` may avoid an extra `GeometryReader`. It is not a general replacement for every parent-view geometry problem.

Animation APIs also make different intentions easier to represent. A phase animator describes a sequence of stages; keyframes can specify how different values move along a timeline. Custom animation remains available for cases with special behavior. The significance is not simply more effects, but fewer forced workarounds for an interaction whose timing matters.

The guests disagree gently about an emerging API style: increasingly, a modifier accepts a closure instead of just a few parameters. Closures can make behavior more composable, but they can also leave a `View` declaration nested through many levels. `RealityView` is one example. Closures help initialize 3D content and react to state changes, but RealityKit's entities and models are not ordinary SwiftUI child views. Developers still have to name components and extract logic so that the code remains readable.

## SwiftData offers a modern interface but still requires a data decision

SwiftData makes model declarations, queries and SwiftUI integration look more like ordinary Swift. The guests are interested in how macros shape models and how `@Query` can connect stored data with the interface. SwiftData is related to the technology behind Core Data, while offering a new public API shaped around modern Swift. [Apple's WWDC23 introduction](https://developer.apple.com/videos/play/wwdc2023/10187/) shows the intended use.

The reaction is mixed. A guest who has used Realm with SwiftUI for years already has a working approach to observed query results and sees little reason to migrate immediately. Another finds SwiftData valuable as an example of how a team might use macros to make a database layer integrate cleanly with SwiftUI, even if that team keeps a different database. For a Core Data project, a more approachable syntax may be attractive, but the existing model, migrations and performance needs still have to be checked.

The discussion corrects itself in real time. One person initially guesses from their own contacts that few developers still use Core Data. Later, a message from a friend points to its use in a large team. Neither anecdote establishes the whole ecosystem. The practical test is a project's own relationships, queries, history, platform targets and maintenance burden, not a guess about which framework seems fashionable.

## UIKit and WidgetKit still matter across devices

UIKit received fewer headline changes in the guests' view, but it was not absent. They mention the `viewIsAppearing` lifecycle method, changes to the trait system, and more direct preview support. During the beta, one guest had trouble with a preview while another had made it work. That exchange is useful evidence about early tooling, not a final verdict that UIKit could never preview that kind of view.

WidgetKit gained more places to appear and more forms of interaction: the Mac desktop, iPad lock screen, iPhone StandBy and selected actions within a widget. The speakers are particularly curious about showing information rooted on an iPhone in a Mac widget. Separating widget data from its presentation earlier may now help with additional display surfaces. The preview tool's ability to show timeline entries also reduces the need to keep adding a widget to a device and waiting to observe each state.

One guest proposes a concrete product idea: could an iPhone application read health data and present a timely reminder on the Mac through a widget, without building a complete Mac health-data pipeline? It is a question prompted by the new distribution possibilities, not a verified promise of every API's availability. The group also imagines a stand reminder visible during desktop work. The useful design question is how much information belongs in a brief glance and which action is appropriate there, rather than trying to squeeze a whole application into a widget.

## Spatial interfaces give old abstractions a new role

The number of SwiftUI sessions gave the guests a sense of Apple's investment, while existing UIKit projects and lower platform targets remained real constraints. They saw Vision Pro as a place where SwiftUI's scene and window model might extend more naturally. Depth and spatial coordinates add dimensions beyond a flat screen. In their discussion, a `ZStack` no longer suggests only a source-order relationship; depth may become something a user perceives physically. An immersive space gives `Scene` a role beyond organizing familiar windows.

Some participants looked back at years of `Scene`, ARKit and RealityKit work and wondered how much of it had been planned with a headset in mind. They had no internal evidence for that history. What they could see was an API path that appeared familiar enough for an Apple-platform developer to begin learning. Whether the resulting experience would perform well and feel comfortable still needed testing on the right hardware. UIKit also remained a route for parts of a visionOS application, so an existing app was not automatically a dead end.

## A live UIKit experiment: from an array of views to declarative layout

The next technical speaker does not propose rewriting an old project in SwiftUI. He asks a narrower question: can an application keep UIKit while expressing child-view structure in a readable, declarative form? He traces the path from manually calculating frames through Auto Layout and `UIStackView` to SwiftUI. A layout engine and the source syntax used to organize it are separate concerns.

The experiment starts with a function that returns `[UIView]`. A result builder's `buildBlock` combines several views into that array. Then real source syntax makes the problem more interesting. An `if` without an `else` needs an optional branch; an `if` with two outcomes needs either branch; a loop needs an array of the intermediate results. Converting each `UIView` into a consistent component type, here an array, makes the different forms fit together.

The live implementation introduces the builder methods in stages:

- `buildExpression` turns one view into the chosen intermediate component.
- `buildBlock` combines components written in sequence.
- `buildOptional` handles a conditional with no `else`.
- `buildEither` receives the selected branch of a two-way condition.
- `buildArray` combines the components produced by a loop.

The compiler transforms the builder function body using these methods. This is not a second runtime script interpreter. [Swift Evolution SE-0289](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0289-result-builders.md) specifies the corresponding transformations. Walking through each method made the seemingly magical syntax more understandable: each source construct needs a way to produce the builder's agreed result type.

## A declarative surface still needs UIKit layout decisions

After the builder can collect views, the speaker passes them to a `UIStackView` and adds horizontal and vertical containers, margins and nested groups. A container ultimately returns a `UIView`, so it can become another container's child. The code's nesting begins to resemble the visual hierarchy.

The demonstration then encounters the issue a nice syntax cannot remove: why is a label stretching, and which element should absorb spare space? UIKit's Content Hugging priority controls how strongly a view resists stretching. A Spacer should be more willing to take up the remaining space. The speaker adds Spacer and Divider types, considers fixed versus flexible blank space, and gives the divider a size, color and margins. Loops and nested stacks become easier to read once those primitives are in place.

The result is an expression layer appropriate to a particular UIKit project. It does not inherit SwiftUI's state system, diffing behavior or whole catalog of controls merely because the declaration looks similar. A team with an older deployment target or substantial UIKit code might find the gradual improvement useful, while also accepting responsibility for maintaining the abstraction and its layout behavior.

## The same WWDC looks different across developer communities

The roundtable shifts from APIs to communities. A guest in Taiwan describes following the conference with familiar developers and keeping conversations alive in local groups. A participant in Singapore describes student clubs and informal watching events. These are slices of each speaker's network, not measurements of a region's developer population.

A guest working in the UK discusses teams where an app supports a wider real-world service, such as logistics, rather than being the whole product. That changes the size of the mobile team, cross-platform choices and the boundary of an engineer's job. Some people respond by learning across more of the system; others move toward independent development or technical content. He also recalls pressure in the 2023 job market and a sense that some mobile openings favored more senior architecture experience. This was his observation at the time, not a current count of jobs.

A Hong Kong participant talks about collaboration with local developers, the importance of foundations and communication, and opportunities in startup and financial-services work. An earlier team experiment with Reactive Extensions serves as an example of a group willing to try a new tool. Across the locations, the useful common point is that opportunity depends on industry, product, team organization and community connections as well as an engineer's skills. Ranking one place as simply ahead or behind would miss that context.

The guests also note the speed at which Web3, generative AI and now Vision Pro can dominate conversation. Excitement does not settle whether an architecture needs replacement or a product has a clear user problem. Local communities help people test those claims together.

## Vision Pro: an early conversation about interaction and usefulness

The final part is explicitly an initial discussion; a separate event would go deeper into XR technology. At this point the speakers had not personally spent time with Vision Pro. They distinguish what they saw at the announcement, reports from early demonstrations and their own experience with other VR devices.

Eye-directed selection followed by a small hand gesture interests them as a potentially low-friction way to interact. One participant recalls eye tracking on PS VR2 and earlier dedicated equipment. That comparison helps explain why the idea is exciting, but it is not a measured comparison of precision or comfort between devices.

Price leads to a question about productive work. If a headset genuinely improves workspace, information placement or concentration, a professional might consider it in the same category as a computer or display upgrade. The group does not have evidence yet that it makes a given task faster. A larger virtual screen may or may not be comfortable for long sessions; real work and longer use would have to decide.

They connect the new device to older investments in ARKit, RealityKit, spatial audio, Apple Silicon, windows and scenes. Several once-separate capabilities now appear together. This makes the platform feel more coherent to developers, but nobody at the table can establish exactly when or why every internal decision was made.

## Developers can help find a use case; they cannot declare one in advance

For mobile developers, the new platform raises practical questions. Will an existing iPad app be useful there? How much of a familiar skill set carries over? What task is better in a spatial interface than on an ordinary screen? The guests do not predict with certainty that phones will be replaced. They compare this stage with early smartphone development, when many experiments disappeared and a smaller set proved durable.

Content is another thread. A large viewing surface, spatial audio, 3D footage and interactive scenes could create new ways to make or experience stories and games. The guests discuss possible participatory films and other forms as directions for exploration, not mature products already demonstrated in the conversation.

The event thus ends where it began: read the language and framework changes carefully, try building something concrete, then ask whether a person actually benefits. The recording preserves both the implementation detail and the uncertainty that developers felt when a new platform had just been announced.

[Watch the complete discussion in Chinese](https://www.bilibili.com/video/BV1Rh411T7ET?p=1).
