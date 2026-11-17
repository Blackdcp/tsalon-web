---
title: "Lu Yining on Frontend Monitoring: From SDK Collection to Business Diagnosis"
summary: Lu Yining explains a frontend monitoring system built for Lalamove and four investigations into blank content, falling channel traffic, location errors, and surging requests.
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 21
author: editorial-team
topics: [Frontend, Monitoring, Observability, Engineering]
relatedEvents: []
relatedRecordings: [shenzhen-frontend-challenges]
cover: /images/default-cover.svg
coverAlt: Generic cover for a historical T Salon Shenzhen frontend talk, not a photo of the guest or event
citations:
  - label: Frontend Challenges and Opportunities Part 1, Frontend Monitoring by Lu Yining
    url: https://www.bilibili.com/video/BV1HY4y1r7rJ?p=1
tldr:
  - "First decide what the monitoring must answer: Lu groups the needs into three categories: understand how users use the product, investigate a particular problem, and observe real page and resource-loading performance."
  - "Two diagnostic routes: begin with a person, or drill down from a curve: A driver report may consist of a screenshot, an ID, and “the button does not work” or “the page will not open.” The team made a command-line tool that turns a driver ID into a monitoring search link instead of rebuilding queries by hand."
  - "Alerts must reflect the rhythm of the business: The same outage can send different page curves in opposite directions."
faq: []
featured: false
draft: false
translationOf: shenzhen-lu-yining-frontend-monitoring-recap
translationStatus: reviewed
seo:
  title: Lu Yining on Frontend Monitoring | T Salon
  description: A 2022 talk on monitoring SDKs, log delivery, Web and mini-program collection, four business investigations, and alerts shaped by usage patterns.
  noindex: false
---

How many visits does your page get? Which platforms do your users favor? When is usage highest? Lu Yining opens the talk with these questions. Frontend monitoring is more than error capture: it can help engineers understand a business, diagnose failures, and proactively find opportunities to improve the experience.

> This is part 1 of the Shenzhen recording on frontend challenges and opportunities; the original event article was published on May 9, 2022. Lu describes the Lalamove team's system and cases at that time. Product features, prices, and monitoring figures belong to that historical setting.

## First decide what the monitoring must answer

Lu groups the needs into three categories: understand how users use the product, investigate a particular problem, and observe real page and resource-loading performance. Each calls for different data. Visits and custom events describe business use; the user's path, requests, and errors support incident diagnosis; performance records reveal room for improvement.

The opening questions correspond to business scale, user characteristics, and time trends. Lu does not demand exact PV and UV figures from the audience. The point is that a frontend engineer who does not know even the approximate usage level, Android-versus-iOS mix, or peak hours will struggle to judge whom a release or performance improvement affects.

These observations also give frontend engineers evidence for business discussions. When a proposed feature is disputed, a user reports trouble, or the experience needs work, they can offer more than an implementation from a mockup. Data supports an explanation or suggestion, though understanding what it means still requires business context.

## Why the team chose to build its own system

Lu compares several tools available to the team. Sentry's error context and source-map integration are useful for locating code. He particularly values the sequence of user events: clicks, requests, and possibly application state around an error can be viewed beside a stack trace. But many of his team's investigations did not begin with a JavaScript exception. A colleague supplied a person, a time, or a screenshot. The team wanted an entry point organized around users, pages, and requests rather than errors.

Other products offered page, interface, and performance views closer to that workflow. Cost at high log volumes, private deployment, and where potentially sensitive behavior and request data would be stored remained concerns. Lu wanted the categories of a mature product while controlling deployment and data. The team chose to build its own system and used existing dashboards to work backward from questions to the data they would need to collect.

This is a record of one team's needs and decision in 2022. It does not show that Sentry was generally useless, or establish the prices and deployment options of those products today.

## Collection, processing, and querying form three layers

Web and mini-program SDKs collect records. A server receives, cleans, and transforms them. One path stores raw logs in Elasticsearch and lets engineers search details with Kibana. Another produces time-series metrics that Grafana displays as curves.

Lu draws these as collection, server-side handling, and querying. Raw visits, requests, and errors can be filtered one record at a time in Kibana. Aggregated page traffic, region, and request curves reveal changes in Grafana. A curve alone cannot tell what a particular driver did; a pile of individual records makes it hard to notice when an entire channel changed. The two paths operate at different levels of detail.

Page visits, requests, errors, resources, performance, and custom events should each serve a purpose. The goal is not to collect every field simply because the SDK can see it.

## Design the integration before organizing the SDK

Lu wants integration to be as simple as a script and project identifier. After the business code knows the user ID, a package method can add it and the relevant user type. Monitoring categories can be switched on or off, and some requests ignored. This order solves a practical timing problem: at SDK initialization, the application may not yet know who the user is, but later feedback still needs to connect business identity to technical records.

Connecting a user ID is a diagnostic mechanism, not permission to record or expose every field without limits. Collection modules do their own observation; a shared sending module handles delay, batching, retries, and page exit. That keeps each collector from implementing a different upload policy.

## Log delivery must account for size, connections, and page exit

Lu compares three delivery routes. An image request is simple, broadly compatible, and avoids some ordinary cross-origin issues. It is a GET request, however, and URL length limits make it unsuitable for indefinitely combining dozens or hundreds of logs. A POST request can carry a batch in the body, but the monitoring endpoint and business page may be on different domains and require cross-origin setup. Leaving the page can interrupt an ordinary request.

A long-lived WebSocket reuses one connection for later records, but many simultaneous users move the cost to the server's connection management. The team therefore favors POST. A queue groups logs and sends them at intervals, with retries after failure. On page exit, a mechanism such as `sendBeacon` reduces the chance of losing the last records.

These are tradeoffs under the team's volume and browser conditions. No transport is universally invalid, and initiating a background send does not guarantee that every record arrives.

## Web collection: preserve behavior while adding observation

**Requests.** Lu demonstrates with XMLHttpRequest. The SDK saves the original prototype's `open` and `send`, wraps them to record the required information and response event, then calls the originals. This can reveal addresses, duration, and useful business response details without replacing the real request. If instrumentation changes application behavior, the resulting log is less trustworthy. The example is an entry point, not a claim that this automatically covers every network API.

**Errors.** In addition to `window.onerror`, he watches unhandled Promise rejections. They can signal asynchronous failures that never pass through an ordinary error handler. Available messages, stacks, file locations, and other fields become clues, but an event still has to be interpreted alongside the page and requests.

**Page visits.** A single-page application can change routes without a full refresh. Hash routes can be observed through `hashchange`; History routes require watching calls such as `pushState` and `replaceState`. Lu also records the previous URL. A PV should convey not only the current page but how the visitor reached it. For History mode, he compares addresses before recording a change; both paths ultimately create a previous-page-to-current-page relationship. A complete implementation must reflect the application's actual navigation behavior.

**Resources.** Performance API resource entries expose fields such as URL, initiator type, and `duration`. Lu filters for scripts, styles, images, and relevant media rather than calling every returned entry a static resource. Requests and the SDK's own delivery can also appear among resource entries, so `initiatorType` and the monitoring goal matter.

## SDK size and mini-program adaptation

The SDK adds to page cost. Lu reports about 9.3 KB for the compressed version at that time and about 4.3 KB after gzip transfer. Its narrower feature set explains part of its small size. He also shows tactics such as assigning frequently repeated global objects or prototype members to local variables, allowing a minifier to shorten names, and using a leaner wrapper for this small package. A KB comparison without feature scope is not a fair comparison of monitoring products.

Mini-program hosts use different names for their global objects. The SDK detects the host and supplies a common reference so shared logic does not hard-code one platform everywhere. It wraps the host's `request`, observes page lifecycle for visits, and hooks the application-level error entry point. The same pattern carries over: save the original method or configuration, insert collection logic, then preserve the business behavior and send records through the common path.

## Two diagnostic routes: begin with a person, or drill down from a curve

A driver report may consist of a screenshot, an ID, and “the button does not work” or “the page will not open.” The team made a command-line tool that turns a driver ID into a monitoring search link instead of rebuilding queries by hand. From there, engineers inspect visits, requests, and errors by person, time, and page. A Trace ID passed into backend systems links the frontend evidence to server investigation.

Lu describes the case-by-case sequence as: who, at what time, on which page, and what happened? It is more productive than immediately guessing which frontend line failed.

The other route begins with an aggregate anomaly. Engineers inspect traffic or business result curves, narrow the time and page, look at the distribution of result codes, and then examine specific logs. A code in the business response is not the same as an HTTP status; it must be interpreted according to that product's convention. A traffic change is a clue, not automatically an incident.

## Case one: blank content traced through parameters and business flow

A colleague shows a video of a banner click leading to a blank-looking page. Lu checks whether anything had been released and how widely the problem occurs. The page itself opened; it was the content that remained blank. He filters logs around the reported minute, checks the requests, and finds an abnormal response.

The request then leads him to its entry path and parameters. One parameter was wrong. The team takes the evidence to backend colleagues and resolves the issue together. The log narrowed the problem, but knowing what the parameter meant and how the pages and services were connected still required business understanding.

## Case two: a channel's numbers fall while other entrances remain normal

An operations colleague shows a channel whose figures dropped from dozens to single digits. The team compares Web and app release times. A Web change happened earlier, yet the next day's numbers were normal; the app's staged release also does not neatly explain a sudden collapse. They then examine visits to the channel's entrance page and see a matching decline. Visits through other channels remain stable.

That comparison moves attention toward the campaign or channel delivery, which operations can verify with the people responsible. It does not rule out all technical causes merely because there was no release. Several pieces of timing and traffic evidence make the next question much more precise.

## Case three: city-location anomalies reveal a default-value path

Driver registration attempted to fill the city automatically. Invalid registrations later surged for Guangzhou's Yuexiu District, with similar issues in other provinces, although the related frontend code had not changed. The abnormal records were not evenly spread across districts. A portion of Guangdong source IPs could be mapped only to the province, not a city. These records appeared to enter a fallback that converted uncertain location into a definite-looking default city or central district.

The timing mattered. Lu relates the worsening in September to tighter location-permission behavior in apps and browsers at the time. When a more accurate authorized location was unavailable, more visitors fell back to IP-based positioning. That link is his interpretation of the records and context, not something a single log proves by itself.

The product response was to obtain a more reliable system location where possible and authorized. In environments that could not do so, the application should trust an IP-derived city only when it was sufficiently specific; otherwise the user should choose manually. The central lesson is not that one location method is always accurate. It is that an uncertain fallback should not silently masquerade as a precise answer.

## Case four: a request surge needs frontend and backend evidence

A backend alert reports that an API's request rate surged. Frontend monitoring first asks whether page views and in-page requests changed too, distinguishing a possible direct external script from behavior passing through the page. Engineers narrow the time window and examine a browser-related identifier.

In the example, one identifier was associated with roughly ten thousand requests but only 28 page visits in a short interval, with several source IPs. The traffic followed a page path, yet its frequency was inconsistent with ordinary clicks. The team suspected automated abuse and worked with security colleagues on IP and frequency limits.

A browser marker is not proof of a real person's identity. The combination of frontend records, backend observations, and security review supports the judgment.

## Alerts must reflect the rhythm of the business

The same outage can send different page curves in opposite directions. A normal order entrance may decline while customer-support pages or drivers repeatedly checking for work rise. Recovery may then produce a rebound as delayed demand arrives.

The team tried a general trigger when page-view QPS doubled or halved within ten minutes. But an internal system used by support staff rose and fell predictably at the start of work, lunch, and the end of the day. Applying the same threshold there would repeatedly report a “failure.” The shape of the curve means different things in different products.

That returns to Lu's opening questions. Monitoring acquires value through people who understand what the data represents and act on it. Dashboards and individual records, technical events and user behavior, have to be connected during real investigation.
