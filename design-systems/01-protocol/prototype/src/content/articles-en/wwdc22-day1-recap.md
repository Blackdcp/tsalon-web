---
title: "After the WWDC22 Keynote: Product, Design, Development, and Independent Apps"
summary: "WWDC22.playground Day 1 brings developers, designers, and creators together to debate the lock screen, CarPlay, iPad and Mac interaction, passkeys, SwiftUI, design award apps, and how small teams sustain their products."
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 24
author: editorial-team
topics: [Apple, WWDC, Engineering, Product design, Independent development]
relatedEvents: []
relatedTalks: []
relatedRecordings: [wwdc22-playground]
cover: /images/default-cover.svg
coverAlt: Generic cover for the historical WWDC22.playground keynote discussion
citations:
  - label: Complete Day 1 recording published by Sspai
    url: https://www.bilibili.com/video/BV1DT411V7ow?p=1
  - label: Apple's 2022 iOS 16 and next-generation CarPlay announcement
    url: https://www.apple.com/newsroom/2022/06/apple-unveils-new-ways-to-share-and-communicate-in-ios-16/
  - label: Apple WWDC22 — Meet passkeys
    url: https://developer.apple.com/videos/play/wwdc2022/10092/
  - label: Apple iOS 16 release notes
    url: https://developer.apple.com/documentation/ios-ipados-release-notes/ios-16-release-notes
  - label: Apple's 2022 M2 announcement
    url: https://www.apple.com/uk/newsroom/2022/06/apple-unveils-m2-with-breakthrough-performance-and-capabilities/
  - label: Apple's 2022 Design Awards winners
    url: https://www.apple.com/sg/newsroom/2022/06/apple-announces-winners-of-the-2022-apple-design-awards/
tldr:
  - "The first impression: deeper entry points beneath visible changes: Lao Mai sees an extensive refinement of existing systems and stronger links across the ecosystem."
  - "Settings and passkeys: removing repeated chores: Justin and Zili's dialogue begins with details users face repeatedly."
  - "Keeping an independent app alive: In the final segment, Lao Mai moves away from the brightest system feature toward the conditions that let a team keep improving a worthwhile app."
faq: []
featured: false
draft: false
translationOf: wwdc22-day1-recap
translationStatus: reviewed
seo:
  title: "WWDC22 Day 1: A Roundtable After the Keynote"
  description: "Developers, designers, and creators discuss CarPlay, iPad windows, passkeys, SwiftUI, design award apps, and the work of sustaining an independent product."
  noindex: false
---

> Sspai published the recording of WWDC22.playground Day 1 in 2022. The program was organized with swift.gg, T Salon, and Laosi Ji Technology. Each guest's judgment reflects the information available at the time.

The same keynote does not produce the same list of priorities for everyone. A developer asks how a new framework enters an existing app. A designer asks whether another window system is understandable. A creator asks whether a phone, tablet, and computer can spare one more device switch. A media founder asks whether any of those changes will help a small team keep working.

Day 1 puts those perspectives in one conversation. Zhang Siqi hosts. Lao Mai first recaps the announcements; Feizhu questions product and interaction choices; Lin Xi, also called Xiao Xi, speaks as a creator and user; Justin and Zili turn design and technical details into a dialogue; and Wang Wei, known as Miao Shen, organizes the platform and tooling trends for developers. In the final segment, Lao Mai turns to independent apps, early users, and durable operations. A short introduction covers M2 and the new Macs, iOS 16, iPadOS 16, macOS Ventura, and watchOS 9. The more revealing part is how the guests connect those announcements to actual work.

## The first impression: deeper entry points beneath visible changes

Lao Mai sees an extensive refinement of existing systems and stronger links across the ecosystem. A user may not see a revolutionary new device, but a capability can still move closer to a routine task. The redesigned lock screen is his first example. Fonts, colors, and widgets make it personal; he is more interested in the position of the entry point. If a user sees a task's live status before opening an app, several taps and a wait may disappear. With notifications already crowded and often muted, a useful status is more valuable than occupying another prominent rectangle.

He uses improved Chinese dictation and the ability to lift a subject from a photograph to imagine a lighter way to keep a visual journal. One could speak text, pull an object from an image, and arrange a page with less manual preparation. A journal is an example of how combined capabilities might remove friction, not a validated market or a product Apple had already announced.

Messages, Wallet, Maps, Home, and payment updates need a regional test. Editing an iMessage, paying in installments, or seeing an enhanced map may make sense in a keynote but have different reach, service integration, and habits in China. Lao Mai is also interested in a new smart-home standard without assuming competing domestic ecosystems will immediately interoperate. A developer still has to ask whether local users actually have the problem an API proposes to solve.

## CarPlay: who gets to shape the experience?

Feizhu chooses the preview of next-generation CarPlay as the biggest surprise. Earlier CarPlay brought navigation, audio, and selected phone functions to a vehicle screen. The presentation went further: instrument information, vehicle controls, several displays, and a more complete visual experience. The central question is not whether Apple can draw those screens. It is how the carmaker, platform owner, and driver divide authority over branding, data, safety, and interface behavior.

He places that question against fifteen years of mobile apps. As the phone market matures, a developer naturally looks for another important interface. A car could be one, but an instrument panel and climate controls require the vehicle manufacturer to participate. A third-party iPhone app cannot simply claim that data. Lao Mai asks whether Apple's interface would sit above an existing car system or control deeper functions. Zili compares it to a protocol such as HomeKit, through which hardware companies might actively expose selected functions. Those are a question, an analogy, and a hypothesis, not a confirmed technical diagram.

Feizhu also asks what an independent developer could eventually do on such a platform, and explicitly says the preview does not establish third-party access to the newly shown experience. Wang Wei distinguishes this from the CarPlay framework that already allowed certain app categories. Existing navigation, media, and other eligible apps did not imply that a third party could use every new vehicle-control feature.

Wang makes the distinction concrete. Developers could already build CarPlay apps in approved categories such as music, navigation, and electric-vehicle charging, obtain the relevant entitlement, and work with an Xcode target and simulator. Feizhu is asking about the new preview that spans the instrument cluster, several displays, and controls inside the vehicle. Tools and a review path for the former do not answer whether ordinary third parties can use the latter. Zili notices the continuous display from driver to passenger alongside the center screen and imagines a HomeKit-like protocol in which carmakers opt in. That is a hypothesis about cooperation, not a published interface design.

Lao Mai finds the concept compelling but remains cautious about manufacturer agreements, data exchange, implementation depth, and models that people could actually buy. [Apple's 2022 announcement](https://www.apple.com/newsroom/2022/06/apple-unveils-new-ways-to-share-and-communicate-in-ios-16/) called it a preview and said vehicles would begin to be announced late the following year. It was neither an immediately available upgrade for every car nor an Apple-built car announcement. Guesses about a future car remain guesses.

## More iPad windows: is the work easier?

Feizhu's iPad concern is just as practical. iPadOS multitasking had changed several times, requiring both users and developers to relearn it. Stage Manager offered a common idea across Mac and iPad, but its side strip, Dock, and multiple windows consumed some of a tablet's limited display area. Feizhu says he usually works full-screen, pulling another app temporarily from the Dock only to answer a message. Would always-visible window management make a task easier, or add an interface to manage?

For an app team, the new window sizes come after the challenges already involved in moving an iPhone app to iPad: sidebars, multiple columns, landscape and portrait, and different content density. Feizhu is not rejecting multitasking; he is separating feature completeness from a clear interaction. Wang Wei answers the engineering part: Auto Layout, size classes, and split-view components already handle many ordinary adaptations, while external displays provide an important context for the new multitasking model. Following standard components reduces basic work but does not decide what a distinctive product should do.

Lao Mai had bought an iPad hoping to depend less on his Mac for mobile work, only to return to the computer because of multitasking and external-display limits. He wants to try again, not declare that a tablet has replaced all computer tasks. He also brings out an older tablet with card-based interaction to argue that the iPad need not simply become a Mac. Touch, handwriting, dictation, and image processing might combine into a different way to create or manage work. That possibility and Feizhu's concern about learning costs belong together: the new method has to remove a burden in practice.

The old device is a webOS tablet. Lao Mai recalls its cards, stacks, and gestures as interesting ideas that nevertheless imposed a learning cost on ordinary users. He does not claim Stage Manager must repeat that outcome. Instead, he asks whether pen, finger, dictation, and lifted photo subjects might take over some lighter tasks previously requiring a keyboard and mouse. That possibility needs testing in an actual workflow. Xiao Xi supplies a boundary from her own: she can make text-based material on iPad, but trusts the iPhone camera more for video and still awaits suitable editing software.

## A creator's test of Continuity: one less camera setup

Xiao Xi discusses the MacBook Air, iPad, and iPhone from a creator's standpoint. M2 and a new design interest her, but her current equipment, the cost of changing it, and her editing workload matter more than keynote performance claims. Her immediate question is about Continuity Camera and Desk View. To film an explanation with both a face and a tabletop operation, she normally prepares two camera positions. She first thought the demonstration phone was mounted above the desk. Learning that an ultrawide view and computation could produce a near-overhead perspective made her wonder whether an existing iPhone could replace some setup work.

Justin later identifies Desk View as his own moment of surprise. One phone providing the person and an apparent top-down view combines camera hardware, image transformation, and the user's task. Neither guest tests the resulting image quality in their own production workflow on this stream. A professional production may still need its existing gear; for somebody starting out, using a phone they already own might make the first video easier.

Xiao Xi also hopes for more capable creation software on iPad, especially Final Cut Pro. At that moment this was a wish, not a released or tested app in the discussion. Similarly, Metal and the new chips make Mac and iPad games more interesting, but the available catalog, adaptations, and frame rates still have to be tested in actual games.

## Cooperation across devices and apps

Justin groups the examples into two forms of cooperation: between devices, and between apps around one task. Lock-screen information recalls watch complications; an iPhone camera can enter a Mac workflow; shared material can stay connected to the conversation about it. He is describing a direction visible across several announcements, not claiming every Apple device and app already worked together seamlessly.

Safari's shared tab groups offer a small example. People planning a trip often collect information in separate browsers; a shared group would let them discuss the same pages. Freeform suggests an open canvas for ideas, pictures, and evolving structure. The question is how often a user must restart their work at the boundary of another screen or app.

Convenience also creates attachment. Lao Mai works in media and needs to try devices from other manufacturers, yet leaving an established workflow can suddenly feel inconvenient. The guests recognize both the attraction of an integrated ecosystem and its effect on their willingness to explore alternatives. Neither side of that personal experience is a purchasing verdict for everyone.

## Settings and passkeys: removing repeated chores

Justin and Zili's dialogue begins with details users face repeatedly. Zili likes the redesigned Mac settings sidebar because switching sections may no longer require entering a panel, backing out, and entering another. Their M2 discussion similarly asks how a new chip fits the product range rather than stopping at a numerical comparison. [Apple's M2 announcement](https://www.apple.com/uk/newsroom/2022/06/apple-unveils-m2-with-breakthrough-performance-and-capabilities/) uses “second-generation 5-nanometer technology.” Other process names, future Mac Pro chips, and inventory strategy were the guests' speculation and jokes, not announced plans.

Passkeys matter to them because logging into websites and devices is a daily chore. Remembering passwords, managing a vault, and signing in on several screens all recur. If a secure sign-in becomes less demanding, the benefit repeats. They use a cryptocurrency-wallet comparison to discuss public and private keys, but that analogy has limits. Passkeys do not turn a face into a website password, nor does the discussion establish a universal recovery phrase for moving every credential.

[Apple's WWDC22 passkeys session](https://developer.apple.com/videos/play/wwdc2022/10092/) explains an implementation of the WebAuthn standard: a device uses a private key to answer a challenge, a service holds the public key, and biometrics or another method verifies the user locally. Services still have to integrate the standard. “Fewer passwords to remember” has a technical basis, but account security still has other problems to solve. Cross-platform transfer and recovery were questions still developing at the time of this 2022 conversation.

Justin illustrates the security benefit with a counterfeit sign-in page. A person using a conventional password could hand it to a phishing site and might reuse it elsewhere. With a passkey, a site verifies a signature corresponding to the public key instead of receiving a reusable secret typed into the page. Zili asks what everyday steps would disappear for someone already using iCloud Keychain. Their exchange separates the authentication mechanism, syncing among devices, and the service's integration work. Apple announcing the feature alone cannot make every site support it.

## Design awards: a small function can have a complete expression

Justin says looking through the apps and games brings back the pleasure of wanting to make something playful when he began developing. He and Zili connect three examples in their video segment. `(Not Boring) Habits` makes a daily check-in expressive through gestures and feedback. `Overboard!` changes the player's position in a mystery through its character and narrative. `Moncage` links scenes on different faces of a cube as the view turns, producing a moment of spatial recognition. The products differ in technology and scale, but each develops a small idea with care.

The first two were winners in the Delight and Fun category of [Apple's 2022 Design Awards](https://www.apple.com/sg/newsroom/2022/06/apple-announces-winners-of-the-2022-apple-design-awards/). Discussing `Moncage` or the nominated work of teams from mainland China, Hong Kong, and Taiwan does not mean every title mentioned won an award.

Xiao Xi chooses a focus-timer app organized around cooking noodles. Conventional timers felt dull to her. Here, placing the phone face down becomes putting a lid on a pot; a short session makes a bowl of noodles, while a longer focus period gradually adds ingredients. Completion leaves a visible change rather than only another notification. This is an example of a different emotional experience for the same timer function, not evidence that the app increases productivity by a measurable amount. Lao Mai later adds that the developer drew some illustration inspiration from family life. Interaction, visual feedback, culture, and story may distinguish a small tool without piling on features.

## The absent headset and the questions it still raised

AR and VR recur even though no headset appears in the keynote. Guests put ARKit, RoomPlan, image understanding, spatial location, graphics, and silicon together and ask whether these capabilities could support another device form. How might people interact without familiar controllers? Could hands, speech, or gaze be inputs? Could a shared experience span several devices? These are design questions about current input limitations, not a feature list for unannounced hardware.

Zhang Siqi notes the progression from object capture to room scanning and asks whether Apple is gradually building a better understanding of space. Wang Wei replies that a platform can invest in tools for years before a new product combines them. Neither offers proof of a particular future hardware design. A 2022 course description also did not justify treating all RoomPlan, ARKit image, or device requirements as one finished tutorial. Knowing what was released later cannot convert these contemporary guesses into confirmed predictions.

The discussion briefly reaches iPad peripherals and DriverKit. Asked what hardware might help a creator, Xiao Xi returns to actual creation and games. No product plan comes out of this exchange. Its useful method is to connect an interface to a concrete task before calling it a business opportunity.

## The developer view: understand direction before learning every detail

Wang Wei reminds the group that WWDC is a developer conference. For many viewers, the keynote is the end of the day's news; for a developer, Platforms State of the Union and the technical sessions are a beginning. There are too many sessions to master immediately, and an app supporting older OS versions may not use a new API in its main flow for some time. He separates seeing where the platform is headed from implementing a feature today: follow the direction now, then investigate compatibility and details when adoption becomes practical.

His frame for that year's changes is “continuing integration inside, continuing openness outside.” On the inside he sees common ideas across devices, Swift and SwiftUI, navigation, layout, charts, and development tools. Outside he sees industry standards, service APIs, and more publicly visible sample-code collaboration. It is Wang's analytic frame, not Apple's official complete strategy.

His examples include declarative Swift regular expressions, package plugins, Swift Charts, NavigationStack, custom layout, App Intents, WidgetKit, WeatherKit, and Xcode Cloud. Some help express UI; others extend the platform into building and services. They do not amount to an instruction to migrate every app at once. New concurrency diagnostics may help a codebase move toward safer use of actors and `Sendable`, but exact warnings depend on compiler version and settings.

Wang uses the regular-expression builder to explain his interest: regexes are old, but Swift can express a complicated pattern as a more readable composition. Package plugins could bring work such as format checks into a build. For his “openness” theme, he offers more than passkeys. The Matter standard associated with HomeKit points to cooperation among manufacturers; WeatherKit and mapping services expose network-facing ways to use platform data; Xcode Cloud brings continuous integration into Apple's services. He also notices that the Food Truck sample is on GitHub, where a developer can examine commits and how the project developed, rather than receive only a final zip file. These examples explain his inference about direction, not a claim that every service suits every app.

Wang says SwiftUI's new navigation can express paths and deep links more directly, while shared tools may reduce repeated work across platforms. Sharing an implementation approach still does not mean one design fits every device. He is also interested in `List` internals. [The iOS 16 release notes](https://developer.apple.com/documentation/ios-ipados-release-notes/ios-16-release-notes) state that `List` no longer uses `UITableView`; that does not prove SwiftUI has ceased to depend on UIKit altogether or can now run on non-Apple platforms. His further thoughts about the framework are questions to watch.

His team's clean build fell from roughly ten to eight minutes after moving to the new Xcode in one test, and he welcomed SwiftUI support in view debugging. The same beta exploration encountered a CloudKit crash. Putting the gains next to the unresolved issue explains why a tool can be worth trying without a promise that every project will speed up or should migrate immediately.

Justin asks whether SwiftUI optimization still feels like a black box. Wang agrees that a poorly organized state change can cause a much larger portion of the view tree to update. He has not confirmed whether this year's tools solve that problem and suggests looking at later technical sessions. The honest uncertainty provides a starting point for Day 3's more detailed practical discussion.

## Keeping an independent app alive

In the final segment, Lao Mai moves away from the brightest system feature toward the conditions that let a team keep improving a worthwhile app. Sspai had long looked for work that felt original, aesthetically considered, useful, and enjoyable. Recommending a promising new app only to see it stop updating soon after exposed another requirement: a viable income and working arrangement matter alongside an appealing first release.

He describes a wallpaper app that began as an internal experiment and struggled to cover continuing service costs. After a departing colleague took it on and changed the payment approach with collaborators, there was a path to further development. Another example is a scanning app that began because its developer wanted a lighter way for a partner preparing for exams to scan material. The origin story helped people understand it; service and updates were still necessary to retain them. These are accounts from guests at that time, not current revenue figures or a formula that guarantees the same outcome.

The cases also answer whether promotion must simply mean buying attention. The scanning-app developer wrote about why he had built it for his partner. Readers first understood his reason for removing awkward steps, then began discussing the product. The wallpaper app needed a handover and a changed payment model when its original team could not keep carrying service costs. Lao Mai mentions a small scanning team working from another location and seeking a new product direction after system-level scanning improved. A story, a revenue model, and continued product development are different jobs; one burst of attention cannot replace the others.

The story behind a design matters to Lao Mai. A clock app's lighting drew on research into a visual style; the noodle timer's feedback grew out of lived experience and illustrated details. The story is not packaging invented after completion. It tells a user why the developer made a particular detail that way. He encourages developers to keep and explain that process themselves rather than wait for media coverage to produce it.

Early users are the second point. A large download number does not by itself mean a sustainable product, just as a smaller audience does not imply no value. The target group must genuinely need the service, find the experience worth supporting, and have a channel for useful feedback. Some of the most consequential corrections come from people who use a tool seriously over time.

Lao Mai also recalls an independent game team that received guidance through a platform exchange, continued refining its work, and was later featured. Seeking concrete feedback may help; this story does not establish a guarantee that mentoring produces a feature. With early users, he urges developers to ask whether those people truly need the app and will continue paying for its value before focusing on the absolute count. A small group of users willing to point out problems repeatedly may do more to shape the next version than one large wave of downloads.

Third, independence does not require one person to carry programming, design, promotion, and service alone. People with complementary skills can work together if they discuss incentives and direction clearly. Lao Mai also describes a community plan to connect developers and users more directly; it is a record of what Sspai hoped to do in 2022, not a current promise that the same service is open.

Guests and hosts mention introductions, mentoring, and recommendations they had experienced. Such help may be valuable, but attendance does not guarantee an award, platform feature, or profit. The durable lesson is that a product needs feedback, collaboration, and communication after its first release if it is to become continuing work.
