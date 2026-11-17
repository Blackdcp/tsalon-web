---
title: "WWDC23 Developer Review: Interactive Learning, SwiftUI, Server-Side Swift, and Spatial Computing"
summary: "A full account of the second WWDC23 developer discussion: a student's scheduling-algorithm Playground, changes to SwiftUI and SwiftData, Kevin's server-side Swift practice, Eric's spatial projects, and two rounds of audience discussion."
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 39
author: editorial-team
topics: [Apple, WWDC, Engineering, Developer Growth]
relatedEvents: []
relatedTalks: []
relatedRecordings: [wwdc23-developer-review]
cover: /images/default-cover.svg
coverAlt: General cover for a historical WWDC23 developer discussion
citations:
  - label: "WWDC23 Review: Complete Recording of the Second Discussion"
    url: "https://www.bilibili.com/video/BV1Bc411g7RJ?p=1"
  - label: "Apple WWDC23: Discover Observation in SwiftUI"
    url: "https://developer.apple.com/videos/play/wwdc2023/10149/"
  - label: "Apple WWDC23: What's new in SwiftUI"
    url: "https://developer.apple.com/videos/play/wwdc2023/10148/"
  - label: "Apple WWDC23: Migrate to SwiftData"
    url: "https://developer.apple.com/videos/play/wwdc2023/10189/"
  - label: "Apple WWDC23: Meet UIKit for spatial computing"
    url: "https://developer.apple.com/videos/play/wwdc2023/111215/"
  - label: "Apple WWDC23: Meet Object Capture for iOS"
    url: "https://developer.apple.com/videos/play/wwdc2023/10191/"
  - label: "Apple's 2023 Vision Pro announcement"
    url: "https://www.apple.com/newsroom/2023/06/introducing-apple-vision-pro/"
tldr:
  - "The student project began with a problem its creator did not yet understand: A student developer encountered scheduling algorithms in an operating-systems course."
  - "A small microblog example connects models, database, and routes: Kevin used Vapor and a simple relationship between users and posts."
  - "Discussion two: why would someone put the headset on again?: The final roundtable moved from technology to content and business."
faq: []
featured: false
draft: false
translationOf: wwdc23-developer-review-recap
translationStatus: reviewed
seo:
  title: "WWDC23 Developer Review: SwiftUI and Vision Pro | T Salon"
  description: "The student Playground, SwiftUI and SwiftData changes, Kevin's Vapor server, Eric's spatial projects, and two debates on Swift tooling and Vision Pro use."
  noindex: false
---

This [WWDC23 review](https://www.bilibili.com/video/BV1Bc411g7RJ?p=1) brings four kinds of development experience together: how a student built an educational project, how an experienced SwiftUI developer evaluated new frameworks, why an independent developer moved existing logic to a server, and whether spatial computing could become a platform worth sustained investment.

The T Salon account published the recording in June 2023. It lasts about two hours and 51 minutes. The assessments belong to that launch and beta period: iOS 17 had not been released, SwiftData was new, and Apple Vision Pro had just been announced. Expectations about the future should not be read as features that later products had already delivered.

## The student project began with a problem its creator did not yet understand

A student developer encountered scheduling algorithms in an operating-systems course. Reading the written lesson again afterward still left the subject abstract. Rather than memorize the definitions of different algorithms, he wanted an interactive teaching tool that showed how tasks queue, receive computing resources, and affect performance.

He gave each of six scheduling algorithms an introduction and a simulation. Long colored bars represent tasks. A user can add tasks, watch execution, and inspect performance measures. The introductions explain how an algorithm works and why it arose; the simulations let the learner change conditions and see the consequences. This is not a textbook divided into screens. It is a way to run a small experiment while learning.

His own confusion supplied the subject, rather than a search for a fashionable competition entry. Earlier experience with interactive learning websites suggested animation and a manipulable task queue. A computer can play music, edit a document, and update software at once, but its computing resources are finite. How a scheduling algorithm determines which task gets those resources is the question his project makes visible. The two-step structure matters: learn the rule and its purpose, then add tasks and watch colored bars queue while the performance measures change.

He used Layout, Table, and navigation APIs released the previous year to make task bars fill available space, present data in tables, and organize chapters. These choices served comprehension; they were not an exercise in listing API names. Someone without an operating-systems background should be able to enter through an everyday example of multitasking and then understand what a prompt or button invites them to try next.

The development window was under three weeks. He said he spent roughly half of it rereading the scheduling chapter of an operating-systems textbook rather than writing interface code, and named *Operating Systems: Three Easy Pieces* as a resource. An educational animation that explains an algorithm incorrectly can mislead more effectively than a plain page. Only after revisiting the material did he decide what belonged on the first screen, which terminology could be simplified, and how a blue button could guide the learner into the next section. Correct content, technical implementation, and guidance were inseparable parts of the work.

His submission advice was similarly concrete: describe the project's purpose, why particular technologies were chosen, what he personally did, who it helps, and which details a reviewer might otherwise miss. A reviewer should not have to guess that a useful function is hidden somewhere. He immediately qualified the advice as his own reflection after winning, not a shortcut through an official scoring system. Other successful entries may stand out through technology, artistic expression, or an idea; a single “winning formula” would narrow the work unnecessarily.

He also showed a screenshot of himself watching a WWDC22 Playground discussion the year before. He had been an audience member in front of a screen; one year later he was speaking to the community. That change gave a specific example of the effect a community discussion can have.

## Observation: determine which state actually affects a view

The SwiftUI speaker used many small examples to survey that year's changes. He did not expect viewers to memorize every method in one evening. He wanted them to build a map, so that when a problem later arose they would know a new system capability might already exist.

The data-flow change he cared about most was Observation. With the older `ObservableObject` pattern, an object-level change signal could cause several dependent views to recompute even when some of them had not used the property that changed. The new mechanism tracks the properties a view actually reads while it runs, narrowing which changes affect it. This concerns update dependencies and computation; it does not promise that a property change repaints only one pixel or fixes every performance problem. [Apple's session from that year explains observation based on property access.](https://developer.apple.com/videos/play/wwdc2023/10149/)

He first demonstrated the contrast with an object containing `isActive` and a count. One view read only the count. Changing `isActive` elsewhere could still cause the count-only view to recompute under the older object-level notification. The macro-enabled model registers the properties read as the view executes. A shorter model declaration is only the surface-level improvement; more accurate dependency tracking was his main point.

The macro also does not remove the need to understand ownership. He distinguished state owned by a view, an object passed through the environment, and a property that needs a two-way binding for an input control. Under older code, a developer might use `@StateObject` to own an object, `@EnvironmentObject` to propagate it through a view tree, and `@ObservedObject` to receive one from a parent. In the new model, a view can own an observable reference with `@State`, pass it through the environment, and introduce `@Bindable` when it needs to create bindings. `@Bindable` is not a replacement for every aspect of an object's lifecycle.

He therefore advised against mechanically renaming old property wrappers one by one. Draw the ownership relationship first: who creates the object, who reads it, who modifies it, and which target OS versions the application supports. He urged teams with existing applications to assess migration cost. That caution should not be exaggerated into a claim that old and new observation models can never coexist in one application. Apple's [migration guidance](https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro/) describes gradual changes, while individual views still need to follow the observation rules of the model they use. Incremental migration and effortless migration are different things.

In a quick tour of other frameworks, he noted SwiftUI integrations for MapKit, Charts, and StoreKit. Route display, camera changes, chart scrolling, and standardized subscription presentation could remove some custom view and scrolling code. They need not all be adopted in one project. If a new API requires raising the app's minimum OS version, he said to weigh the feature's real benefit against which users can upgrade.

## Animation became more expressive and easier to scope

The demonstration moved to animation. The SwiftUI speaker liked the new spring presets: developers could obtain a natural-looking start and finish without first tuning every physics parameter. Springs had existed before 2023. What changed was how their behavior, defaults, and parameters could be expressed.

The larger question was *what* an animation affects. Animating a state change could previously pull along changes that were not meant to move together. Position and scale might need different speeds or curves. New scoping expressions let developers apply a particular animation to a more specific group of changes. Transactions and custom animation can provide deeper control, but a simple product effect need not become elaborate just to use a new API.

He also showed the lower-level custom animation protocol. Given time and an animatable vector value, a developer can decide how the value changes, and, when necessary, how the motion joins a previous animation and preserves velocity. Presets remain enough for most ordinary interfaces. This entry point serves cases that require a carefully designed motion path.

Phase and keyframe animations work at another level. Phases describe several states reached in sequence: a useful way to express a multi-step action. Keyframes specify how a value changes along a finer timeline, with separate tracks controlling different properties. One describes the stages of a process; the other gives more exact choreography. Separating these levels makes “more customizable animation” meaningful rather than treating every new function as the same feature. The purpose of the effect and the cost of frequent updates still matter.

Visual effects brought geometry, shaders, and symbol animation into the discussion. `visualEffect` can avoid intermediate plumbing for some effects based on a view's size or position, but its closure supports a defined set of effects; it does not accept every modifier arbitrarily. Shaders offer color and distortion effects while still requiring graphics knowledge. Animated SF Symbols make common feedback easier to preview and invoke. These APIs reduce repeated work, but none decides for the developer whether an effect helps the user.

## Scrolling, tables, and desktop details remove detours

Scroll containers were another focus. The speaker brought together target identification, programmatic position control, paging, state changes during scrolling, content margins, and clipping. Each appears small alone; together they can replace a great deal of manual size measurement, position passing, and extra view wrappers.

For example, changing an element's opacity or position as it approaches an edge requires knowing its phase within the scroll container. A button that scrolls to a particular item needs a stable target identity. A shadow extending outside the container raises a clipping decision. Different APIs address different problems. “Add a scrolling modifier” is not a universal layout answer. He also warned that list structure and item identity affect performance, which must be measured with the actual container and data. One example cannot prove that every nested `ForEach` is slow.

The smaller changes he covered were tied to application needs: collapsible table sections, column headers, column order, and selection make data-heavy interfaces easier to organize; container-relative sizing reduces common layout arithmetic; shape Boolean operations and differentiated corners offer more direct visual expression. Text scaling and language-specific typography remind developers that the same apparent size does not suit every writing system.

In his table demonstration, users could reorder columns and find that order preserved when they opened the view again. Selection state could be passed through the environment to row content rather than manually threaded through every nested view. He cared especially about long-list performance, but discussed particular constructions of `List`, `Table`, and `Section`, not a universal ban on nesting `ForEach`. From the user's perspective, native support for expansion, column order, and highlighting lets application code focus more closely on how people inspect and organize data. Developers still need to handle large datasets, screen sizes, and keyboard interaction.

Generated symbols for image and color assets can reduce misspelled strings, though teams still have to verify that a resource exists and the target is correct. Continuous button pressing, hover, keyboards, and focus support interactions familiar on iPad and Mac. Inspector offers a cross-platform container for detail panels; empty-content views, settings windows, and window-closing APIs fill out common flows. He also recorded beta features that did not yet work reliably for him, without treating a preview issue as a final-release quality verdict.

He closed his SwiftUI portion by revisiting a pre-release wish list. Property-level observation and some list improvements pleased him; complex gestures, text input, and compatibility with older OS versions still left him wanting more. These were choices informed by problems he had encountered, not claims that every input control was unchanged or that no new capability could ever support older systems. [Apple's SwiftUI overview from WWDC23](https://developer.apple.com/videos/play/wwdc2023/10148/) gives the scope of the announced features.

## SwiftData: a more Swift-like declaration does not erase persistence problems

The discussion then moved to SwiftData. Developers had previously described entities and relationships in a model editor and let tooling generate corresponding types. The new approach puts more of the model, attribute rules, and relationships in Swift code, using macros to reduce boilerplate. Containers, contexts, queries, and migration also received new interfaces.

The speaker's judgment had two parts. People who know Core Data can recognize many concepts, and the new syntax is more convenient. But a short declaration does not mean beginners can skip persistence. When data is saved, how relationships change, and what happens when a model evolves are still product questions. Expressions such as `#Predicate` have limits of their own; looking like an ordinary Swift closure does not mean arbitrary application logic can become a storage query.

His first-release concerns were coexistence with existing projects, coverage of advanced capabilities, and whether a product's synchronization needs could be met. Those concerns should remain qualified. SwiftData builds on existing Core Data persistence technology rather than rewriting the entire foundation from scratch. That does not guarantee an application can never lose data, or that the two public APIs expose identical capabilities.

Apple's [2023 migration session](https://developer.apple.com/videos/play/wwdc2023/10189/) discusses gradual adoption and coexistence, while also requiring teams to manage class-name collisions, keep the two models aligned, and handle versions. That matches the speaker's warning about maintenance work. Adoption should depend on the needed capabilities and verified migration, rather than an all-or-nothing claim that new APIs must replace everything or can never be used in an older project. His expectations about what the platform might become years later were predictions made at the time.

## Why Kevin moved application logic to a Swift server

Kevin began with his own Japanese-language learning product. He had wanted the application to work offline and independently for a long time. When its grammar-analysis model changed, however, users who had not updated the app could not receive the new results promptly. That need led him to move part of the processing to a server.

His commitment to offline operation was personal as well as technical: he wanted installed copies to keep working even if he could no longer maintain the product. Moving grammar analysis to the server gave up some of that independence in exchange for a single model that could be updated for everyone. It was a choice about a function that no longer fit the offline approach, not an argument that all application logic belongs in the cloud.

He had used Rails, Node.js, Phoenix, and Go. Rails conventions and scaffolding made common account, article, and comment functions quick to start. Node.js's non-blocking I/O and other frameworks' real-time capabilities addressed other problems he had encountered. He appreciated how conventions can save work, but his existing product logic was already written in Swift. Extracting suitable parts into a package avoided rewriting the whole implementation. Compile-time type checking, access to familiar native libraries, and a language he knew well also favored Swift for his project.

He compared non-blocking I/O to a restaurant server who can attend another table rather than standing idle while one group decides what to order. The analogy separates waiting from doing work. It does not imply that every piece of server code automatically avoids blocking or that other languages cannot handle concurrency. His strong preferences about languages, frameworks, and memory came from his experience, not a general benchmark.

In his deployment, Kevin reported that infrastructure costs fell by roughly 70 percent after the move. That is his account of a particular project, traffic pattern, and deployment, not a promise that Swift will save a fixed percentage elsewhere or beat other languages in every workload. He also named costs on the other side: a third-party service might have no Swift SDK, and someone familiar with client-side Swift may not know server data, protocols, or operations. A familiar language can reduce one expense while moving effort into ecosystem integration and hiring.

## A small microblog example connects models, database, and routes

Kevin used Vapor and a simple relationship between users and posts. Vapor was the framework in this demonstration, not the only possible route for server-side Swift then or now.

The microblog-like sequence was useful because it showed the full path for someone new to server development. He created a Vapor project, chose whether to use Fluent, and selected a database. Then he expressed `User` and `Post` fields and their relationship as models. Drawing a “parent-child” relationship in Swift does not make the `user_id` association appear in a database by magic; the stored table needs the corresponding field.

A migration's `prepare` creates tables and uniqueness constraints; `revert` drops the tables in the demonstration environment. Kevin recommended inspecting the actual SQL schema at least once. Knowing what the ORM generated gives a developer somewhere to look when a relationship behaves unexpectedly.

Compose described the local database, including image version, volume, username and password, and the container and host ports. The connection string had to match those values. After registering routes, Kevin first listed the available GET and POST paths and only then tested them. “I wrote a controller” does not establish that a request can actually reach it. DocC can generate API documentation from maintained code comments, helping client developers see inputs and outputs, provided comments change when the interface does.

## Testing, identity, and deployment: a working demo is not a complete production service

Kevin demonstrated middleware that attaches user context to a request. He explicitly said that treating a user ID in a request header as authentication was a teaching shortcut. It is not a real identity check: knowing another person's ID does not grant the right to post as that person.

A DTO separates network input and output from a database model. What fields a client needs, which fields should not be exposed, and whether an input is complete do not necessarily match the stored object. In a test, he created a user, created a post as that user, and checked both the returned content and the relationship. This is closer to the business requirement than merely confirming that the server did not throw an error.

He emphasized failure paths too. A wrong password or token must be rejected; it is not enough that a record can be created when everything is correct. Such tests provide feedback after future changes, but permissions, inputs, and exceptional conditions still need coverage. A few successful cases do not prove the whole API is complete.

For deployment, he separated building from running. A Swift toolchain builds the application, and a leaner runtime image holds the result. Compose organizes the app and database. GitHub Actions builds and pushes an image from a version tag, and the server runs the chosen artifact. The transferable practice is turning repeated steps into a traceable process, not assuming that a built image is a highly available service.

One operational detail is easy to miss: starting a database container does not mean the database is ready to accept connections. A service needs readiness handling and a response to connection failures. [Docker's guidance distinguishes running from ready.](https://docs.docker.com/compose/how-tos/startup-order/) Likewise, listening on `0.0.0.0` means listening on all interfaces in the relevant environment, not a security guarantee that only the local machine can reach it. Port exposure and production configuration need separate attention.

Where a third-party service lacks a Swift SDK, Kevin suggested letting another language handle the part it supports and connecting the pieces through an explicit interface. This could be a separate service or a hosted function. The split solves a compatibility problem but adds a network and operations boundary.

He ended with the idea of deploying instances across different failure domains. Two processes on the same machine or in the same region do not protect against every shared failure. Multiple app instances alone also leave the database, traffic routing, and other common dependencies to address.

## Vision Pro entry points: windows, volumes, and immersive spaces

Eric introduced Apple Vision Pro through developer sessions. Windows, volumes, and immersive spaces were his entry points for understanding the interface, connected to SwiftUI, RealityKit, ARKit, and content tools. An existing two-dimensional interface can be a starting point; 3D models and spatial interaction offer different forms of expression.

His examples showed a model placed in an interface, system-assisted tracking and interaction, and Reality Composer Pro organizing content. Unity support gave existing projects another path. Familiar tools do not mean a whole product can simply be moved without redesign. Input, layout, comfort, performance, and the user's task must be reconsidered. SwiftUI is important, but visionOS is not restricted to SwiftUI: [Apple's UIKit session from that year](https://developer.apple.com/videos/play/wwdc2023/111215/) demonstrates another entry point.

The combination of eyes and hands, with less reliance on a handheld controller, excited the speakers. But a system using gaze for interaction does not mean an application can freely read raw eye-tracking data. Apple's [2023 announcement](https://www.apple.com/newsroom/2023/06/introducing-apple-vision-pro/) says where a user looks remains private and eye input is not shared with third-party apps or websites. Discussions of interaction should separate system behavior from developer access.

Eric connected these tools to entertainment, medical presentation, and professional uses. He also compared other headsets and showed tactical-themed footage to explain his interest in information overlays and shared spaces. The footage was an analogy for possibilities, not a measured Vision Pro capability or evidence of a specific deployment, project scale, or use by his team.

## How could his own 3D projects meet a new platform?

Eric presented the direction of Pixel 3D. Previously, a person captured images of an object and reconstructed its model on a Mac. In 2023, Object Capture brought part of that end-to-end flow to supported iOS devices, making capture and reconstruction possible on the same device. He hoped to improve his product with that workflow and use the resulting content on a spatial device.

This is still an image-capture and model-reconstruction process, not instant conversion of any scene into a high-detail model. [Apple's session](https://developer.apple.com/videos/play/wwdc2023/10191/) specifies device and detail-level conditions. Reconstruction on iOS supported the reduced detail level at the time; other detail levels could be handled on a Mac. Eric said he had not yet compared results from the new workflow, so equal quality across phone, Mac, and future headset should not be assumed.

He also discussed research involving positioning, mapping, and cooperation across devices, plus solar-system and orbital-visualization projects. The former asks how information from several devices can form a shared space. The latter asks how existing 3D content might become easier to inspect and manipulate. These were personal projects and plans, not a claim that the publicly announced Vision Pro already provided his full proposed system.

The projects were at different levels of maturity. Pixel 3D already existed, with a planned change to capture and reconstruction. The positioning and mapping research required multi-device cooperation and information fusion. The orbital models were existing 3D content that he imagined bringing to a spatial display. He had not compared mobile and Mac reconstruction quality or finished a final product on the new headset. Keeping these differences visible is more helpful than saying he had already delivered real-time 3D mapping and a space application for Vision Pro.

He placed professional and entertainment possibilities side by side. Models can serve teaching or demonstration, while spatial data and maps might address specific institutional needs. But tactical footage used to explain an overlay does not prove that either his work or Vision Pro had an equivalent operational system. A grounded reading is that spatial computing offered a new display and interaction end for capture, visualization, and multi-device collaboration. Whether an application works still depends on data quality, latency, interaction, and an actual use case. Peripheral location and date details that the live talk moved past do not change that central idea.

## Discussion one: can tools and ecosystem keep pace with the language?

The first closing discussion returned to the student's Playground. The competition required a SwiftPM Playground package. He wanted APIs released the previous year, but Xcode's newly created package had an older minimum OS target, and the relevant setting was hard to find in the interface. Editing the package configuration file by hand to raise the minimum version let him continue. This debugging example shows that an API which appears “missing” may actually be ruled out by a deployment-target setting.

The language discussion produced no single verdict. The SwiftUI speaker felt Swift had adopted ideas from several modern languages, and he saw tension between platform-framework needs and the pace of language evolution. His thoughts about Apple's internal secrecy and proposal process were observations and judgments, not confirmed inside information. Eric described using Swift extensively while still testing how well SwiftUI served his own product needs.

Kevin cared more about sharing logic across platforms. He had already used Swift on both client and server, but still had Android and other environments where that logic could not simply be reused. That made community WebAssembly work interesting to him. A nearer, daily obstacle was Xcode completion that stalled and indexing that failed to recover promptly. He worried that as the language accumulated advanced features, beginners would face a steeper learning curve while tools were not becoming correspondingly dependable. In that case developers pay twice: for greater language complexity and for friction in the tool.

The student wanted richer server-side Swift frameworks and learning resources based on his own backend work. Eric pointed out the practical appeal of Unity and C# for spatial content and cross-platform work. These speakers did not mean the same thing by “language progress.” For some it was cross-platform runtime reach, for others tooling, ecosystem, or syntax. Their shared practical test was whether developers could complete and maintain a task more smoothly. Compatibility, documentation, debugging, and community support determine whether a new language feature becomes useful in a lasting product.

## Discussion two: why would someone put the headset on again?

The final roundtable moved from technology to content and business. Kevin recalled using several VR devices. Their first impression was strong, and online sports once kept him returning, but eventually putting on a headset, heat, and the steps needed to enter the experience became obstacles. If a phone, a computer, or an activity in the physical world is easier, what does the new experience add?

He used VR table tennis to make the change concrete. Network play held his interest for a while, but later he increasingly resisted wearing the headset, feeling hot, and being isolated simply to play a match. Entertainment on a phone or meeting a friend for an actual game had a much lower entry cost. He was distinguishing a compelling first demonstration from a reason to keep using a product, not denying that every spatial application could be useful.

He linked his experience to developer economics. Even if every user of a new headset bought an app, a small device population and a price that cannot rise without limit might leave an independent developer unable to recover production costs. These were risks discussed when the platform had just been announced in 2023, not later installed-base statistics. His talk of needing a “tenfold” improvement was a way to think about switching costs, not a measured universal law. Pricing, user population, and return on development investment had no mature answer at the time.

Eric proposed professional projects, office uses, and institutional procurement. If a customer already has a clear objective and budget, device cost can carry a different weight. Others pressed the virtual-monitor example: what does it add over buying more physical displays? The SwiftUI speaker suggested that a product need not begin with elaborate 3D. A limited spatial expression might already help someone understand data and relationships.

The disagreement was partly about the target market. For an enterprise, museum, or other institution, the headset can be one cost within a larger solution. For consumers, a broad content supply, low effort to enter the experience, and a clear reason to buy become more important. One participant speculated that Apple's own content could help cultivate the market. Another warned that a platform limited to bespoke projects would struggle to become the next broadly used computing device. Virtual displays bring the comparison back to a concrete task: would two more physical monitors provide the same or a better working experience? A floating screen has to answer that question, not merely look impressive.

The student imagined spatial information boards: numbers formerly shown on physical office screens could appear on virtual panels, perhaps continuously pulling a particular value from a web page. He acknowledged that the same number would be available on a phone or computer, so novelty might be much of the appeal. Kevin offered another caution: landscapes and games in a virtual world may eventually make someone value physical life more, including seeing friends, shaking hands, or playing a real table-tennis match. No one needed to prefer the same kind of experience.

Education became a final promising direction. Spatial demonstrations of biology, physics, or chemistry might help understanding, but headset price could create a new barrier. That hope also needs to be tested against learning outcomes and affordability.

The roundtable did not conclude that a cheaper device must succeed, nor that one user's loss of interest disproves every application. It left product questions: who will keep using it, in what situation, what do they gain over existing methods, and what cost will they accept? That returns to the student project at the start. Even a novel technology has to serve a problem people can understand and actually experience.
