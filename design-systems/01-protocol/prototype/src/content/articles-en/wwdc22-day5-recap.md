---
title: "WWDC22 Day 5: Making New Technology a Product People Can Find"
summary: The final WWDC22 Playground conversation moves from Labs and student projects to Sorted, a clock app, App Clips, passkeys, SwiftUI, AR, and App Store tools.
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 33
author: editorial-team
topics: [Apple, WWDC, Engineering, Product Design, Independent Development]
relatedEvents: []
relatedTalks: []
relatedRecordings: [wwdc22-playground]
cover: /images/default-cover.svg
coverAlt: Generic cover for the historical WWDC22 Playground Day 5 discussion
citations:
  - label: Full WWDC22 Playground Day 5 recording
    url: https://www.bilibili.com/video/BV1iY4y1J7eV?p=1
  - label: Apple WWDC22, What's new in App Clips
    url: https://developer.apple.com/videos/play/wwdc2022/10097/
  - label: Apple WWDC22, Meet passkeys
    url: https://developer.apple.com/videos/play/wwdc2022/10092/
  - label: Apple WWDC22, What's new in SwiftUI
    url: https://developer.apple.com/videos/play/wwdc2022/10072/
  - label: Apple WWDC22, Create parametric 3D room scans with RoomPlan
    url: https://developer.apple.com/videos/play/wwdc2022/10127/
  - label: Apple WWDC22, Discover Benchmarks in App Analytics
    url: https://developer.apple.com/videos/play/wwdc2022/10044/
tldr:
  - "What Labs, Lounges, and fellow developers each provide: Liu Yi and Ellen recall the week their clock app was nominated for an Apple Design Award."
  - "Passkeys require the whole login path to change: A weak self host sees passkeys as potentially important beyond Apple's own ecosystem."
  - "Closing Q&A: tools became easier, but taking part still costs time: Each guest names favorites and frustrations."
faq: []
featured: false
draft: false
translationOf: wwdc22-day5-recap
translationStatus: reviewed
seo:
  title: WWDC22 Day 5 on Products and Developer Practice
  description: The final 2022 Playground talk covers Labs, student work, Sorted, a clock app, App Clips, passkeys, SwiftUI, AR, and App Store experiments.
  noindex: false
---

The final night of WWDC22 Playground ran for nearly four hours. Host Zhang Siqi, the two weak self hosts, Liu Yi and Ellen from the team behind a clock app, Sorted developer Harry, Wang Qiuli, Dai Ming, and student developer Zhang Boshi talked about their week: how they discover technology, make it into a product, and help that product keep finding users.

The [2022 recording](https://www.bilibili.com/video/BV1iY4y1J7eV?p=1) preserves the conversation. “The new system” here means versions such as iOS 16 at the time. Awards, team conditions, operations, and guesses about future devices all belong to that period. Rather than repeat every announcement, the group asks what remains between a new capability and a product that works well for someone.

## What Labs, Lounges, and fellow developers each provide

Liu Yi and Ellen recall the week their clock app was nominated for an Apple Design Award. Meeting the Waterllama team was among its most valuable results: they discussed design, promotion, and operations. The clock app was a nominee, not the eventual winner. Its makers did not reduce the experience to the award outcome. Someone sent a picture of the app being displayed; other developers offered support after the announcement. A distant international community became a set of people they could actually speak with.

Liu Yi had admired the award for years and had scarcely imagined seeing their work presented at Apple Park. The team could not be there, so friends sent video of the display, and Waterllama's developer shared the result from the venue. Neither team won, but they kept talking about their products and operations. What follows is not a formula for winning an award. It is Qiuli's very different WWDC week: a commerce campaign and a new system preview arrived together, so she had to check the existing business before deciding which new entry points belonged in the app.

Qiuli works on a mature commerce product, where WWDC often coincides with a major shopping campaign. Her first tasks are to install the preview system and tools, check whether the existing app still works, organize changes internally, and distinguish adaptation risks from opportunities for new features. A promising API cannot be assessed separately from the stable experience current users need.

Harry approaches Labs with written questions and information about his app. During one discussion of crash reports, an engineer had looked into the case ahead of time, so they could discuss a suspected location rather than start from scratch. That is his experience, not a guarantee that every appointment will have identical preparation or solve a problem. Remote sessions spared him running between rooms and queues, while making engineers reachable to developers who could not travel.

He compares this with 2019 on site: locating the correct area of a large venue, joining a queue, and rushing to another appointment left little time to explain the actual issue. In a remote booking he could submit the app and symptoms beforehand. On one occasion an engineer had already examined its crash information and pointed to a suspect file. That does not make remote discussion inherently better than meeting in person; it moved some time from logistics and background explanation to the specific problem. Harry had booked twenty or thirty sessions in earlier years and considered ten in 2022 relatively few. Those counts describe his habits, not a target every developer should pursue.

This also shows the difference between a public session and an appointment. A session explains a general capability to many people. A Lab can discuss the crash records, reproduction steps, and reasoning of one app. Harry narrows the question and provides material first; “why is my app slow?” without context would consume much of the appointment simply finding a starting point.

Digital Lounges served another purpose. Bofei liked watching a session together while presenters and developers added explanations and questions in the channel. He sometimes read the exchange first and returned to the video because handling both streams simultaneously was overwhelming. Dai Ming regretted joining too few channels before discovering other interests. Zhang Boshi describes a pixel-icon challenge. WWDC was not only a catalog of videos; it included practice and design conversation.

Bofei distinguishes a centralized conference from a channel where questions can follow the lesson and remain available to people who missed it. But a video and a live chat compete for attention, which is why he sometimes read the questions before watching the lesson. Dai Ming's regret was specific: he signed up only for the SwiftUI channel, then other sessions awakened interests he had not anticipated. More ways to participate still require people to choose where to place their limited attention.

A weak self host tells another story about peers: a distinctive interaction in an app or a chance introduction can become the seed of somebody else's later product. Admiring a good idea without immediately demanding every business detail also has value. The host brings up overseas community events to say that people with different backgrounds ask different questions, not to turn a few gatherings into statistics about national developer groups.

## People often remember one moment in an app

The guests do not treat their own preferences as award criteria. Dai Ming likes the details of the clock app and the ease of starting to draw in Procreate without reading a thick manual. Qiuli sees simplicity, smoothness, and long-term care in note-taking and audio apps; her professional habit also makes her check their update histories.

Bofei explains Transit through a particular moment. After moving to a new city, he worried about missing a stop or connection. A route calculated at the beginning is not enough when the plan breaks. At that moment, a traveler needs to know what is nearby, where the next stop is, and how to recover. Transit impressed him by joining those pieces into an actionable flow in the user's anxious context. He is not claiming it invented every individual feature.

That example frames the product stories that follow. Good design can be attractive, but it must also answer why someone opens the app and whether they can complete the task more easily.

## Two student projects: AR guidance and learning sign language

Zhang Boshi introduces an AR creation project and his Swift Student Challenge entry about sign language. The AR project first addresses preparation, not a beautiful model: lighting, environment texture, how to move the device, and how the user knows scanning is complete. If a person sees only a camera feed, failed tracking becomes a confusing product failure rather than an understandable technical limit.

He divides the interface into virtual objects in the real scene, the camera view, and controls fixed to the screen. Buttons must be discoverable without crowding a small display or covering the scene. When the background constantly changes, controls also have to remain legible. Apple's coaching guidance can establish part of the flow, while a product still has to integrate it. He describes contacting engineers through technical discussion to diagnose a framework question instead of debugging entirely alone.

The preparation screen he demonstrates asks users to find a fairly bright, textured environment instead of aiming only at a blank wall. Once inside, plane-scanning guidance and the control layer show what to do next. The buttons remain fixed on the screen rather than becoming three-dimensional objects, while their background colors change as the camera moves. He therefore uses a material that keeps them distinct and avoids covering the main scene. His team had also struggled to tell whether an anomaly came from their code or ARKit; contacting an engineer through a technical event helped them investigate. He offers this as a reason for students to use available discussion channels.

The sign-language work was inspired by the film *CODA*. Its purpose was to encourage hearing people to learn some of the language rather than placing the whole burden of communication on deaf or hard-of-hearing people. The small project introduces basic knowledge through questions, teaches a few letters and words, then tries motion recognition. SwiftUI, a model he trained, and related vision tools serve that learning sequence. Competition scope was limited. It is not a full sign-language translation system, nor proof that every gesture can be recognized reliably.

Zhang describes the order as moving from understanding the issue to attempting an action: a short quiz challenges misconceptions, a few letters and words are shown, and the camera then recognizes one movement. Package size and the time available for the competition kept the vocabulary small. He is demonstrating how an accessibility subject can become an interactive lesson, not announcing that a model understands the full grammar of a natural sign language. The subsequent discussion of live captions and text-to-speech similarly asks makers to notice what their products assume a user can see or hear.

Liu Yi, drawing on judging experience, says student ideas can refresh experienced developers' thinking. Others connect the subject to live captions in video calls and text-to-speech for someone who cannot speak in a call. A product that depends only on looking at a screen or hearing audio excludes some users. Choosing a social issue does not automatically create a good project; designers still have to understand how particular people communicate and build a usable path into the product.

## Sorted: know why the product exists, then build opportunities to be seen

Harry connects product quality, promotion, and sustained operations. Task lists were already plentiful when Sorted launched. Its difference was asking a person when they would do a task, how long it would take, and how those pieces fit into a day. When plans changed, a gesture could move later tasks together. The interface followed a real way of planning work instead of adding another undifferentiated list.

He insists on making the product good before discussing media, but then says a good product still needs to meet people. The team did not begin only with the largest outlet. Smaller publications, podcasters, and creators tried it, supplied feedback, and introduced it to their audiences. Later App Store attention was part of this gradual path, not proof that contacting media automatically wins an Apple recommendation.

Harry returns to Sorted's original problem. A conventional task list records what must be done but does not answer when there is time today or how long each item takes. If unexpected work arrives after a person has arranged the day, moving every later task by hand makes the plan easy to abandon. The gesture that shifts the remaining schedule is therefore central to the product. It also explains his order of promotion: demonstrating a clear answer to a disrupted day is more persuasive than starting with a grand slogan about productivity.

There was a surprise while Sorted 3 was being prepared. Before the team announced a release date, App Store editors noticed the new TestFlight version and contacted them about plans, hoping to prepare a possible feature. Harry recalls being advised to leave roughly eight weeks. The subsequent launch received store attention. The lesson is to have a clear update plan and explain the product change, not to treat a TestFlight upload as an automatic application for promotion.

A recommendation is also brief exposure, not the end of operations. Continuing to update the app, join community activities, and communicate with people helped the product remain understood. The host asks Dai Ming for a reaction. He says some of his MVP attempts failed and that Harry's pairing of product quality with outward conversation struck him. Building privately forever and seeking publicity without a product are both incomplete paths.

## The clock app: materials, sound, and user mail shape a product

Ellen leads this part. She introduces a small team and several products, candidly saying they were not all equally mature. The clock app grew out of OffScreen. Users concentrating on work liked to open a flip clock; the team wondered whether looking at time itself could be more interesting.

They visited furniture and vintage shops and bought physical objects to study. A neon theme drew on real tubes, their lighting behavior, and sound. For a Nixie-tube clock, they looked into the object's history and texture. The wall clock in their office also helped inspire the app icon, and a seasonal effect added snow to a flip clock. Designing a digital clock was not merely changing a background image: display, animation pace, sound, and triggering action worked together.

The neon theme stayed dark until the device was plugged in. Its sound was edited to fit the lighting animation. Another set of numbers could tumble when the device moved. These choices brought familiar physical associations onto a screen. Ellen was not requiring every theme to be perfectly realistic; she wanted details with a reason behind them.

The first launch also had to explain the product. A person who had never seen an advertisement should still recognize a clock app and discover its widgets and other tools. Ellen describes writing for a person who rarely experiments with a phone, without claiming to have run a rigorous test on that audience.

One of the most important changes began with a user email. The team had expected a primarily visual app. A blind user liked its sounds and asked why some themes ticked every second while others sounded only once a minute. That exposed a gap in the team's picture of its users. They added VoiceOver support and tested it themselves. Requests for zooming and a screensaver mode likewise reflected ways people used the app that the team had not predicted. Inclusion here is a daily process of replying, learning, and correcting an incomplete design, not a label attached afterward.

The email raised a precise question: could the user choose between a sound every second and one every minute? Until then the designers had mostly judged themes with their eyes. The message revealed that sound was itself a way of reading time for some people. It led them to reconsider rhythm and accessibility, as well as how they interpreted later requests to enlarge the display, keep the clock visible, or prevent a static screen from staying unchanged too long. Those needs concerned actual use on real devices, rather than optional polish after the art was finished.

Ellen also talks about widgets, iPad pointer and keyboard support, Mac Catalyst, and system entry points. A user need not open the full app frequently for it to have value; relevant information can appear when needed. The team localized store text, screenshots, and previews, and used in-app events and product-page experiments. Explaining a product in a user's own language is part of the experience.

Store descriptions could be improved continually. Apple's Product Page Optimization experiments at the time compared icons, screenshots, and previews; the same experiment did not include every storefront text field. Advertising and creator partnerships were methods this team used, with results that depend on product and audience. Their recommendation and download figures describe their experience at the time.


## App Clips: narrow the task, then check the entire invocation chain

Qiuli brings the conversation back to adaptation in a working product. An App Clip should extract one core task so a person can complete it after scanning or encountering a relevant place or link, without installing the full app first. A large app should not pack the same complexity into a smaller bundle merely because the feature exists.

She considers the entire path from development to invocation: how an App Clip target shares some code with the main app; how app and website association is configured; how cards, links, and experiences are arranged in the developer account; and how to test locally and through TestFlight. One App Clip can begin with different experiences for different entry points without each entry needing a wholly unrelated application. A diagnostic tool turns “it will not open” into inspectable configuration questions instead of another reinstall.

Qiuli names QR codes, App Clip Codes, NFC, and system settings such as Safari, Messages, Maps, and search as possible entries. To a user, each appears to “open a small app.” Behind them, the URL, associated domain, and card setup may differ. The demonstrated diagnostics give clearer pass-or-fail indications for parts of the chain.

The official changes in 2022 had important limits. An App Clip targeting at least iOS 16 could grow to 15 MB, while one that still supported earlier systems remained under the previous 10 MB limit. Access to a CloudKit public database was not unrestricted CloudKit reading and writing. Keychain migration could connect sensitive data when someone installed the full app, but shared keychain groups and iCloud Keychain were outside that support. An API for advanced experiences helped automate the management of entry points and related information. These boundaries come from Apple's [WWDC22 App Clips session](https://developer.apple.com/videos/play/wwdc2022/10097/).

In Q&A, people discuss bundle limits, whether a utility really needs a Clip, and how a large business app finds one suitable entrance. The group hopes commerce products will explore it, but does not confirm a particular release date. They also mention cleanup after a Clip has been inactive, without establishing a precise retention period. Teams still need to follow the official rules applicable when they design the handoff of user data.

The host asks what part of a large commerce app should be extracted. Qiuli does not propose shrinking the whole storefront into a small package. She returns to the user's immediate purpose at an entry point: complete one action after a scan, at a place, or from a link. Sign-in state and the handoff after full installation still matter. A smaller bundle has not solved the user's problem if it opens to several more layers of navigation. That is why she tests the actual link and domain path, not only whether the code compiles.

## Passkeys require the whole login path to change

A weak self host sees passkeys as potentially important beyond Apple's own ecosystem. The discussion starts with reused passwords, the burden of remembering them, and leaks of server-held secrets. It then explains public and private keys. A server stores a public key for verification; the client's corresponding credential completes authentication. A user no longer needs to hand a reusable password to the website for that operation.

Face ID or Touch ID authorizes use locally. It is not a face or fingerprint uploaded as a site's password. Signing in from another device also is not simply copying a private key onto that computer. Apple's [2022 introduction to passkeys](https://developer.apple.com/videos/play/wwdc2022/10092/) builds on standards including WebAuthn and discusses account creation, authentication, and cross-device cases.

One weak self host walks through a login. Creating an account generates a key pair on the device while the website receives the public key. On the next visit, the server sends information to verify, the device signs it with the private key after local authorization, and the server checks the signature. Borrowing a friend's computer poses another problem: it does not hold the original credential. A QR code can bring the phone into the cross-device process. He describes a nearby connection and an exchange of information; the essential point is that the original device proves this login without handing its private key to the borrowed computer. He expects fewer reusable passwords and related leaks, while recognizing that adoption requires services and platforms to work together.

This does not make every account-security problem disappear. A service still needs recovery, sessions, compatibility paths, and security across the account lifecycle; old passwords and new methods may coexist. The host's practical advice is to bring frontend, backend, and other client engineers into the discussion at work. An iOS engineer adding a button cannot complete the adaptation alone.

## Lock screen, Watch, and App Intents shorten the path to a feature

Ellen gives a small daily example. When she unlocks her phone to open a task app, something else often distracts her. If the next task is on the lock screen, she can look and put the device down. A shorter route can mean opening an app less, the opposite of trying to drive every interaction through its home page.

Watch complications and lock-screen widgets both need information that can be understood at a glance in a small area. Guests say the WidgetKit workflow and previews reduce repeated installation onto a watch, while real devices remain necessary for final checks. Harry already had widget code and design, so he could make a lock-screen version quickly. That speed depends on an existing foundation; it is not a promise that every app can adapt in minutes. Their widget-usage numbers are team-specific too.

Ellen describes the development cost: checking Watch complications across many sizes and color combinations used to require multiple watch faces. After each change, the app had to be installed through the phone and synchronized before the result could be inspected on the watch. The new workflow groups several shapes and lets a developer compare previews in Xcode before a final device test. Sorted already had widgets, enabling Harry to adapt a view of upcoming tasks rapidly. Asked how much traffic the entrance brings, Ellen says her team records which widget people use to open the app and sees meaningful use in its own sample. Yet the value of glancing at a task and putting the phone down cannot be measured only by app opens.

App Intents prompt a deeper developer discussion. Older intent-definition editing and localization had consumed time and caused puzzling failures. Expressing the intent primarily in code made logic easier to read, reuse, and test. Harry recounts a Lab answer: construct an intent, execute it, and verify its input and result. Unit tests can cover business behavior, but the system entry point, permissions, and real Siri or Shortcuts interaction still need device testing.

Ellen says maintaining many languages in old definition files meant deploying changes to a device before the team knew whether the system displayed them correctly. Liu Yi admits an OffScreen shortcut still had an unresolved localization issue. Harry gives the example of an Add Task intent: a test can construct it, call its execution method, and check that a task was created from the input. Code-level testability cuts down repeated trial and error, while leaving an end-to-end check from Siri, Shortcuts, or a widget necessary.

The group uses health-code and payment-scan entrances to express a common wish: frequent tasks should not be buried several screens deep. Those examples reflect how often viewers needed to scan codes in 2022.

## SwiftUI progress means fewer patches and clearer state

Dai Ming jokes that capabilities developers once built through awkward workarounds have become official components. Charts, bottom sheets, Grid, custom layouts, sharing, and navigation are among the areas he notices. He likes not merely shorter code but APIs that express what the interface is meant to do more directly.

He also acknowledges migration cost. An app with an existing solution cannot always replace it immediately. Workarounds written for old behavior must be reviewed, changed, and tested. It is possible to welcome new technology and dislike repeatedly rewriting old code. Xcode improvements around icon assets, parameter completion, and editing context matter because they affect daily work.

Dai Ming's examples are concrete. He had considered a web view or third-party library for charts, and now wanted to try the system charting API. Bottom sheets had sent him toward an assortment of custom solutions; the new API could state the height he needed. Sharing from a Mac app had pushed him back into AppKit, whereas the cross-platform interface reduced that detour. Every official replacement, however, creates a migration decision for an app already in use. Remembering early Swift version upgrades, he jokes that relief at a new API and the work of changing old code often arrive together.

NavigationStack leads to the model beneath the syntax. SwiftUI asks a developer to describe a relationship between state and view; the navigation path should likewise be expressible as data instead of scattered push actions. Another guest points out that UIKit is still evolving and SwiftUI can be introduced into portions such as cells. Apple's [2022 SwiftUI session](https://developer.apple.com/videos/play/wwdc2022/10072/) includes such integration. More choices do not mean UIKit has stopped working. The frameworks have different ideas about state, lifecycle, and layout; understanding those differences is safer than mechanically translating old syntax into new.

One weak self host explains why this is not a contest in which one framework must entirely replace the other. SwiftUI navigation had been difficult to describe completely through state, and community members wrapped older controls to compensate. He sees NavigationStack as movement toward the state-driven model. At the same time, the UIKit sessions showed improvements to sizing table and collection cells and a way to use a SwiftUI view within an individual cell. An existing product could keep a mature scrolling container and try the newer approach in one cell, a more controlled path than rebuilding the whole app. His idea that the NavigationStack name acknowledges community usage is an impression, not evidence of Apple's internal naming decision.

The conversation also touches Swift features such as distributed actors and `some` and `any`. Dai Ming is interested in how these directions change the experience of writing code, without walking through a full example. Distributed calls still have to deal with network failure, and the two keywords have different meanings. Predictions about future hardware use of SwiftUI remain predictions from the time.

## AR imagination is broad; RoomPlan's actual output needs precision

Zhang Boshi and Bofei discuss possible spatial interaction. They compare VR, AR, and mixed scenes, then raise occlusion, hand gestures, controls fixed to the view, and objects in a room. A virtual dolphin should not always cover a real person. A three-dimensional button must be discoverable and reachable; a phone tap is not an automatic interaction model for space.

They imagine a clock on a wall, a ceiling turned into a star field, a virtual window showing weather, and interfaces linked to home automation. These are 2022 product ideas. A few session updates, image extraction, or a demo did not establish that Apple had announced a particular headset, operating-system name, or interaction standard.

Zhang gives RoomPlan a clear boundary. It produces parametric room structure and object categories, still some distance from a fine, fully textured property model. He saw dimension issues in an early test, possibly related to that version or its scan conditions; the group had no measurement from later releases. Combining RoomPlan with Object Capture might produce a new experience, but a developer still has to build it. The [official RoomPlan session](https://developer.apple.com/videos/play/wwdc2022/10127/) explains the output and process available then.

Outdoor scenes add further conditions. Showing a digital object at the right point in a city can require location, map data, and on-site recognition together; availability varies with region and device. Content production is another constraint. Even if tracking and rendering work, a team has to make enough good 3D material to sustain a product. They compare a real-estate app's visual result without knowing how that app was built internally.

Zhang asks Bofei a specific question: if a person wearing a device walks up to a restaurant, how does an app identify the actual place before showing the right content? A similar-looking sign alone might mislead it. Location, mapping, sensors, and recognition may need to corroborate one another. Apple's geospatial anchor support at the time had city and regional limits, so a demonstration in the United States did not establish availability in China. Bofei adds a production limit from his experience around spatial-content startups. Even if scanning and occlusion work, making meaningful content for each wall and object takes substantial effort; some teams had shifted toward scenarios they could keep supplying.

## Linking and startup still pose product-specific questions

Bofei recommends sessions that explain history and mechanism, especially linking and runtime behavior. As code and libraries grow, build duration, runtime lookup, package size, and startup cost interact. Understanding why a system works this way is more useful than memorizing one speed switch.

He begins with a small program growing into many object files. Libraries help reuse them. Static linking settles where needed contents belong relatively early, which can add build work and package size; dynamic linking leaves some relationships to resolve later and can move lookup cost into startup or execution. Bofei likes the session's explanation of why one approach followed another: optimizations reassign costs as projects change scale. Dai Ming agrees with the distinction. A development build may omit some release-only work to iterate faster, while the final package still needs size and performance checks.

Dai Ming discusses parallel builds, work that can be skipped during development, and optimization still required for release. He favors avoiding unnecessary dynamic-library overhead; a project's dependency structure, shared code, building, and distribution still determine the tradeoff. The guests also guess why Apple emphasized optimization that year, though changes to performance and the toolchain are more useful to a project than guesses about corporate motive.

There is another question official tools cannot answer for a product team: code may be referenced, but do real users ever reach the corresponding feature? Compile-time reachability and actual runtime use are different things. The guests discuss manual event tracking, class-initialization records, and finer instrumentation, each with limits and overhead. They do not provide a safe list of code to delete. Not observing use is not proof that a feature has no users.

System and tool upgrades may bring gains, while minimum OS support, users' willingness to upgrade, and the team's toolchain migration remain constraints. That is the real engineering issue beneath jokes about waiting for the platform vendor to optimize everything.

## App Store work needs experiments, not only a download total

Liu Yi returns to App Store Connect, a tool his team uses constantly. Submission, in-app events, custom product pages, and Product Page Optimization matter because a small team repeatedly ships versions and maintains several languages. They want fewer repetitive operations and better evidence about which storefront presentation helps.

He describes a changed submission flow that can include an app version, an in-app event, or a custom product page. Publishing an event need not require releasing another app version merely to accompany it. For a team maintaining several products, that removes one kind of repeated work. Liu Yi checks data and ships releases daily, making a smoother dashboard and reliable movement among languages more consequential to him than another visually striking keynote feature.

While talking with Waterllama's team, Liu Yi realized that his own icon configuration had affected whether an experiment feature was available. Peer discussion revealed a control that routine use had not made obvious. Their reported conversion improvement was a result in a particular experiment, not a promise that changing any app's icon will produce the same gain. The transferable practice is to compare variants and examine the path from exposure to download.

The Benchmarks introduced at the time grouped comparable apps and offered relative positions on selected metrics with privacy protections. A percentile can suggest a question to investigate; it cannot explain by itself why conversion differs or grade total app quality. The [official 2022 session](https://developer.apple.com/videos/play/wwdc2022/10044/) shows how benchmarks can sit alongside product-page optimization and custom pages.

Liu Yi explains how he would use that comparison. If his exposure-to-download conversion landed in a lower part of a peer group, he would first check whether the store page communicated the product clearly, then test icons, screenshots, or previews. A Waterllama developer sharing their dashboard led him to discover that the clock app's older icon configuration hid an experiment control; he saw it after updating that setup. The other team's reported gain from changing an icon belonged to its own experiment, not a fixed percentage any app can expect. Categories and business models also matter when interpreting peer groups.

The guests also see opportunities for small developer tools: multilingual release notes, review replies, and bulk work in the dashboard might be improved through APIs. Someone else notes that related products already existed. Not having seen a tool is not evidence that the market lacks one. A useful new product would still need real users, suitable API permissions, and a plan to maintain it.

## Closing Q&A: tools became easier, but taking part still costs time

Each guest names favorites and frustrations. The conversation continues after the prepared product presentations.

Several enjoy the quality of online sessions while missing chance meetings in person. Shared viewing, presenter answers, and developer conversation might work in a hybrid model. That is a hope, not an announced plan for the next conference. Time zones remain a repeated obstacle: people work during the day, stay up to reserve a Lab, and may wait through several hours between appointments. Being allowed to join does not remove the cost of joining.

Harry makes the booking problem tangible. Developers first see a window of available time and learn only later which short segment they receive. If one Lab lands at 3 a.m. and another at 6 a.m. locally, sleeping and waiting are both awkward. Zhang attended only one early-morning meeting and still had to wake beforehand to review the session and organize questions, leaving him tired for the day. A weak self host remembers encounters in corners of a physical venue that a polished video cannot reproduce, while acknowledging that most employed developers cannot take a whole week off for online sessions either. “Open to everyone” still comes with location, work, and sleep constraints.

Harry likes APIs that remove repetitive work and considers raising the minimum system version of a new project. Teams with different users and older-device shares will make different choices. Dai Ming likes the lock screen, Stage Manager, and possibilities for a home space. Others' preferences follow their different working habits. Qiuli reminds everyone that adaptation and changing rules can disrupt plans during a commerce campaign. Her frustration with TestFlight limits and review processes reflects her business experience then; specific quotas and time limits can change with policy.

The final exchange returns to finding knowledge again. A host misses slides that could be skimmed. Someone notes that official videos have transcripts, and the group clarifies the deeper need: search across sessions and jump directly to one small topic. Watching and understanding something does not mean it will be easy to retrieve a month later. Notes, links, and searchable recaps are part of development work.

Thanks and prize drawings end the long evening. It has no single “feature everyone must learn.” Large teams contribute lessons about stability and process, small teams about product detail and operations, students bring new questions, and the community gives those perspectives a place to meet.
