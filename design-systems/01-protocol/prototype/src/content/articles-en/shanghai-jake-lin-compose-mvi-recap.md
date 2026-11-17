---
title: "Jake Lin on Compose and MVI: From a Text Field to State Flows on Two Platforms"
summary: "Jake Lin refactors a text field step by step to explain state and events in Compose, then uses wallet creation to show how MVI organizes asynchronous work, state changes, testing, and the tradeoffs of applying a similar architecture to iOS and Android."
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 18
author: editorial-team
topics: [Android, Jetpack Compose, MVI, Software architecture, iOS]
relatedEvents: []
relatedRecordings: [shanghai-mobile-practices]
cover: /images/default-cover.svg
coverAlt: Generic cover for a historical T Salon Shanghai mobile talk; it is not a photograph of the speaker or event
citations:
  - label: Applying the MVI pattern with Jetpack Compose — Jake Lin
    url: https://www.bilibili.com/video/BV1QT4y1U7U2?p=1
  - label: Android Developers — State and Jetpack Compose
    url: https://developer.android.com/develop/ui/compose/state
  - label: Android Developers — Guide to app architecture
    url: https://developer.android.com/topic/architecture
  - label: Kotlin StateFlow API
    url: https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/
tldr:
  - "A common architecture brings benefits and costs: Jake begins with maintainability, reuse, extensibility, and communication."
  - "Step one: share local state between a text field and text: Jake opens a new Compose project and changes its generated greeting."
  - "The team's circumstances at the time: Jake closes by describing the team's then-current iOS, Android, and some backend-for-frontend work, remote collaboration, learning time, and recruitment."
faq: []
featured: false
draft: false
translationOf: shanghai-jake-lin-compose-mvi-recap
translationStatus: reviewed
seo:
  title: "Jake Lin on Compose and MVI State Flows"
  description: "Jake Lin traces Compose state and actions from a text field to wallet creation, testing, and two native platform implementations."
  noindex: false
---

At the time of this talk, Jake Lin worked at REA Group on mobile products, development effectiveness, and the developer experience. His interest in architecture was about more than sorting code into categories: he wanted developers from different backgrounds to contribute to the same project and still understand its logic when the team adopted a new UI technology.

> This recording is from T Salon Shanghai's mobile technology practice series. The article associated with the video was published on March 20, 2022; the event date has not been confirmed. The Compose, Kotlin, and Swift examples, as well as the team's circumstances, belong to that period.

## A common architecture brings benefits and costs

Jake begins with maintainability, reuse, extensibility, and communication. As a team grows, predictable locations for code reduce the effort spent explaining in reviews where a piece of logic belongs. They also make it easier for developers with different experience to work in one codebase.

He is equally direct about the cost. Layers mean more code and indirection, even for a small page. Reactive programming raises the learning curve. A framework's strong conventions limit how code may be written: that consistency helps maintenance, but can make onboarding and the introduction of a new technology harder. Consistency and reduced freedom often come from the same design decision.

An iOS project illustrates his tradeoff. In an MVVM app, he replaced the UIKit view layer with SwiftUI without rewriting the ViewModel, Repository, or networking code. Later he revisited the same social-feed example using newer SwiftUI facilities and Swift concurrency features such as `async/await` and actors. The second change went beyond replacing a view component. In both cases, a familiar division of responsibilities let him spend more effort learning the new facilities. His experience does not imply that choosing an architecture removes the need to refactor.

## Beyond the names: responsibilities and lifecycle

Faced with names such as MVC, MVP, and MVVM, Jake returns to the separation of view and data. Mobile views have lifecycles. Packing business logic into them makes testing, maintenance, and reuse difficult; separating state handling, data access, and repositories, and connecting components through dependency injection, makes their behavior easier to verify independently.

He compares two generations of Android architecture diagrams. In the earlier one, a ViewModel exposes what the UI needs, while a Repository coordinates local data and remote APIs. In the newer diagram, data sources belong to a Data layer with a single source of truth; a Domain layer of use cases is optional; and the UI layer renders through a state holder. The diagram and terminology changed, but the practical questions remained: where does data originate, who maintains it, and how does the UI observe it? Jake says most of his own apps did not need a separate Domain layer.

The label MVI is therefore not the objective. The [Android architecture guide](https://developer.android.com/topic/architecture) emphasizes separation of concerns, a clear source of state, and unidirectional data flow, while treating the Domain layer as a choice driven by complexity and reuse.

## Compose: the UI follows its current state

Jake starts with an expandable card. It contains an image and text; tapping the container changes an `expanded` value, and the component displays content according to that value. A `@Composable` function describes the UI. When state changes, the relevant composition is updated. `remember` retains a value across recompositions within the current Composition instead of constructing it anew each time.

The example replaces an imperative instruction such as “find this view and change it” with “describe the screen for this state.” Jake draws parallels with SwiftUI, React, and Flutter. Their APIs differ, but each requires developers to understand how changes to state drive a declarative interface. The scope of `remember` matters: it does not by itself save data across configuration changes or provide durable storage. [Compose's state documentation](https://developer.android.com/develop/ui/compose/state) describes those distinctions.

Jake then introduces Model, View, and Intent. Here Intent means a user intention or action, not Android's `Intent` class for starting components. His implementation has a ViewModel expose one `UiState` to the view, while the view expresses operations through one Action entry point.

## Why combine several flows into one UI state?

Consider the search page he shows in two versions. In the first, search results, an `isLoading` flag, and an error arrive separately. The view must decide whether to check loading or error first, what data means when another flag is set, and how conflicting values should appear. Even excellent tests of the ViewModel may leave an inconsistent ordering in the view.

In the second version, the view reads a single `UiState` and chooses among loading, results, and error. If a search with no matches later needs its own presentation, an `Empty` case can be added and the state-handling branch must face that new case. An operation such as “start a search” can likewise enter through an Action rather than one of several unrelated update methods. The benefit comes from the actual type model and exhaustive branch handling; naming an app MVI does not confer it automatically. MVVM can use a unified state too, and MVI cannot prove that every business condition was modeled correctly. The demonstration shows how to reduce invalid combinations of independent flags.

## Step one: share local state between a text field and text

Jake opens a new Compose project and changes its generated greeting. First he removes the `name` parameter and makes the name local mutable state. He then places a `TextField` and greeting `Text` in a `Column`. The field's `value` reads the name, its `onValueChange` writes a new one, and the text only reads it. Typing immediately changes the greeting because both components share the same value.

This small version works, but the state and update rule remain inside UI code. If the rule becomes more complex, how can it be tested without running the whole interface? That is the concrete reason to extract a state holder, rather than adding a class for its own sake.

## Step two: move state and Actions to a ViewModel

Jake creates a ViewModel and a `UiState` containing the name. An internally mutable StateFlow starts with an empty name; an externally readable interface exposes the state. Updates go through `handleAction`. A `NameChanged` Action carries the new input, and the handler reads the old state, copies it while replacing the name, and writes the result back to the flow. The transition from an old state plus an event to a new state is now something a test can inspect.

He briefly adds an email-change Action to show that a new variant prompts the developer to handle another branch, then removes it because the example does not need email. Whether the tool reports a warning or a compiler error depends on the type and how the Kotlin `when` expression is written. Exhaustiveness is a property of the implementation, not a promise made by the MVI label.

The talk associates `copy` closely with notification, but the precise [StateFlow behavior](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/) is equality-based: an equal value is not emitted again. `copy` is a convenient immutable update, not a special notification switch. Likewise, an externally read-only flow needs an appropriately restricted interface; declaring a property as `val` alone does not prevent mutation through an exposed mutable object.

## Step three: read state in the view and send only events upward

Back in Compose, Jake obtains the state holder, collects its flow, and binds fields of `UiState` to the components. The input callback no longer changes the old local variable; it dispatches a name-change Action. The screen looks much like the first version, but its responsibilities have moved.

He places breakpoints on the input callback and Action handler, then types a lowercase `j` in the emulator. While execution is stopped, the UI still shows the old empty value. Inside `handleAction`, the old `UiState.name` is empty and the Action carries `j`. Only after he updates the state flow and lets the UI continue does `j` appear. This step-by-step trace makes the direction visible: the event travels up, and the resulting state travels down. The field does not decide the final displayed value independently of the state holder.

Next he adds a deliberately narrow validation rule: retain only digits from the input, and leave the state alone when the valid value has not changed. He enters `J`, which does not appear, then `01`, which does; another letter leaves the value as `01`. The state holder controls the presented value rather than merely attaching an error message after input. The rule can be unit-tested without putting every case into UI automation. It is a teaching example of the control path; a real text editor also has to consider input methods and complete editing behavior.

Jake says he had tried to organize a comparable input flow in SwiftUI and encountered different behavior when the UI changed during input. He presents this as an open platform-specific issue, not a universal solution for every text component.

## The wallet example: asynchronous work as state transitions

The second half demonstrates two native versions of a Lightning Network wallet. iOS uses SwiftUI, `ObservableObject`, Combine, Swift concurrency, and Codable; Android uses Compose, StateFlow, SharedFlow, Kotlin coroutines, and its serialization facilities. Jake even corrects the name of one Android reactive facility on his slide as he speaks. These are separate platform implementations with similar flows and state organization, not one binary or source file that runs unchanged on both systems.

He launches each app, opens wallet creation, enters a name, and submits. In the ViewModel, the page has form and backup substates. The form holds a wallet name, a service configuration name, and loading information. Three Actions cover changes to the two fields and the create button. Submission first sets a creating state so the UI can show progress, then sends a request. On success, Jake says the app stores the resulting secret in local secure storage and moves to a backup screen that displays material the user needs to preserve. This demonstrates an application flow; the UI demo does not establish the wallet's overall security, key management, or recovery guarantees.

Tests can inspect these transitions: given an initial state and Action, is there an intermediate loading state, and what state follows the response? Failure needs its own behavior. Jake puts the two ViewModels side by side and walks through their `UiState` substates, three Actions, and processing entries. Their similarity gives a developer crossing platforms a familiar reading path, though the code is still written separately in Swift and Kotlin.

He also shows a concrete difference. The Swift version displays an error when creation fails; the Android version had not yet implemented that branch. Similar architecture does not mean behavior or user experience has already been aligned. Error paths have to be completed and checked on each platform.

## The team's circumstances at the time

Jake closes by describing the team's then-current iOS, Android, and some backend-for-frontend work, remote collaboration, learning time, and recruitment. These were circumstances of the 2022 presentation, not a statement about present vacancies or policies.

The demonstration does not treat MVI as a way to make complexity disappear. It shows how clear state ownership, one event entry point, and explicit asynchronous outcomes make the path through an app easier to trace and test. The extra layers, platform differences, and unfinished error handling remain work for the team to own.
