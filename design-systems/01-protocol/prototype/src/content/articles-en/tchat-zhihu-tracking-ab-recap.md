---
title: Yanrui Zhang and Yun Wu on Event Tracking and A/B Testing at Zhihu
summary: A detailed account of two 2022 T Chat talks on Zhihu's data path, event model, session and path context, collection strategies, data quality, experiment assignment, exposure and company-level metrics.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 23
author: editorial-team
topics:
  - Event Tracking
  - A/B Testing
  - Engineering
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-12
cover: /images/talks/tchat-12.jpeg
coverAlt: The T Chat poster featuring Yanrui Zhang and Yun Wu discussing data engineering at Zhihu
citations:
  - label: Event tracking systems, technical presentation in Chinese
    url: https://www.bilibili.com/video/BV1rm4y1c7Nh
  - label: A/B testing system design, technical presentation in Chinese
    url: https://www.bilibili.com/video/BV1we4y1i7VG
tldr:
  - "Data changes on the way from an SDK to a warehouse: The speakers walked through Zhihu's then-current path."
  - "Reporting must protect both the data and the service: Events vary in importance."
  - "An A/A period and company-level measures: The speakers ended with two analysis issues outside the mechanics of fetching a flag."
faq: []
featured: false
draft: false
translationOf: tchat-zhihu-tracking-ab-recap
translationStatus: reviewed
seo:
  title: Event Tracking and A/B Testing at Zhihu | T Chat
  description: Yanrui Zhang and Yun Wu explain data models, sessions, attribution paths, collection and quality monitoring, then stable assignment and exposure in A/B experiments.
  noindex: false
---

> These talks were recorded in 2022. Team architecture, examples and judgments describe that period.

What happens after a client sends a click event? Why might it arrive late, lack a field, or mean something different in two teams' reports? In this T Chat session, Yanrui Zhang and Yun Wu placed those questions along one data path. Their first presentation concerned building and governing event tracking; the second examined A/B experiments from the client side. Reliable events are the input to experiments, while experiments force a stricter question: which experience did a user actually receive, and can the collected data support a conclusion?

## Data changes on the way from an SDK to a warehouse

The speakers walked through Zhihu's then-current path. Web, H5, mini-program and mobile SDKs reported events to receiving services. Messages passed through queues such as Kafka and ETL processing, then into stores and query systems including Hive and Doris. Recommendation and machine-learning consumers needed relatively fast data; other business analysis had different latency and processing needs. A mobile engineer usually sees only the SDK call, but the meaning available to a downstream analyst depends on every subsequent step.

The real-time and other log channels supported different work. The receiving side also had to survive a downstream outage: one service could hold data in LevelDB while its message queue was unavailable and resume sending later. The channels nevertheless carried some duplicate data. Combining their upstream reception and splitting later was raised as a possible future improvement, not described as a completed migration.

Some warehouse fields were not entered by the client. An event produced immediately at app launch may precede the network time needed for calibration. ETL can use later device information and time coordinates to fill earlier records where possible. In a live question, one speaker pointed out a field indicating active behavior that the mobile SDK did not set. The answer was that ETL interpreted event types, such as certain clicks or page appearances, under a business rule and wrote the derived field. The raw event and a business metric are related, but they are not identical.

## The event model determines what can be governed later

SDK code, the receiving protocol, ETL, warehouse tables and consumers all depend on the event model. Once it is in use, changing a field or hierarchy can require many teams to migrate. Each team pays a cost, while the immediate benefit may fall elsewhere. The practical result can be a growing set of compatibility fields rather than a cleaned-up design. That is why the speakers treated the early model as a foundational choice, not merely a naming exercise.

The design they developed in the talk drew on experience across organizations; it was not a claim that every element had already been deployed inside Zhihu. Their framework used Who, When, Where, How and What to describe behavior. The SDK can attach user and device identity, times, environment, and information about whether a push or external link opened the app. The business developer should mainly describe what action happened to what object.

Time requires particular care. Creation on the device, sending from the client and receipt by the server are separate moments. A device clock might be wrong, and network calibration may not be available at launch. Retaining the different coordinates helps distinguish local backlog from later transfer and reception delay. Asking every feature team to invent its own common context would produce inconsistent definitions of the same kind of event.

## Give an action a place in the product

For the business-specific What, the speakers proposed a hierarchy of App, Channel, Page, Module and Action. An app opening is an app-level event. A home page appearing is identified by the app, page and appearance action; a button click adds the module and its action. A content-detail event might also need a content type and ID. Once the platform knows that definition, it can check an actual log for missing parameters instead of merely confirming that some message arrived.

Channel is more than an organizational label. It can identify which business owns an event, where to route a quality problem, and how collection cost is discussed. One speaker said he had not used such a dimension at a previous company and now saw its value in attributing a department's work and diagnosing its data. At a very large scale, Channel could also help split queue traffic and storage responsibilities. That was a design extension discussed in the talk, not a statement that Zhihu had already built a warehouse per department.

The model still needs an outlet for crashes and other system events that do not fit neatly beneath a page. A tidy hierarchy is not useful if it discards important behavior. Nor did the speakers claim that their hierarchy was an adopted industry standard. They welcomed the idea of shared practice while acknowledging that this was a proposal and a way to reason about collection.

## Page instances, inherited context and sessions

A page name is not an individual page visit. A user may open the home page, visit a detail page and return to home. The PageID is the same before and after, but there were two appearances. A per-appearance identifier, called RequestID in the talk, distinguishes them. It is not necessarily a network request ID. Page-appear and page-disappear events share the instance context, while module interactions inherit it. Without that boundary, duration and module clicks could be attached to the wrong visit.

The business supplies the page ID and relevant content parameters; the SDK adds visit identity, time, session and entry context. When the page disappears, it can calculate time spent. A warehouse may associate duration from the disappearance with the appearance record for easier queries. Another possible design sends only after the page ends, but if that final event is lost, the visit may leave no record at all. Splitting appearance and disappearance is a trade between reliability and downstream assembly.

The same question arises for a module click. Passing page and content context with the click helps a real-time recommender act promptly. Joining everything in the warehouse may be appropriate for less time-sensitive analysis. The deciding factor is when the consumer needs the context, not an absolute rule that all enrichment belongs on the client or in the warehouse.

A Session also needs a deliberate boundary. If someone switches briefly to a chat app to answer a message and then returns, splitting solely on background and foreground transitions may fracture one continuous browsing episode. A period of inactivity can indicate a new session, but its duration depends on the product. A new push or external link may start a new attribution episode even after a short interval. Session is thus both a continuity and an acquisition definition; a threshold is a business convention, not a fact the SDK discovers by itself.

## Color the path, then decide what the path can prove

The talk used path coloring to describe carrying significant earlier steps into later events. An order might be reached through home, a content detail page and an activity button, or through another entrance altogether. Keeping only the immediately previous page loses earlier context. Carrying the path allows funnel analysis and comparison of routes leading to a conversion.

The path cannot grow without limit. The speakers imagined moving from page two to page three, going back to page two, then completing an order. Under a defined pruning rule, that detour need not remain in the key path. The SDK can capture ordinary page and click steps; business code can add markers for a campaign or important button. A query or UDF later extracts useful path information. The rules matter: a raw list of every turn is not necessarily an interpretable journey.

Even when an activity button appears on a purchase path, the record does not prove that the button caused extra purchases. It establishes an observed route. An experiment asks a different question about what changed because of an intervention, which is why the second presentation fits with the first.

## Four collection approaches, four kinds of cost

Automatic collection intercepts platform behavior with little feature-team code, but may gather far more than is needed. A framework knows that a control was tapped, not whether the business meaning was "follow an author" or "open a detail page." Transport, storage and later interpretation become expensive, and controls such as text fields require special care to avoid collecting inappropriate input.

Visual selection narrows collection to chosen controls, but often attaches rules to view hierarchy. An interface refactor that changes no product behavior may still break collection. A declarative approach adds business attributes to controls and lets the SDK manage triggering. That requires infrastructure to support new controls and platform behavior. Manual tracking expresses a business action precisely, but puts work and maintenance into feature code.

The speakers said Zhihu then combined declarative and manual approaches, while the SDK managed common behavior such as time on page. The correct comparison is not merely how many lines a feature engineer writes on day one. Once definitions are in a platform, it can generate sample code, check fields and help maintain them. Tooling changes the lifetime cost of each approach.

## Reporting must protect both the data and the service

Events vary in importance. In the example system, app-level events affecting overall activity, page actions and lower-priority module exposures could be queued differently. The client used local storage and structures intended to keep reads affordable. Common environment fields could also be combined rather than repeated verbatim for every event, with a corresponding choice about whether context was assembled before sending or later in the warehouse.

Priority means arrival may be out of creation order after an offline period or a retry. A receiving service under pressure also needs relief. Continuous errors should make clients reduce request frequency through exponential backoff, rather than retrying so aggressively that the SDK amplifies an outage. Once service returns, a fixed slow polling cycle may take too long to clear a backlog. The speakers discussed sending accumulated batches consecutively while limiting concurrent work to one batch at a time. Normal reporting, outage behavior and recovery should be designed as one system; no single batch size suits every organization.

## Data quality has measurable limits

How can an SDK show that it did not silently lose logs? An ordinary business metric relies on the same collection path and is not an independent ground truth. Installing a second full event SDK in a high-volume app would have substantial transfer and storage cost. The speakers described estimating the number expected from event sequence numbers, then comparing with the de-duplicated number actually received. Because priorities can reorder events, the span between observed sequence values can reveal a gap.

That estimate is not an exact success rate. If the latest events are also missing, the largest observed number is too low and the rate appears better than reality. Strictly ordered delivery can also hide an unseen tail. Its strength is consistent trend monitoring and anomaly detection, followed by investigation, not proof that one hundred percent of events arrived.

Creation, sending and receipt times help split backlog on the device from subsequent delivery delay, provided clock calibration is handled. Other checks included issuance of device identifiers, null values in important fields, changes in log volume and alerts. The speakers showed simple SQL patterns that mobile engineers could use themselves: count records by backlog duration, inspect version or location-source distributions, or group identifiers to find cases where one reference device ID maps to multiple internal IDs. The recurring lesson was to define the measure before writing the query.

## A management platform connects requests to validation

A stakeholder requests behavioral analysis; a data product manager defines the event; engineering checks whether it can be implemented. If it cannot, the definition should go back for revision rather than becoming a vaguely similar field at release time. Once implemented, the model and recorded rules guide tests, release, staged rollout and regression checks.

The platform can retain page and action semantics, required custom parameters and sample code. A verification tool can capture real logs, select the expected meaning, compare fields and values, then produce a report. Here the benefit of a shared model becomes concrete: product, engineering and QA can refer to one definition, rather than each reconstructing a different interpretation of the same event.

## In A/B testing, do not switch a person between variants

The second presentation began with assignment stability. If a person sees variant A and then, because a response arrived later, sees variant B during the same relevant lifecycle, both the experience and its eventual measurement are mixed. The speakers called avoiding such crossover a fundamental client requirement. Device-level experiments follow a device identifier; user-level experiments follow the logged-in identity. Logging out and signing into a different account must not carry the first user's exposure state into the second.

Assignment requests are asynchronous. A feature might ask for an experiment value before the response arrives. The then-current design returned a default value and did not report that default as a formal experiment exposure. More subtly, if a feature had already used the default, a later network response did not change that feature's value halfway through its lifecycle. Other experiments not yet read could use their newly available assignments. Two experiments can therefore be in different states at the same moment, depending on whether each has actually influenced the interface.

The rule protects the experience a user already received. It does not by itself establish that an entire experiment is statistically unbiased. Data analysts must still understand who did and did not enter a formal group.

## Assignment cache and exposure cache answer different questions

Once device or user identity is available, the client requests assignments. A failed request can retry, with backoff to avoid overwhelming a troubled service. A successful response contains assignments that can be kept in memory and on disk. This is not yet evidence that every returned experiment was seen by the user.

When business code reads a particular experiment, the client first checks an exposure cache recording what that identity has already used. If present, the same value is returned. Otherwise it reads the assignment, records an exposure and fixes the value for the relevant lifecycle. A user-level exposure cache is cleared when that user logs out, so a new identity gets its own record. This is why an assignment and an actual use cannot be conflated: the server may return ten configurations, while a person encounters only one of the affected features.

For an unchanged assignment, a cache validator such as ETag can avoid transferring the same result repeatedly. Exposures for several experiments close together can be batched instead of creating a request for each. These are transport improvements, not a reason to discard the distinction between assigned and used values.

## An exposure must survive a failed report

A user may receive the new experience while the corresponding exposure log never reaches the server. Analysts would then undercount that variant's actual audience. The described client wrote an exposure to local storage before sending it, removed it after success and kept it after failure. It could try again when the app moved to the background or on a later launch. This resembles the ordinary event-reporting problem from the first talk, but the consequence is especially direct: a missing exposure changes which experiences the analysis believes happened.

## An A/A period and company-level measures

The speakers ended with two analysis issues outside the mechanics of fetching a flag. The first was a pre-experiment period in which groups were assigned but given the same experience. Observe the intended metrics before the actual variants begin. If one group already contains more people likely to buy a certain product, a later sales difference may reflect the grouping rather than the product change. An A/A period can catch an obvious imbalance; it does not replace the rest of experimental design or statistical analysis.

The second issue was conflict between a local win and an overall loss. An experiment on a shared home page could improve team A's measure while hurting team B. The speakers used the idea of company-level north-star metrics to give such decisions a common frame. The initiating team should not declare victory solely from its own dashboard; equally, a change with little local benefit might still help the larger product. Which measures the company values is an organizational decision, and no universal list was supplied in the talk.

They noted that allocation algorithms, metric calculations, report preparation and interpretation involved further specialized work that a short client-side talk could not cover. The client's responsibility was to preserve identity, stable assignment, actual exposure and reliable reporting so that the later analysis had usable inputs. The two presentations therefore meet at one point: event definitions determine what the data means, collection quality determines what was observed, and experiment design determines what conclusions those observations can support.
