---
title: "Nick Qi on Remote Requirements: Keeping Tasks, Code, and Communication Connected"
summary: "Nick Qi draws on cross-city, part-time leadership, and China-US time-zone work to explain requirements, user stories, task breakdown, code links, and asynchronous communication, then answers questions about tools, English, hiring, and remote-work limits."
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 30
author: editorial-team
topics: [Remote Work, Requirements Management, Team Collaboration, Frontend, Career Growth]
relatedEvents: []
relatedRecordings: [qi-wei-remote-collaboration]
cover: /images/default-cover.svg
coverAlt: General cover for a historical T Salon remote-work talk, not a photo of the guest or event
citations:
  - label: "Nick Qi: Requirements Management and Effective Communication in Remote Work"
    url: https://www.bilibili.com/video/BV1fk4y1872a?p=1
tldr:
  - "Four experiences brought four collaboration constraints: Nick did not begin remote work within a mature set of procedures."
  - "How one cross-device deep-link feature reached agreement: The detailed example involved guiding a user from the Web to a mobile app."
  - "Tools still depend on responsibility and trust: Documents, boards, and meetings work only if people use them responsibly."
faq: []
featured: false
draft: false
translationOf: qi-wei-remote-collaboration-recap
translationStatus: reviewed
seo:
  title: Nick Qi on Remote Requirements and Communication | T Salon
  description: Nick Qi discusses user stories, task and code links, asynchronous handoffs, meetings, English, tools, and remote job searches.
  noindex: false
---

Remote work removes a commute but turns questions that colleagues might resolve across a desk into processes a team has to design. Nick Qi focused on two of them: how to communicate a business requirement accurately, and how work can continue when colleagues are neither in the same place nor online at the same time.

> The recording was published on March 8, 2023; the event date has not been confirmed. Team rules, tools, vacancies, and regional policies below belong to that period.

## Four experiences brought four collaboration constraints

Nick did not begin remote work within a mature set of procedures. Early in the pandemic, the company he worked for in New Zealand closed after its leader decided to retire. During lockdown he searched for work remotely and joined a startup project as a consultant. For the first three months, everyone on the project collaborated online without meeting in person.

He had not set out to find an ideal new work style. The pandemic had created uncertainty, and the loss of his previous company was not his choice. Searching, interviewing, and joining a team during lockdown made online cooperation unavoidable. The startup showed him the first practical question: if no one can add an explanation at the next desk, will a requirement still be understood?

Later he joined a bank team. Even when some people returned to offices, engineers and product and business analysts remained in different cities. People in Auckland could not count on asking colleagues in Wellington to explain a complex financial workflow in person. Nick was new to the banking domain, yet detailed stories and explanations by experienced business analysts helped him identify the function he needed to build. Documentation mattered because domain knowledge could not be assumed; it helped a newcomer reach the point where development could begin independently.

His part-time remote work on a PingCAP community product added responsibility for interns, recruiting, and task management. Nick had another full-time job in New Zealand. On weekdays he and colleagues in China could overlap for only about two hours; much of his own work happened on weekends. While leading three interns, that overlap could not be spent only on vague progress reports. He needed to establish whether everyone understood a requirement the same way, whether a task was small enough to start, who was blocked, and what visible result came next. He was managing remote delivery rather than merely writing his own code remotely.

At Tubi, the constraint became cooperation between China and the US in the same codebase. This was different from one regional team handling its own business while another handled a separate market. The teams could take up the same requirement as work crossed time zones. “I am still working on it” is not a usable handoff: the next developer needs to know what code changed, which decision remains open, and where to resume. User stories, task state, and links to code became a shared language for that handoff.

## Explain value before splitting work into deliverable units

For Nick, requirements management begins with understandable product or business value. The team should know why a change is needed and what it is expected to improve. Managers and individual developers need a shared interpretation of the goal.

He warned engineers against receiving only a ticket that says “add a button.” Which user behavior should the button change? How will the project decide it helped? How does it relate to another team's work? An engineer who understands the intended result can suggest an alternative when the proposed implementation proves unworkable. Business goals are not written only for management.

Then comes decomposition. A larger product objective becomes user stories that carry user value and can be tested and iterated. A complex story can become smaller implementation tasks. Splitting has to preserve the business purpose while making work reviewable. Too large a story puts several people in the same code with no clear point of completion; too many tiny technical tickets make it hard to see what user outcome they add up to. A useful unit can be tested, receive feedback, and support another iteration.

Product, a business analyst, or a technical lead may do part of this work; team structures differ. Some teams plan and estimate together; others mainly use a Kanban board while a technical lead helps product colleagues with engineering details. At a bank, business analysts might carry more of the clarification. In a startup, a technical lead might do it. Nick did not prescribe job titles. The people proposing, implementing, and testing a requirement all need agreement on its boundaries and acceptance conditions. An estimate cannot replace that discussion.

## PRDs, interaction diagrams, and designs answer different questions

A product requirements document (PRD) explains goals, features, priority, and the case for investment, helping the team decide whether and when to proceed. A wireframe turns words into a user flow before detailed visuals. Design files then specify the interface and interactions.

Nick moved from broad to precise. A PRD says why a project exists; a wireframe allows debate about the user's steps; visual design settles particular screen states and details. A frontend engineer who receives only the final high-fidelity image may not know which user situation it addresses or whom to ask when a state is missing.

These documents do not finish their work after one handoff. Requirements are discussed and revised. Tools should support comments, versions, notifications, links, and search. Nick showed documentation, whiteboard, and design products, but the brand mattered less than a shared information carrier with a record of decisions. Frontend developers often participate deeply during design and need to see the requirement behind a screen.

In a remote team, everyone also needs to know which version is under discussion. A decision trapped in an instant-message thread can leave a colleague coding against an old design days later. Connecting a comment, design change, and task lets a person arriving later recover the context. Shared, searchable, traceable information must not depend on one colleague remembering what was said in a meeting.

## Boards show state; links to code preserve reasons

A board can show whether work is in development, code review, testing, or awaiting release, and filter by team and owner. When several people work on one story, its breakdown and state help others see what they can take without duplicating work or causing a merge conflict.

As a colleague in China signs off and one in the US starts, the board should say more than “the project is in progress.” Which part of which story was submitted? Which PR needs review? Which item waits for an answer from another team? Keeping owner, priority, and planned release together saves the incoming developer from searching through chats. Ticket count cannot stand in for delivery quality or user value.

Estimation can help a mature team understand capacity and coordinate for a time-sensitive project. It is not a guaranteed measure of an individual's speed. The especially important handoff is what has been completed, what remains blocked, and by whom.

Code changes should link back to the requirement. Reviewing a PR should let someone open the story and see its boundaries; finding a special case in the code months later should let a maintainer return to the original discussion. A commit labeled only “fix issue” loses the failing condition and design reason. Time and staff turnover weaken memory, and a cross-time-zone team feels the loss sooner because the original author may be asleep.

Nick illustrated decomposition with a migration from Enzyme tests to React Testing Library. The team considered using abstract syntax tree analysis to convert repetitive patterns automatically, while leaving cases requiring human judgment to review. They did not replace all tests in one enormous change. Smaller, independent PRs let several people collaborate, kept each review understandable, and made a bad transformation rule easier to locate. Task breakdown here controlled review difficulty and merge conflicts as well as the schedule.

## How one cross-device deep-link feature reached agreement

The detailed example involved guiding a user from the Web to a mobile app. Frontend and iOS engineers needed to agree on a link format and behavior. Nick's document started with why the business wanted Web users to enter the app and what change it hoped to measure, rather than beginning with a URL.

It then distinguished user states: the app may already be installed, not installed, or the person may not yet have an account. What should each person see and where should each path lead? Agreeing on the user experience before the link protocol prevents two individually correct implementations from joining into an incoherent flow.

A product document can describe the outcome without settling every code-level detail. Engineers must add the technical contract and ask the other platform's engineers to review it before both sides implement. For a deep link, that includes parameters, failure fallback, and compatibility with existing app versions. Product requirements say what the user should experience; engineering agreements say how systems exchange information. Neither replaces the other.

Compatibility, event collection, and test considerations were recorded as supplements; ownership, priority, dependencies, and the target release were linked to the task. The aim was not maximal document length but a direct explanation without missing a boundary that could change implementation.

The example also showed engineer initiative. Nick said that in his team engineers could propose a valuable improvement, state a hypothesis, and check the result after release rather than only waiting for a product manager's next ticket. If an existing conversion path contained an unnecessary step, an engineer could bring the user problem, proposed change, and observable measure to product and other teams. Whether to do it remained a joint decision; initiative meant making a reasoned proposal and verifying its effect, not silently expanding scope.

## Prefer asynchronous work while preserving context and focus

Remote communication can be slowed by time differences, buried messages, inconsistent interpretations, and poor visibility into another person's progress. Nick preferred first using tasks, documents, and written discussion to explain a problem and leave a history without interrupting everyone immediately. When writing could not settle it, or urgency demanded a faster decision, he moved to a direct conversation or meeting.

“Asynchronous first” did not mean “never meet.” A clear question and current reasoning allow someone in another time zone to respond when available. If discussion still does not converge, a short shared call may be faster than dozens of guesses in text. The choice depends on complexity and urgency. Async preserves the path to a decision; synchronous time resolves a disagreement that truly needs joint judgment.

This approach needs onboarding. A newcomer should know how to set up the development environment, where work arrives, and whom to ask first. A mentor can be that first contact. Each specialist team should maintain documentation for the knowledge it owns rather than leaving one general document to become an outdated collection no one updates. Content has to reflect actual infrastructure and everyday work if it is to prevent repeated questions.

Routine status can be written as what was completed, what comes next, and which blocker remains, with links for detail. Notify only people who need to act. An engineer need not refresh every channel continuously. Grouping meetings can preserve uninterrupted development time. Written updates let leads and other regions see status during their own day, while the developer can finish a meaningful block of work before handling messages. Otherwise remote work merely replaces office interruptions with notifications.

## Meetings need a purpose and a result

Nick said his team often kept meetings short. The organizer listed topics and desired outcomes ahead of time and invited the people needed. A meeting to disseminate information differs from one where participants must choose among options. Back-to-back scheduling was one team's way of limiting overruns, not a rule every organization should copy.

If the goal is simply to tell people a decision, writing it down may be enough. If a technical choice requires several participants, send material in advance and bring the decision-makers together. A meeting with no known question before it and no conclusion after it wastes scarce common time across time zones.

He showed a discussion around a theme system. A lead first wrote the problem and researched possible approaches; colleagues added details in the document. When experience mattered, the team built a runnable demo in a test environment. People could then discover browser compatibility or failure-fallback questions that had not appeared in text. Engineers summarized candidate approaches for designers so non-engineers did not have to reconstruct a conclusion from a long chain of technical comments. The final decision linked to implementation PRs.

The proposal was not settled by one big meeting. Written discussion, revised options, a working demo, design feedback, and code formed a sequence. Only a disagreement that text could not resolve required a call. One-to-one conversations also benefited from an outline beforehand and clear decisions and follow-up actions afterward, whether the subject was a requirement, priority, or personal development.

## When another time zone blocks work, make it visible

If an answer from another region is necessary, Nick did not recommend waiting silently. Write the full question, reserve overlapping time if needed, and tell the lead what is blocked, what risk it creates, and whether resources or the release plan may change. Within agreed priorities, move to another executable task while waiting.

An audience member challenged him: is asynchronous communication simply too slow? Nick answered at two levels. Before development, align the user story, cross-team interface, and acceptance conditions to remove predictable waits. During development, if an unforeseen disagreement remains, document it, schedule a call, and mark the board item as blocked. If a high-priority item cannot move, advance another approved piece without hiding the risk from product and technical leads. The point is not unlimited parallel work; it is to avoid losing all visible progress or discovering the blockage only on the deadline.

## Tools still depend on responsibility and trust

Documents, boards, and meetings work only if people use them responsibly. Nick described a culture that gave adults substantial control over time while expecting them to own tasks and concentrate on delivery. That is different from monitoring every minute, but it is not a reduction of responsibility.

At the end he described frontend and multimedia openings, products used across devices, and remote or hybrid arrangements in different cities at the time. In questions he clarified that fully remote roles required sound time management and collaboration and that “senior” did not simply mean a number of years. Those vacancies, locations, benefits, and business-size details were historical recruiting context, not a list of current openings.

## Audience questions: tools, English, and finding work

**Must user stories live in Jira?** Nick's team used Shortcut. A comparable board can support task breakdown and workflow visibility. Choose a tool for how the team advances work; the brand is not the process.

**What did English proficiency mean?** At his team then, people needed to understand and express technical issues. The English interview was joined to code discussion so actual communication could be observed. The talk also mentioned language classes after joining. A fully overseas team may demand a broader range of English; one company's interview and training arrangement is not a universal standard.

**Where might someone find overseas roles?** Nick's direct experience was mainly in New Zealand. He mentioned LinkedIn, local job sites, target companies' own careers pages, and recruiters. An English resume should be direct, specific, and measurable and state the kind of work sought. A recruiter may help an employer screen candidates and help an applicant understand a role, but fit still requires a real conversation. Product settings and platform versions mentioned on air belong to that time.

**What were the trend and limits of remote roles?** Nick observed more remote and hybrid arrangements then, but warned that “remote” alone does not say whether cross-border work is allowed, which permit is needed, how a contract is formed, or how income is handled. He returned to reading the contract, clarifying each party's responsibilities, checking applicable rules, and improving language communication. Requirements vary by region and individual arrangement; oral examples from the recording need current, situation-specific verification.

## Full recording

- [Nick Qi: Requirements Management and Effective Communication in Remote Work](https://www.bilibili.com/video/BV1fk4y1872a?p=1)
