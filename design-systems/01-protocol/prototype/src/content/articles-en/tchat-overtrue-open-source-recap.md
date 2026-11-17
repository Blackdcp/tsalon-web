---
title: overtrue on Open Source Projects and Developer Growth
summary: A detailed recap of T Chat episode 16, covering project ideas, code and tests, documentation, versioning, promotion, maintenance, and the work experiences that shaped overtrue's approach to development.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 25
author: editorial-team
topics:
  - Open Source
  - Career Development
  - Engineering
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-16
cover: /images/talks/tchat-16.jpeg
coverAlt: The T Chat episode 16 poster for overtrue's discussion of open source and developer growth
citations:
  - label: overtrue on building an open-source project from scratch (Chinese)
    url: https://www.bilibili.com/video/BV1s14y1K7HY
  - label: Conversation with overtrue on growing as a developer (Chinese)
    url: https://www.bilibili.com/video/BV1KP411T7kQ
tldr:
  - "Find the problem before starting a repository: There are many ways to participate in open source: fix a defect, improve a document, correct wording or submit a useful issue."
  - "A WordPress theme led him toward PHP: At university, overtrue studied a field closer to networks and hardware, but was more interested in building on the Web."
  - "Understanding adjacent roles improves delivery: For overtrue, full-stack ability can let someone carry a small product from design and frontend through API and deployment without always waiting for another specialist."
faq: []
featured: false
draft: false
translationOf: tchat-overtrue-open-source-recap
translationStatus: reviewed
seo:
  title: overtrue on Open Source and Developer Growth | T Chat
  description: How a useful personal tool becomes a maintainable open-source project, and what overtrue learned from PHP, large refactors, leadership and engineering teams.
  noindex: false
---

> These recordings were published in 2022. Jobs, tools and views below refer to that period.

In T Chat episode 16, overtrue first discussed how to build an open-source project from zero, then spoke with the host about his own development. He introduced work including EasyWeChat, the Chinese Laravel community and his then-current role on Tencent CDC's CoDesign. The two subjects meet in one recurring question: how does a tool that solves your own problem become understandable, useful and dependable for other people?

His career story likewise starts with a concrete need. He learned PHP to change his WordPress blog, then went on to write themes and plugins. Later jobs required him to design requirements, maintain environments and help rebuild a large API system. Much of the growth he described came when he had to carry a problem through to an actual result.

## Open source: from your own need to someone else's dependency

### Find the problem before starting a repository

There are many ways to participate in open source: fix a defect, improve a document, correct wording or submit a useful issue. Creating a new repository is only one option. Uploading code to GitHub is easy; maintaining something other people can use takes considerably more work.

overtrue suggested looking first at your own daily work. Is a small function copied between projects? Does integrating the same service repeatedly produce the same error-handling problem? Try the existing tools, open an issue or offer a fix. A new project becomes easier to justify when the need is specific and the current solution does not fit. If the author uses the tool personally, installation friction, awkward APIs and assumptions tied to one machine will become visible early.

Questions in communities and issues in mature projects can reveal needs too. A project no longer maintained may still have users; continuing it under its license can be more useful than starting an unrelated imitation. The aim is not to search for a reason to own a project. It is to discover a real problem and find the most useful place to solve it.

### Style, tests and automation support contributors

Public code has readers who do not know the author's habits. Consistent naming, formatting, structure and useful comments lower the cost of understanding it. Existing PHP conventions and tools can settle repeated style disputes; formatting, static analysis, tests and CI can turn routine checks into repeatable work.

Tests serve two purposes. They catch regressions after a change, and difficulty writing them can expose a tangled design. If a feature cannot be given controlled input without pulling in the whole application, its responsibilities or dependencies may need to be separated. overtrue distinguished unit, functional and integration tests, and encouraged attention to failures and boundary values rather than repeatedly confirming the same easy input. Open-source users bring environments and data the author does not control, making those edges especially relevant.

He addressed the familiar objection that there is no time for tests. Writing them takes time and should be included in estimates and delivery conversations. That time may otherwise be spent finding regressions after release. He did not claim that tests prevent all bugs or that every schedule makes ideal practice possible. A personal or open-source project can be a place to learn gradually. His teams had used high coverage expectations, but those were local practices with a training cost, not universal targets.

Checks must also keep running. A Git hook can catch a problem before a commit, while GitHub Actions can run tests after a contribution. When external patches arrive months later, automation helps maintainers see whether old uses were broken, even if the original author no longer remembers every detail of the implementation.

### Documentation should answer a new user's first questions

The best language and format depend on the intended users. A project for Chinese readers can first have a clear Chinese README; an English version can be added as it reaches more developers. A small project may need no separate site. A larger one may benefit from GitHub Pages or a documentation generator, but access should not require joining a chat group merely to discover how the code works.

An author knows the background; a first-time visitor does not. Within moments, the visitor should be able to tell what problem the project solves, whom it serves, what is needed to run it and what a minimal successful use looks like. Installation steps and a small example may do more at the start than pages about internal design. A reference manual remains valuable, but it serves a different stage of use.

He asked authors to picture someone opening a repository for the first time. What command do they run? What result should appear? Could they copy the example and see the API in action? A user guide, a detailed API reference and contributor instructions do not all need to occupy the same paragraph. Contributors also need to know how to report a problem, run checks, prepare a change and submit it. Licenses, upstream influences and contributor credit should be stated clearly.

### A version number communicates compatibility

overtrue spent substantial time on semantic versioning because a release number is a promise to dependents. A major version denotes an incompatible public-interface change; a minor version can add compatible functionality; a patch can fix a defect compatibly. The size of the author's code diff is not the criterion. Swapping two function parameters may take a few lines and still break every caller. Rewriting a large internal implementation may require no user change at all.

He suggested compatibility layers where possible and gathering breaking changes into a planned major release. Pre-releases can give users a chance to try the new behavior. Dependency ranges and update strategy decide which version a user actually gets, so an inaccurate number can cause a production problem far away from the maintainer's computer.

He recalled a mini-program component library update from 2.1 to 2.2 that changed loading behavior incompatibly. A deployment installed the newer dependency and failed, while a local directory still held an older one and appeared fine. Reinstalling in a clean environment finally exposed the difference. To the library maintainer it had been a small code change; to the user it was a breaking change. The incident illustrates why release notes, compatibility checks and clean-environment tests matter to both sides.

### Promotion should be relevant and trustworthy

After release, the right people still need to find a project. overtrue recommended discussing a real problem in the communities that have it: explain what the tool does, whom it fits and where its limits lie. Repeatedly sending a link to unrelated groups spends other people's attention without making the software more useful.

He also saw continuity of identity as a practical aid. He had used a recognizable nickname and avatar across projects, articles and community answers, making it easier for someone to connect a tool to its author later. That is not a requirement to manufacture a persona; open source often spreads through personal recommendations, and discoverability reduces friction. His observation that certain weekday posting times worked better in his communities was just that, an observation from his experience, not a general traffic law.

Harsh feedback requires judgment. A claim that a project "doesn't work" may reveal unclear installation instructions: ask for the environment, point to the relevant steps and update the documentation if it is genuinely confusing. A person who only wants an endless argument does not deserve unlimited maintainer time. overtrue recalled spending too much energy in programming-language disputes when he was younger and later choosing to focus on feedback that could improve a project.

### Long-term maintenance is harder than a launch

Users need to know where to report a problem. New issues, discussions and documentation feedback should be reviewed regularly. A small reproducible defect can be fixed quickly; a request requiring design may need to be recorded for later. Responding does not mean promising every requested feature. It tells a user that someone has read the issue and how it might proceed.

Release cadence should reflect the nature of changes. Compatible features can appear more often; a major version needs more planning. A changelog should say what changed, whom it affects and whether upgrading requires action. Documentation improvement, refactoring and triaging feedback are maintenance too, even if they do not produce a headline feature.

overtrue described the uncomfortable case of a project promoted enthusiastically and then left with unanswered problems after users depend on it, possibly including security reports. Those users may not be able to migrate immediately. He was not demanding that one volunteer work for free forever; he wanted authors to consider maintenance capacity, handover and basic responses before inviting others to build on a tool. The continued dependency is more consequential than the attention a launch receives.

## Growing through the problems a job makes you solve

### A WordPress theme led him toward PHP

At university, overtrue studied a field closer to networks and hardware, but was more interested in building on the Web. He borrowed books to learn frontend work. When he wanted to modify his WordPress blog, he could not get the help he needed, so he read the source, looked up PHP documentation and tried it himself. That led to his own themes and plugins. Seeing other people use them was rewarding, and PHP became a route into professional work.

There were fewer video tutorials available to him then; changing a theme meant reading documentation, studying existing code and repeatedly trying things. He did not start by deciding PHP was objectively the best career language. He wanted his blog to do something. This is also why he took a nuanced view of reinventing a wheel: start by contributing to a current tool, but if it cannot meet a clear need and you can build a better fit, a new implementation can be a legitimate way to learn and help users.

### Jobs that widened his responsibilities

His early self-study developed a troubleshooting habit: extract the meaningful part of an error, identify the underlying tool and concept, then search for an answer. In a 2013 project for Yahoo Taiwan's shopping site, that habit became essential. He was a developer, a communication point between teams and a maintainer of their development environment. Colleagues came to him when a service would not start. He often did not know the answer immediately; repeated investigation taught him Linux environments and infrastructure.

The project also required detailed technical documents before implementation, clear enough for another developer to continue the work. Strict formatting checks and tooling were uncomfortable at first but trained him to understand requirements, design interfaces, explain decisions in writing and coordinate across teams.

At a later job he owned more of an entire delivery process: meeting customers with a product manager, checking draft requirements, designing a database, coding, preparing an environment and releasing the result. Even a seemingly small feature such as an article-to-tag relationship required precise discussion of the expected behavior. He learned not merely another framework but how the pieces of a delivered product depend on each other.

A subsequent mobile Weibo project required a large legacy-system refactor. Small changes had become slow to understand and test after years of additions. He rebuilt a foundation that made business logic and tests easier to organize, then helped migrate roughly 480 interfaces. An action as simple as posting a message could carry historical rules for permissions, images and notifications. He read the old implementation and took notes to distinguish behavior that must remain from structure that could change. A rewrite was not a mechanical translation of old code; it was an attempt to preserve business meaning while making the next change less painful.

His point was not that every unpleasant assignment is good for a developer. These projects forced him to handle unfamiliar environments, cross-team communication, ambiguous requirements and inherited behavior; that breadth offered learning he would not have gained by staying only within a narrow coding task.

### Choosing a large company or a smaller team

The host asked which kind of company helped someone grow faster. overtrue declined to give one answer. Large organizations have resources and experienced developers, but also complicated coordination, legacy systems and changes that may be hard to push through. A smaller team may be able to change tools and practices more quickly and still maintain excellent engineering standards.

He advised investigating the actual team: how does its lead approach technology, what are its code conventions and development environment, and what do people who worked there say? Public technical writing can offer clues. Being near strong engineers does not guarantee that they have time to mentor someone personally; a new employee must still engage with the work, solve problems and digest what others know. Role, pay, reputation and longer-term life plans can all affect the choice.

### Leadership starts before a title

Responsibility can precede a formal title. Someone who consistently drives a piece of work and handles complex problems may become its de facto owner. The role changes how time is spent: meetings, coordination and helping new colleagues fragment the day. Communication expands from one's own task to product, design, frontend, backend, testing and project-management partners.

A lead has to spot risks before code is written. In a requirement or interaction review, overtrue considered whether the design was feasible, which external dependency might fail, and whether the current solution would block later extension. Sometimes he had to argue for a different approach or shield the team from an unsuitable request. Accepting and rejecting work both require an explanation of the wider tradeoff.

There is seldom an isolated month available for refactoring in a business team. He described negotiating half a day or a day for local improvement within a related feature, gradually reducing technical friction. The host connected that approach to ownership: not simply having authority over a repository, but identifying risk, explaining decisions and looking after maintainability over time.

### Languages, fast learning and team engineering

When asked to respond to jokes about PHP, overtrue returned to tools and context. He liked PHP's development experience and also used JavaScript. PHP and Laravel suited the work his team was doing then. That does not establish performance for every workload, nor did he claim to have current data about jobs in every language. Treating a language's reputation as a verdict on all its users was not helpful. He preferred to think of himself as a Web developer whose job was to understand and solve a problem with an appropriate tool.

He rejected a shortcut that bypasses practice. Watching tutorials, saving articles or buying a book can create a feeling of progress; writing and debugging reveals what was actually understood. His reference to writing a great deal of code was an emphasis on practice, not a measured threshold for competence. Better search terms, official manuals and reading working implementations can shorten an investigation. He was personally wary of relying only on step-by-step videos, since a tiny answer may require a long watch and copying gestures can conceal missing fundamentals, but did not ban video learning.

One way to learn a new technology is to rebuild a familiar small thing with it. While learning Node.js, he set himself the task of a simple Web framework handling routes, templates and page output. Because he understood the expected behavior, he could concentrate on how the new environment achieved it. He also described overworking himself on that experiment; the useful part to copy is the choice of task, not the sleepless schedule. Reading Laravel or Symfony source offered another method: notice how a project divides responsibilities, adapt a technique to your own setting, and compare the outcomes rather than paste code unchanged.

Asked about Tencent's engineering culture, overtrue narrowed his answer to his own CoDesign backend team. A large company contains very different departments. In his team, proposals could be discussed, but the proposer needed to explain advantages, costs and who would maintain the solution. Backend integration tests covered normal, error and boundary behavior, alongside commit conventions, formatting and pipeline checks. More complex changes drew more reviewers; a small change might be checked by a colleague. The figures and process he mentioned were not a company-wide rule. He also said his team had no open hiring headcount then, a statement about that 2022 conversation rather than today's vacancies.

### Understanding adjacent roles improves delivery

For overtrue, full-stack ability can let someone carry a small product from design and frontend through API and deployment without always waiting for another specialist. It also improves collaboration. A backend engineer who knows how a frontend uses an endpoint can design a more useful interface and diagnose a problem from the caller's perspective. Learning from another language or framework may change how one organizes work in one's primary stack. The host made a similar point from learning enough design to communicate better with designers.

The discussion included the team's approximate mix of frontend and backend developers and clarified that CoDesign was a design-handoff platform. Those details describe one team's product and staffing at the time; they do not imply a universal headcount ratio or product architecture.

Asked finally where backend developers should go next, overtrue did not prescribe a single path. His entry into backend work had been somewhat accidental. He still enjoyed writing code and improving implementations he found unsatisfactory. He had no requirement to become an architect or a particular kind of expert, and did not want to confine his identity to one side of a stack. Continuing to be a developer who writes better software was the direction he was willing to pursue then.

## Full recordings

- [Building an open-source project from scratch (Chinese)](https://www.bilibili.com/video/BV1s14y1K7HY)
- [Conversation with overtrue about developer growth (Chinese)](https://www.bilibili.com/video/BV1KP411T7kQ)
