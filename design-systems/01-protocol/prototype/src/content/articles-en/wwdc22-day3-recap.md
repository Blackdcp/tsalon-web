---
title: "WWDC22 in Practice: Swift Charts, SwiftUI, and AR Wall Art"
summary: "WWDC22.playground Day 3 compares Swift Charts with a handmade chart, builds an AR picture on a detected wall, and examines SwiftUI state, widgets, Developer Mode, Focus Filters, layout, and Xcode tools."
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 21
author: editorial-team
topics: [Apple, WWDC, SwiftUI, AR, Engineering]
relatedEvents: []
relatedTalks: []
relatedRecordings: [wwdc22-playground]
cover: /images/default-cover.svg
coverAlt: Generic cover for the historical WWDC22.playground developer labs
citations:
  - label: Complete WWDC22.playground Day 3 recording
    url: https://www.bilibili.com/video/BV1vg411f7Pr?p=1
  - label: Apple WWDC22 — Use SwiftUI with UIKit
    url: https://developer.apple.com/videos/play/wwdc2022/10072/
  - label: Apple WWDC22 — Compose custom layouts with SwiftUI
    url: https://developer.apple.com/videos/play/wwdc2022/10056/
  - label: Apple WWDC22 — Get to know Developer Mode
    url: https://developer.apple.com/videos/play/wwdc2022/110344/
  - label: Apple's 2018 ARKit 1.5 announcement
    url: https://developer.apple.com/news/?id=01242018b
  - label: Apple Xcode 14 release notes
    url: https://developer.apple.com/cn/documentation/xcode-release-notes/xcode-14-release-notes
tldr:
  - "First lab: One line chart, two ways to build it: Sihua began by defining a fair comparison."
  - "Second lab: Separate the AR session, anchor, and rendering jobs: Wu Ziqi began his ARKit lab by separating four concepts before opening a large body of code."
  - "What the labs left behind: A way to verify new capabilities: Day 3 began with a line chart, placed a picture on a wall, and then ranged across the lock screen, development devices, and build tools."
faq: []
featured: false
draft: false
translationOf: wwdc22-day3-recap
translationStatus: reviewed
seo:
  title: "WWDC22 Day 3: Swift Charts, SwiftUI, and ARKit"
  description: "Two code labs and a roundtable examine charts, SwiftUI updates, AR sessions and anchors, WidgetKit, Developer Mode, Focus Filters, layout, and Xcode tools."
  noindex: false
---

> Organized in 2022 with Laosi Ji Technology, WWDC22.playground Day 3 focused on the betas and technical questions of that moment. Demonstrations and guests' research into framework internals describe their own experiments; Apple's public APIs define a separate, documented boundary.

When a new framework appears, a short code sample is often its most attractive feature. Putting it into a product requires more questions. Which work does it remove from the developer? Where has the cost moved? If performance or compatibility becomes a problem, how much of the cause can the team observe?

WWDC22.playground Day 3 approached those questions through two code labs and a roundtable. Huang Chenzhi hosted. Hu Sihua compared Swift Charts with a handmade chart. Wu Ziqi started with ARKit's basic concepts and demonstrated how to detect a wall and place an image on it. EF, Mumu, and the other guests then discussed lock-screen content, Developer Mode, Focus Filters, and changes in development tools. Each new capability became a choice in an existing project, rather than just an item on a feature list.

## First lab: One line chart, two ways to build it

Sihua began by defining a fair comparison. He used the same data and similar display dimensions to implement a chart in two ways. He wanted to compare the expression, the amount of work hidden in the code, and the appearance of the result. The exercise was not a benchmark proving that either framework was faster in every situation.

With Swift Charts, he constructed a chart from the data, supplied horizontal and vertical coordinates for each point, and used `LineMark` to express the line. He then adjusted line width, color, rounded ends, and other styling. To concentrate on drawing, he hid some axes and used a surrounding container to keep the sizes consistent.

That process separated two responsibilities. The chart framework expressed the relationship between data and graphic marks. Modifiers continued to control the particular appearance. The developer could still decide how a line should look without recreating a foundation of paths and coordinate conversion for every chart.

In the live comparison, the two charts first received the same container size and were placed one above the other in a preview. That avoided mistaking a width or height difference for an implementation difference. The older version used `Shape` and `GeometryReader` to obtain drawing space, turn points into a path, and deal with canvas orientation. The new version fed each point to `LineMark` and styled it with modifiers. The pictures looked similar at the end, but “only a few lines at the call site” concealed the custom component's path calculations, transforms, and future maintenance.

After finishing the line, he temporarily switched to a bar mark. The data could remain while its visual expression changed. Line width, rounded corners, color, and hidden axes could all be addressed in the same overall model. This was not a complete implementation of a complex reporting interface. It did show why a self-maintained `Shape` abstraction may grow as the number of required chart forms grows.

He shared observations about how charts might be rendered underneath. The demonstration supplied no cross-device performance benchmark. Metal support does not make every chart faster than a handmade one in every project. What the lab showed directly was that Swift Charts reduced the work of organizing drawing logic when it covered the required form. Performance for a particular data size, interaction pattern, and target device still needs measurement.

## SwiftUI can enter an existing project one component at a time

After the first lab, the host did not jump straight to the next feature. He asked how SwiftUI turns an upper-level description into something on screen, and how a team with an existing UIKit app might adopt it.

The discussion brought up `UIHostingConfiguration`, which lets a developer use SwiftUI content in a cell of an existing list. Apple's [WWDC22 session “Use SwiftUI with UIKit”](https://developer.apple.com/videos/play/wwdc2022/10072/) demonstrated that route, including a chart inside a cell.

The practical implication is that adopting a new framework can begin with one piece of content. An app need not be rewritten all at once. For a team with many UIKit pages and existing business logic, a local experiment is a more manageable way to ask whether the technology fits a real problem. It also makes the user experience and maintenance cost easier to compare.

His number in the live discussion was roughly a 40 percent reduction in business implementation code in a UIKit-page rewrite watched through an A/B comparison. He also observed that a newcomer could use the declarative structure and previews to see more quickly what a page would display. The host pointed out a limit: changing one line in a small demo and immediately seeing the result is not the same experience as working in a large existing app with compilation and dependency costs. Sihua agreed.

## Less application code makes the flow of data more important

EF raised a production-oriented question: if the code becomes shorter, does execution and debugging become harder? Which problems should developers anticipate?

Sihua did not dismiss the cost. A declarative framework takes on work previously expressed in application code. Some complexity consequently moves into framework execution. A developer still needs to design the source of state, its dependencies, and the scope of change. Otherwise a state update can affect views that were not meant to change.

His example was a property intended to change view A that, because of the data arrangement or dependencies, caused B, C, and D to be evaluated again. The final screenshot might look fine, while frequent updates could still degrade the experience.

Badly organized data dependencies might even create a cycle in the computation graph, he said. That is more serious than a mildly slow redraw. It makes identifying where state comes from and how it propagates part of the design work. SwiftUI handles common concerns such as safe areas, light and dark appearance, accessible text, and animation, reducing application code. Those automatic treatments also form a dependency graph that may need investigation.

To understand the scope of an update, the guests suggested beginning with observable signals, such as how often `body` is evaluated, and then checking actual rendering and elapsed time. One distinction is essential: reevaluating `body` is not equivalent to repainting the same extent of the screen every time. Confusing the two leads performance work in the wrong direction.

Sihua showed a diagram from his own research into SwiftUI's internal dependencies. It connected computation nodes, data flow, and the final display description. Even simple text involves layout, environment, accessibility, animation, and other work. The diagram represented his model for reasoning about the framework; names of private nodes are not stable APIs for application code.

The working principles he drew from it were concrete. Avoid propagating unrelated data changes into content that does not need them. If something does not need animation, do not make it follow changing animation time without cause. When computation behaves unexpectedly, inspect dependencies before trying to optimize only the final drawing step.

He used a minimal `Text("Hello World")` as an example. Putting even those words in the right place and displaying them entails layout, environment, content interpretation, display lists, and related nodes. If the data on which a node depends has not changed, that node need not be reevaluated. Animation can bring the changing value of time into the graph; content that should remain still ought not be pulled along that chain. The drawing explained his performance reasoning, while the private implementation details remained outside the public API.

The group also discussed using different rendering approaches for complex drawing combinations. Such choices require measurement in the actual view. Fewer visible drawing calls in application code do not automatically mean less memory use, fewer offscreen compositions, or lower cost elsewhere.

## Lock-screen content offers a closer entry point and stricter constraints

EF moved the discussion outside the app and into WidgetKit. Content on the home screen and lock screen is unlike a normal app page. The system schedules updates, so a widget cannot simply be treated as a tiny app that runs continuously and refreshes at will.

EF first contrasted the traditional widget Timeline with the previewed feature. The system schedules Timeline content; developers cannot refresh it like an ordinary interface. Live Activities suggested scenarios such as delivery and waiting progress. Before seeing a full technical session, EF framed the product question as whether it could reduce repeated push messages, not as a ready-made implementation plan.

He also noticed the appearance constraints of lock-screen and watch widgets, including the monochrome and tinted treatments shown at the time. The design question becomes more specific than shrinking an existing home-screen widget: what must be readable at a glance, which styles does the system restrict, and which information should change over time? The guests immediately acknowledged that the relation among Live Activities, widgets, and notifications still needed later technical material. A keynote image was not enough to write an update strategy.

Community suggestions included placing time-sensitive information on the lock screen so it took fewer steps to find. Another participant immediately raised privacy: who else might be able to read that information while the phone is locked? Whether one suggested use case remains relevant today is less important than the design principle the exchange reveals. A more convenient display surface also makes information exposure part of the product decision.

The guests also expressed hopes about an always-on display. In that conversation it remained an expectation, separate from the WidgetKit capabilities already announced.

## Second lab: Separate the AR session, anchor, and rendering jobs

Wu Ziqi began his ARKit lab by separating four concepts before opening a large body of code.

`ARSession` manages the interaction with the real environment. A configuration chooses the type of tracking for that session. An anchor gives content a spatial reference. A rendering technology draws the virtual content so it can be seen. Sensing a real surface and rendering a model on the screen work together, but they are not the same job.

He described how camera input, device motion, and other sensing contribute to an app's estimate of its surroundings, while SceneKit, RealityKit, or another renderer produces the visible content. That division makes debugging easier. Failure to detect a plane, a picture placed at the wrong location, and an incorrect-looking material point to different layers.

The lab used Objective-C, ARKit, and SceneKit to detect a vertical plane and place an image on it. That choice also made the demonstration approachable to developers whose existing apps still relied on UIKit and Objective-C. A new capability could enter through a familiar view structure.

The practical first step was to create an `ARSCNView`, set up the view and delegate, and turn on debugging information during development to see feature points and tracking. He then checked whether the target configuration was supported, enabled the required plane detection, and started the session.

Ziqi limited the goal to finding a vertical plane, enabled the corresponding plane detection and autofocus in the configuration, and started `ARSession`. A camera feed appearing did not mean the wall had been detected. He also recommended handling session error callbacks so configuration and tracking failures could be recorded separately. With debugging display enabled, feature points offered a clue about whether the camera had collected enough environmental information. A developer could thus distinguish a session that never started from one that was running but had not yet recognized a wall reliably.

The capability check was repeated for a reason. ARKit offers a common software interface, yet particular abilities can vary with the device and OS. Checking conditions before running is more informative than waiting for an effect that never appears and guessing why.

There are levels of capability, too. Detecting a plane is not the same guarantee as classifying what kind of surface it is. Ziqi checked classification support and results in his add-anchor code, noting that more elaborate recognition may depend on newer hardware. Comparing phones in the demonstration, he also watched feature-point counts alongside image texture and contrast. Camera count alone cannot explain every successful or failed scan.

## A wall is not detected once and forever: Add, update, and remove

The demonstration moved into delegate callbacks. Ziqi divided them into adding, updating, and removing anchors.

Early in a scan, the system may have identified only a small patch of surface. As the phone moves and receives more information, its understanding of the plane can expand or change. An application cannot treat the first anchor as a permanent, final position and extent. The add callback establishes content; update follows the changing estimate; removal can occur as the framework reorganizes or merges surfaces it previously recognized separately.

In the example, the add callback created a node. The update callback adjusted it to a new extent, with the anchor identifier linking the updates to the same object. If two initially separate planes turned out to be one surface, the framework might remove one anchor. An app maintaining its own mapping between anchors and nodes must update that record, too. The callback sequence shows that spatial understanding is continuously revised, not completed at the instant a camera first sees a wall.

Ziqi demonstrated on different phones and talked about variation in detection speed, feature points, and hardware. A failed scan on one phone does not prove that the device can never support the feature. Apple had already announced vertical surface detection in its [2018 ARKit 1.5 release](https://developer.apple.com/news/?id=01242018b); an older phone's failure in this lab cannot be attributed to its single camera alone. The relevant configuration's support checks matter, and an actual failure also calls for examining the environment and code.

The view received a gesture recognizer. A hit-test projected the two-dimensional screen coordinate into the three-dimensional scene to find a plane or node, and the image was attached there. Because the image's own plane might not align with the detected vertical wall, its node needed a rotation. This made wall detection and hanging the picture two separate, testable steps.

The lab also dealt with flicker in the picture. Such a visual fault may come from depth or material settings rather than from environmental tracking. The depth setting adjusted in this demonstration belonged to this arrangement of objects; another AR scene still needs its own check of occlusion and rendering conditions.

## RoomPlan and ARKit 6: Understand current devices while awaiting new ones

At several points, guests mentioned that the headset they had hoped to see was not announced at this WWDC. Ziqi also emphasized that AR capabilities on devices already available were continuing to advance.

RoomPlan interested him because more accessible room scanning could lower the barrier to trying a spatial experience in an app. ARKit 6 interested him for improvements around camera control and image capture, which could bring AR closer to existing photography workflows. Those observations begin with actual tools. They do not require a prediction about when some future device will appear.

At the end of the questions, an audience member asked how LiDAR is used with ARKit. Ziqi said he did not know every lower-level sensor parameter. For many ordinary uses, the developer's first job is to choose an appropriate configuration and check support; the framework integrates the device capabilities it can use. That answer did not mean every hardware feature works with no configuration, nor did it pretend to explain every sensor detail.

## The roundtable brought new capabilities back into real workflows

The final roughly twenty minutes were not a repetition of the labs. The guests raised several separate observations.

**Developer Mode.** EF described his experience with the iOS 16 beta and a newer Xcode. Explicitly turning on development capability, he thought, could make a device owner more aware of what had been enabled. Apple's [session from that year](https://developer.apple.com/videos/play/wwdc2022/110344/) placed the mode in the workflows for running development-signed apps, debugging, and related tests. App Store, TestFlight, and formal in-house enterprise distribution do not all require it; the relevant condition is the development or testing workflow.

**Focus Filters.** Mumu was interested in the way a change in system focus state could alter content within an app, beyond deciding which apps may send notifications. He considered how an app could declare behavior that changes with context, then looked at it as a user who wanted communication or productivity software to show the right material at the right time. The technical entry point matters when it removes repeated manual adjustments as someone moves between work and personal situations.

Mumu described the flow step by step. An app first declares which content or parameters can change with Focus. A user chooses those behaviors for a particular mode in system settings. When the mode changes, the app updates its own presentation in response. He imagined communication apps changing account or content scope and reducing unwanted calls. The host turned “there is a new API” into the product question of which manual step disappears on entering work mode. Whether a given app can switch accounts or filter calls still depends on its own implementation and the relevant system permissions.

**Custom layout.** Sihua looked at grids and the ability for developers to define layout algorithms. Instead of only combining views inside existing containers, a more unusual arrangement could be expressed as its own layout. Apple's [WWDC22 layout session](https://developer.apple.com/videos/play/wwdc2022/10056/) presented tools including Grid and Layout. The potential applications discussed on the show remained ideas; adoption in a product still depends on that product's layout and caching needs.

**Build and memory tools.** Huang discussed the build timeline: how much time went to compilation, building modules, linking, and scripts before or after the build? He also welcomed improvements in seeing object relationships and associated memory in a memory graph. Both tools turn “this feels slow” or “something may be leaking” into a more locatable question. Remarks about threads, Run Loops, and accumulated temporary objects were likewise attempts to seek observable evidence, not a prescription that every background thread must run in one way.

As an example, he imagined repeatedly processing a batch of local pictures and worried that temporary objects might accumulate while background work continued. He wanted to see whether thread activity and memory growth were related. That live hypothesis does not establish that every worker thread needs a kept-alive Run Loop or that objects are released only when a thread sleeps. A real investigation would inspect the task structure, autorelease pools, and allocations. The value of his interest in new tools is the observable question, not a single repair for every thread.

Huang gave a particular memory example. Knowing that a ViewController was retained because of a reference relationship was not enough; he wanted to see which other objects it still held and how much memory remained associated with them. A build timeline similarly divides “the build takes too long” into modules, compilation, linking, and scripts. Each tool gives the next optimization a checkable starting point.

**Bitcode and Background Assets.** EF recalled the difficulty of coordinating support among dependencies when a project used Bitcode, and wondered about the implications of its changing status. Apple's [Xcode 14 release notes](https://developer.apple.com/cn/documentation/xcode-release-notes/xcode-14-release-notes) documented the deprecation at the time. The program did not measure the effect on final app size, so it cannot yield a universal size claim. Ziqi ended by mentioning Background Assets as a possible way for the system to offer more opportunities to prepare resources in the background. He said he had not yet studied it in depth. It remained a direction for later investigation, not an explained implementation in this episode.

## What the labs left behind: A way to verify new capabilities

Day 3 began with a line chart, placed a picture on a wall, and then ranged across the lock screen, development devices, and build tools. The underlying question stayed concrete: what work does the framework perform, what decisions remain with the developer, and how can an unexpected result be broken into parts?

Sihua's lab cautioned against being impressed only by a short call site; the entire implementation and maintenance surface matters. Ziqi's lab cautioned against treating one visual result as a stable model of the world; capability conditions and continuing updates matter. The roundtable carried both habits back into product work. A new entry point can be convenient and restrictive at once, and a more automatic tool still needs observation and verification.
