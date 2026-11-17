---
title: "Lao Lv on Engineering Quality and Teamwork: Connecting Design, Review, and Release"
summary: A recap of both parts of the first T Chat episode in 2022, covering design documents, design and code review, release checks, and Lao Lv's views on engineering culture, learning, career choices, and communication.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 16
author: editorial-team
topics:
  - Engineering Quality
  - Engineering
  - Career Growth
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-1
cover: /images/talks/tchat-1.jpeg
coverAlt: Lao Lv discussing engineering quality and teamwork in the first T Chat episode
citations:
  - label: Lao Lv's technical talk on improving team code quality, part 1
    url: https://www.bilibili.com/video/BV18Z4y1y7S6?p=1
  - label: Lao Lv's conversation on growth and work, part 2
    url: https://www.bilibili.com/video/BV18Z4y1y7S6?p=2
tldr:
  - "Clarify the goal and the alternatives before implementation: Lao Lv first explained why he cares about process."
  - "An open culture shows in how a team handles opinions: The second part began with the host asking how to build an engineering culture."
  - "Age, experience, and moving into management: On age anxiety, Lao Lv said experienced developers were common in the teams he had seen, and some systems or lower-level fields particularly valued accumulated experience."
faq: []
featured: false
draft: false
translationOf: tchat-laolv-engineering-quality-recap
translationStatus: reviewed
seo:
  title: Lao Lv on Engineering Quality and Teamwork | T Chat Episode 1
  description: A recap of Lao Lv's technical talk and interview, covering design documents, review, release checks, open feedback, career choices, and communication.
  noindex: false
---

> These videos were published in 2022. The technical conditions, personal experiences, and opinions below belong to that period. Lao Lv speaks from his own experience, not on behalf of Google or its policies.

Code quality is shaped before anyone types the code. Why a feature is needed, which alternatives were considered, who checks the design and implementation, and whom the release affects can all change the result.

In the first T Chat episode of 2022, Lao Lv organized these questions into four consecutive steps: design, design review, code review, and release review. He then spoke with the host about an open engineering culture, his move from iOS into other technical areas, career choices, and communication. The recording has two parts, roughly 20 and 21 minutes long.

## Technical talk: quality grows from decisions people can discuss

### Clarify the goal and the alternatives before implementation

Lao Lv first explained why he cares about process. A rapidly growing team can focus on shipping a feature quickly without establishing design and checking practices. If a bad assumption surfaces only during implementation, changing course can be expensive.

For him, design answers four questions: what are we making, how will it work, why are we making it, and what else could we do? Sometimes “why” belongs first. The developer needs to confirm with product colleagues or a manager which goal the technical work serves.

He then broke an abstract request into observable behavior. A business stakeholder might request a feature, but an engineer still needs to know what happens when a button is pressed, where the data comes from, and who sees the result. Only after that is written down can the team compare possible implementations. In the interview, the host said writing a good document could be harder than writing code precisely because these design decisions must be made in the document.

Alternatives matter as well. It is easy to stay with a familiar solution and confuse “I can build this” with “this is the best fit.” Listing plausible options and comparing their costs makes the trade-off visible before the first idea hardens into code.

### Put the design in writing so other people can take part

Business requests often arrive in broad terms and must be translated into behavior that can be implemented and checked. Lao Lv treats writing as part of that translation. A plan kept in one person's head cannot be reviewed; words and diagrams give the team something shared to examine.

He described his document order. Begin with a short background section because readers may not know the project. Put the overall architecture or flow diagram near the top so they can quickly understand how it works. Then describe the implementation in detail.

That detail should show how data moves, what a new capability does to latency or power use, and how it will be released. A backend service might need a deployment plan; a mobile app might need an app-store rollout. If several people will develop it, explain the environment. If it changes on-call or incident-response expectations, say who is affected. Every project does not need a document of equal length, but reviewers do need to see the delivery path.

### Share early, while feedback is still easy to use

Lao Lv recommends a common template for a team. Its purpose is a predictable reading order, not visual polish. Timing matters more: once the main structure is clear, invite others in rather than waiting until every sentence feels finished.

Reviewers should include more than fellow programmers. Product and design colleagues, teams on which the work depends, and teams that depend on the change can all notice missing assumptions. Hearing from them early leaves room to adjust before substantial implementation work has been spent.

He especially values an online document because sharing, comments, replies, and revisions can happen in one place. He was recommending a way to discuss a living design, not a particular vendor. The tool still needs people to explain concerns, respond, and make decisions.

For example, an author can send a draft link to product, design, and dependent teams as soon as its structure is ready. A reviewer comments beside the relevant passage; the author answers there and changes the same document. That cuts the back-and-forth caused by separate file copies and scattered chat messages. Asked later about productivity tools, Lao Lv returned to online documents rather than editor plugins, and put code-review tools and release emails in the same collaboration chain.

### Give design review participants and an outcome

Once there is an initial design, other people can inspect the reasoning. Lao Lv wants disagreement stated plainly, including by people outside the immediate group. Dependencies often cross team boundaries; leaving one group out can let a problem survive until much later.

A separate slide deck is not always necessary. If the design document has a clear flow diagram and explanation, it can be the meeting material. A larger team might reserve a regular review slot and let presenters register their topics ahead of time, giving discussion a stable entry point.

A recurring meeting still needs an outcome. If product colleagues are seeking agreement on requirements, the result may be an approved requirements document. At an earlier stage, it might be agreement on a concept. A detailed design review should produce a version that can guide implementation. A discussion of goals should record milestones and deliverables. The point is to know what the meeting resolved, rather than leave everyone with a different interpretation.

The host later asked whether documents slow development. Lao Lv's answer qualified that concern: changing a structure in a document is easier than repeatedly rebuilding the implementation. He used his own sense of time spent on design and coding to make the case; he did not propose a fixed ratio for every project or team.

### Code review checks logic and spreads understanding

Code review gives another person a chance to find problems early. Lao Lv recalled getting stuck on the order of a calculation in his own code. A colleague spotted it during review, but he still needed more than ten minutes of direct discussion to see past his original assumption. The review exposed the issue; conversation helped him change his thinking.

Review also helps colleagues understand one another's work. Seeing the structure, constraints, and choices in the code reduces the chance that only one person understands a critical implementation. Style rules, too, need an actual check if a team expects them to stick.

He separated readability from logic. Readability includes conventions shared by people using the same language and need not be judged only inside the current business team. Logic review needs knowledge of the work's purpose; someone who joined the design discussion is better placed to ask whether the implementation meets it.

A colleague familiar with Swift conventions, for example, can question naming and expression without knowing why this change alters a particular business path. Someone who attended design review can check that path against the agreed goal. Different reviewers bring complementary knowledge; a single quick glance cannot cover every kind of correctness. Consistent style by itself does not prove the code behaves correctly.

### Make release data, plans, and effects traceable

The last step is a check before release. Lao Lv wants to know whether earlier experiments met expectations, whether there is a complete rollout plan, and whether dependent teams know what is changing. “The feature runs” and “it is ready to ship this way” are separate judgements.

The plan should say when the release will happen, how broadly it will begin, and which teams it may affect. An unexpected experiment result should not be waved away merely because the code is finished.

He prefers a document or email record with links that let participants inspect data, plans, and results. A purely verbal meeting can lose details and is harder to revisit. That does not rule out real-time conversation when needed; it means the evidence and decision should remain available afterward.

### When feedback stings, separate the goal from the emotion

All four steps depend on communication, so the talk ended with how people handle disagreement. Lao Lv used a code review in which a reviewer leaves many comments the author does not understand. The author may focus on feeling blocked and begin to think the reviewer is simply trying to stop the change.

His advice was to separate the work objective from that reaction. If the goal is to submit code under suitable conditions, ask why each comment was made, what problem it addresses, and what revision would resolve it. This does not require accepting every comment. It keeps the discussion about the work rather than about winning an argument.

He framed the two motives plainly: the primary goal is to get suitable code submitted; the secondary impulse is to vent frustration. Asking whether a comment concerns logic or expression, then discussing a fix, serves the first goal. Arguing over whether the reviewer is “out to get me” can derail it. Lao Lv said material he had read on communication helped him make this distinction. A review process works better when the people in it can discuss disagreement.

## Career conversation: openness, practice, and understanding a workplace

### An open culture shows in how a team handles opinions

The second part began with the host asking how to build an engineering culture. Lao Lv's answer was openness: explain technical issues plainly, share work, and let others disagree.

Useful feedback should be considered and acted on where it points to a real improvement. Sharing here includes everyday suggestions and discussions, not only formal talks. If people are willing to expose questions in public, the reviews from the first part can become useful rather than ceremonial.

### Broaden skills through real work and hands-on learning

Asked about his own skills, Lao Lv recalled starting in iOS and moving into backend work, using Objective-C, Swift, Java, and C++ along the way. At the time he was also interested in 3D rendering.

He encouraged developers to give an unfamiliar language or field a practical try before rejecting it. Working on a concrete task, reading existing code, and studying how others solved similar problems can build the knowledge needed to continue. He was not promising quick mastery of any subject; he was resisting the assumption that unfamiliar means inaccessible.

### Productivity is more than typing faster

When the host asked for a tool recommendation, Lao Lv again chose online documents. Design and design review need shared material; code review needs a place to see changes and comments; release review needs a written record that others can inspect.

The host added that writing the document is itself a way to organize the design. Lao Lv said repeated major rework during implementation should prompt the team to ask whether it understood the problem beforehand. He used his own division of time between design and coding to emphasize the point, not to prescribe one ratio for every project.

Productivity here means avoiding misunderstandings and repeated rebuilding, as well as saving time at the keyboard.

### Interviews and work styles depend on the position

Speaking from his experience at the time, Lao Lv said algorithms and system design mattered in some interviews and questioned the value of obscure details disconnected from the job. This was a personal observation, not a universal interview standard for overseas employers or a reason to neglect the specialist knowledge a role needs.

The host had asked whether the team had openings and what a candidate should prepare. Lao Lv did not establish that any position remains open today. He spoke about the interviews he knew: fundamental questions can be useful, while pursuing low-level trivia unrelated to the work may be less useful. The host took the answer as a reminder to strengthen professional foundations. Neither speaker was presenting a company's official question bank.

Before comparing work in China and abroad, Lao Lv explicitly said he had not worked in China and could not make a comprehensive comparison. He described the environment he knew: process and design discussion take time early, and that affects the overall pace of iteration. The host added observations from his own management experience.

After hearing the workflow, the host said he envied its pace, then talked about competition and delivery pressure in domestic teams. Lao Lv did not turn that into a claim about every Chinese company. He returned to what he knew: design takes time in his environment, and a released feature might need fewer immediate rounds of change. Their observations came from different places, not from a controlled comparison between two countries.

Both returned to the importance of a team lead. How that person understands requirements, schedules work, communicates upward, and manages expectations shapes the team's daily experience. During an interview, a candidate can also ask how the prospective lead thinks, rather than assume evaluation runs only one way.

The host explained the protective side of upward communication: a lead who can explain limited capacity and priorities to management may shield the team from conflicting demands. An audience question later returned to too much work and too few people, prompting a more concrete discussion of scheduling and trade-offs.

### Choosing a work location also means choosing a life

Asked about working abroad, Lao Lv first brought the question back to the person and family: what would the move mean for a partner, children, and everyday life? He then discussed routes he knew at the time, including studying abroad, transferring inside a multinational company, and applying directly for positions elsewhere. The host followed up about help with paperwork, moving, and language study; Lao Lv said support varies by company.

These were routes discussed in 2022, not instructions that remain valid everywhere. A prospective applicant must check the current position's qualifications, immigration rules, and practical support, as well as the effect on home life. The talk's durable point is to examine work and life together before making the move.

### Initiative and everyday life

Asked what he values in a team member, Lao Lv chose initiative. He wants someone who can notice a problem, bring an idea to discuss, and learn what the task requires, rather than move only when every step has been assigned. The host agreed that cooperation is easier when a lead need not keep pushing each next action.

The conversation also touched on life in the Bay Area. Lao Lv said he often met people from internet companies, and a road shown in a large company's presentation could be one he passed in daily life. He mentioned company cafeterias as another ordinary detail. These are snapshots of his experience, not a judgement on everyone's life in the region or a current benefits list.

### When people are scarce, a lead must make trade-offs

An audience member asked how to improve productivity when business requests pile up. Lao Lv did not answer by asking everyone to do more. With limited staff, the team cannot do everything at once. A lead must decide which work matters most and explain to stakeholders why other requests must wait.

That answer connects to the technical talk's emphasis on purpose, design, and release plans. Individual effort has direction only when the team knows why one task comes first and how it will be delivered. Passing pressure downward does not substitute for prioritization.

### Age, experience, and moving into management

On age anxiety, Lao Lv said experienced developers were common in the teams he had seen, and some systems or lower-level fields particularly valued accumulated experience. He brought the question back to the skills a particular job needs, rather than promise that a given age is always safe or always a barrier.

The host then asked about management across languages. Lao Lv said management relies heavily on written and spoken communication; working in a language that is not one's native language adds difficulty and calls for sustained practice in understanding, explaining, and coordinating. The conversation thus returned to its opening theme: technical skill matters, but explaining work and making decisions with other people shapes the responsibilities one can take on.
