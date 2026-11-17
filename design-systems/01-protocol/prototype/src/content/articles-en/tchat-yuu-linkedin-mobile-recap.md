---
title: Yuu on Mobile Engineering at LinkedIn, Remote Collaboration and Career Choices
summary: A detailed account of T Chat episode 7, covering Yuu's move to Beijing, remote and cross-time-zone work, design reviews, testing, mobile technology, growth engineering, career decisions, learning and creative work.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 24
author: editorial-team
topics:
  - Mobile
  - Career Development
  - Engineering
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-7
cover: /images/talks/tchat-7.jpeg
coverAlt: The T Chat episode 7 poster for Yuu's conversation about mobile engineering at LinkedIn
citations:
  - label: Yuu on mobile engineering at LinkedIn, full recording in Chinese
    url: https://www.bilibili.com/video/BV11r4y177E5
tldr:
  - "A career move changes how a city feels: Yuu grew up in southern China."
  - "The testing debate was about release goals and risk: The host challenged the cost of maintaining UI tests in a fast-changing business: a campaign page might be built this week and replaced the next."
  - "Video creation needs iteration, and a reason to continue: Yuu had also made videos and streamed."
faq: []
featured: false
draft: false
translationOf: tchat-yuu-linkedin-mobile-recap
translationStatus: reviewed
seo:
  title: Yuu on Mobile Engineering and Career Choices at LinkedIn | T Chat
  description: A detailed recap of a two-hour conversation about remote work, engineering reviews and testing, mobile technology, growth, careers, learning and creative work.
  noindex: false
---

> This conversation was recorded in 2022. Jobs, tools, benefits and personal views below describe that period.

T Chat episode 7 was a conversation of about 130 minutes, rather than a technical lecture followed by an interview. Yuu started with his life in Beijing and his move to LinkedIn. He and the host then moved through remote collaboration, engineering quality, mobile development, hiring, learning, games and video making. Work and life were never entirely separate subjects in the discussion.

## Moving to Beijing and reclaiming time

### A career move changes how a city feels

Yuu grew up in southern China. When he first came to Beijing, he worked at Baidu and lived close to the office. He hardly visited the central parts of the city, so working in Beijing and actually experiencing Beijing felt like different things. He changed jobs in 2019, joined LinkedIn and moved; only then did the neighborhoods, everyday services and pace of the city become part of his daily life.

The host asked what impression he had of Beijing before arriving. Yuu said he had almost none. They compared their reactions to the northern climate: Yuu found that things dried quickly and his home did not stay damp, while the host remembered nosebleeds when he first moved north. Yuu appreciated how some delivery and after-sales problems were handled in a large city, and joked that Beijing takeaway food had disappointed him. The exchange is not a ranking of cities. It shows how a change of employer can also change a person's commute, home and opportunities to live beyond work.

### Why he looked for a foreign company

Before LinkedIn, Yuu considered working in Japan. He studied Japanese and prepared for an English test used by some Japanese employers. Yet he often finished work so late that sustained study became difficult. At one point he took a book to a meeting room after dinner to make time to read. Eventually he decided that squeezing a little study into an exhausting schedule was not a durable solution. He began looking for an environment that would leave room for learning and life, and found LinkedIn's job opening in the LinkedIn app.

He did not present the search as an uninterrupted series of successes. He recalled a written test for a Japanese company whose volume and time limit he could not finish. Later, when people asked for job advice, he returned to this point: an offer or rejection reflects preparation, a particular role and the opportunity available at that moment. It is not a complete verdict on a person's ability. The host added that people seek international employers for different reasons, including family, location and future mobility; the label alone cannot say whether a role fits.

### Remote work changed more than the commute

During the pandemic, Yuu's team used remote and hybrid arrangements that changed with circumstances. The most immediate gain was time previously spent commuting. That time could go into a task, but it could also go into study, rest or household needs. He described support then available for setting up a home workspace, such as a suitable chair, desk and monitor, as well as other benefits and time-off arrangements. The amounts and policies were particular to the period, not current employment promises.

He also valued days with fewer meetings. An uninterrupted block can make a difference when writing code or working through a design problem; a day broken into many short calls may leave little time for either. In his telling, the question was whether the organization made sustained work and recovery possible, rather than whether someone had permission to stay at home.

### Culture includes how a team treats discarded work

Yuu argued that managers need to notice what a project does to the people working on it. A team may rush to build an idea, put in long hours, and then see it cancelled before launch or soon after release. Business experiments sometimes fail, but the engineers' investment does not disappear simply because the project stops. How a decision is explained, whether exhaustion is recognized, and whether people can rest or learn afterward all form part of engineering culture.

This also connects to why he had sought a different work environment in the first place. The aim was not a simple claim that one kind of employer is better. He wanted enough time and trust to do useful work and still have a life outside it.

## Cross-time-zone work is a communication problem too

### Calendars convert time zones; people still need overlapping hours

Yuu sometimes met a mentor in the United States at seven or eight in the morning in Beijing, while it was still the other person's afternoon. Talks for colleagues in both places also tended to land in the Beijing morning, with daylight-saving changes altering the calculation. The host recalled missing a call with a Japanese company after misreading the JST time in the invitation. A small time difference is still enough to cause a mistake.

They recommended using calendar invitations that show the time zone explicitly. But a calendar can prevent a conversion error; it cannot create extra hours that are convenient for both teams. A regular one-to-one, a technical presentation and an urgent incident may each need different compromises. Those costs belong in a project plan, not just in an individual engineer's diary.

### A status update is easier than debugging together

Yuu distinguished between reporting completed work and jointly diagnosing a problem in real time. The second requires more immediate language comprehension and back-and-forth reasoning. Accent, telephone quality and unfamiliar technical context can all make it harder. When communication was genuinely failing, he would involve a colleague or manager who understood both sides, or move a conversation into writing.

Soon after joining, he took an unexpected call from overseas IT support. The connection was poor, he did not know what the caller wanted to discuss, and after listening for some time he still could not establish the request. They eventually switched to email. His point was not that imperfect English makes international work impossible. A new employee can be nervous, and changing the channel to get an accurate answer is better than pretending to understand. Experience with later calls made the situation less intimidating.

### Mobile engineers may face global operational problems

Yuu worked on growth flows including registration, login, verification and abuse prevention. A client entry point can depend on systems and teams in several regions. A mobile engineer may therefore need to join on-call work or cross-time-zone debugging. The job does not stop at drawing local screens. Communication becomes part of engineering capability, learned by dealing with real issues rather than avoiding every difficult conversation.

## Discuss the design, then keep validating it

### RFCs make a proposed approach discussable

Yuu described how his team's process developed over several years. Before starting a project, an engineer would write an RFC explaining the problem, possible technical approaches, advantages and drawbacks. Colleagues could challenge an assumption or ask about a missing dependency. The author would respond, revise and resolve the main questions before settling on an implementation and discussing schedule and resources with the product lead.

The RFC was not paperwork to file away after a meeting. It made uncertainties visible before much code was written. The team then reviewed the implementation, and CI checks and tests became part of submission. Yuu noted that these practices had not all existed when he joined; engineers could identify a gap and help improve the process rather than assuming the current workflow was permanent.

### Review quality matters more than approval counts

Simply approving many changes without discussion does not necessarily help a team. Yuu distinguished participation in review from useful review: a reviewer who identifies a missing edge case or a questionable design choice and talks it through with the author contributes more than a long list of effortless approvals. Authors, in turn, need to explain their choices and sometimes revise the design, rather than treating comments as numbers to clear.

The conversations were retained in collaboration tools so later maintainers could understand why a decision was made. Tests covered different levels, including units, layout and scenarios. The coverage figures mentioned in the recording were the team's measures at the time, not a universal standard that can be copied into another project.

### Concurrent migrations impose a real maintenance cost

New architecture in a mature app is often tried in a limited area and expanded through feature flags. Yuu described a more difficult moment when several large migrations overlapped. One module might still use an older architecture, another a new state-management approach, and another a different networking foundation. Moving between modules could mean moving between entirely different code structures.

This gave engineers experience with new approaches, but also made development, debugging and long-term maintenance harder. Yuu did not present every migration as an unqualified improvement. The potential value of a new foundation needs to be considered alongside the complexity of operating old and new systems at the same time.

### Finding the right problem can be harder than implementing it

Asked about the hardest part of his job, Yuu did not start with an algorithm. Once a worthwhile task has been identified, an engineer can usually break it down, estimate the work and find collaborators. The harder step, particularly at higher levels of responsibility, is identifying which of many possible problems deserves the investment and explaining why others should help solve it.

He connected that skill to Staff-level impact. Writing several more features does not automatically create a project of broader value. Cross-team work adds another difficulty: if a colleague in another region does not respond, asking both managers to escalate may unblock a case, but making every dependency an escalation harms future collaboration. Understanding the other person's constraints, choosing a useful channel and building a working relationship are part of delivering the technical outcome.

## Mobile delivery extends beyond screen code

### Testability can expose design problems

Yuu's day-to-day iOS work then centered on Swift, UIKit and internal frameworks. He still wrote interface code, but answered a question about whether mobile engineers were merely "writing buttons" by pointing to the rest of delivery: tests, documents, migration, coordination, production data and later maintenance. A button on a screen is a small fraction of a feature in a mature product.

Writing automated tests sometimes forced him to improve the implementation. If a feature mixed a network request, state updates and interface logic so tightly that a test could neither provide controlled input nor observe a result, the responsibilities had to be separated. That restructuring could take more effort than adding an assertion, but it made the next change easier too. He also admitted that documentation, communication and project management remained areas for his own growth. If a promotion bottleneck lies there, learning another language will not fix it by itself.

### The testing debate was about release goals and risk

The host challenged the cost of maintaining UI tests in a fast-changing business: a campaign page might be built this week and replaced the next. Writing a complete automation suite for every short-lived screen could be expensive. Yuu accepted that requirements change, but questioned whether that explains a total lack of tests. Stable components, shared foundations and critical flows can still be verified. Without time, tools and incentives, a team's claim that nobody knows how to test may perpetuate itself.

Yuu wanted the main branch to be releasable more often, with less dependence on a fixed cycle of manual QA. That required explicit risk choices. A failure preventing users from registering belongs in a different category from a minor alignment problem that can be fixed quickly after release. The goal was not a claim that software could have no bugs. It was to protect essential behavior without making every release wait in one long manual queue. The discussion did not imply that every product should remove human testing; risk and product requirements differ.

### Evaluate a new technology inside the existing system

Yuu discussed GraphQL, Swift migrations, internal components and work on a newly developed mobile app. GraphQL lets a client describe the fields it wants, but introducing it into a mature product also means dealing with existing services, caching, error handling and what the team knows how to maintain. A pleasing request syntax does not erase that migration work. SwiftUI was in use in some smaller areas, while UIKit and internal approaches remained central to everyday development.

He had tried Flutter Web for a personal project, and the team had used cross-platform technology in limited parts of the product. Neither experience led him to say that React Native, Flutter or native development should replace the others everywhere. A Flutter Web project could help a mobile developer get an idea running quickly, while a production mobile app still presented platform-specific constraints. Understanding native execution remained valuable when diagnosing crashes, threads or platform interactions beneath a cross-platform layer.

### Growth connects marketing, registration and abuse prevention

Yuu described user growth as acquisition and retention, then showed how quickly that becomes engineering work. During a campus promotion, many legitimate students might register from a shared network outlet in a short time. An anti-abuse system sees repeated registrations from one IP address and blocks them. The marketing campaign is already under way, users cannot sign up, and the team controlling the rules may be in another time zone.

Resolving the incident requires the client team, campaign team and anti-abuse owners to explain the circumstances and assess the risk together. A new promotional entry point is therefore not enough. Verification, registration, fraud rules, international communication and the product's lasting value all affect the outcome. Yuu was interested in Private Access Tokens discussed at WWDC that year as a possible way to reduce unnecessary challenges for legitimate users; he did not say his team had already deployed them.

### Mocking dependencies and maintaining a personal project

Questions about slow builds, debugging and network mocks brought the conversation back to engineering basics. Yuu suggested understanding the business flow and the actual scope of a change, then using tests to verify behavior. When a whole system cannot run locally, separating an external dependency and giving it controlled input becomes especially useful. He did not claim to know every detail of the team's internal mocking solution, so his remarks were not a complete implementation guide.

For a solo project, his advice was to finish, deploy and keep using something rather than stop at a demo. Continued use exposes faults and missing assumptions that a one-time presentation will not. Doing the requirements, coding, deployment and maintenance yourself shows which capability you actually lack. Within a company, a cross-team task may exceed one person's authority; explaining the dependency to a manager and asking for help is more honest than pretending to control every system. He also mentioned using Swift on the server, while cautioning that a familiar language can create path dependence: framework support, intrusiveness and maintenance still need examination.

## Hiring, growth and career choices

### Interview preparation is only part of engineering ability

The recording contains many hiring questions. Yuu discussed the mobile hiring market at the time and said algorithm practice was worth taking seriously, even if a particular kind of puzzle rarely appeared in daily work. His suggested study method was to learn from established solutions: when a problem is unfamiliar, read an explanation, understand the idea, implement it and then try again independently. That is a method for learning, not a suggestion to copy answers in an interview. The role and interviewer's preferences still matter, and the 2022 discussion is not a statement of current hiring policy.

### A job title does not determine long-term value

Asked whether someone could keep working in iOS, or should become a generalist, Yuu mentioned colleagues who continued building mobile foundations and others who could independently deliver across several platforms. The durable question was whether a person could solve valuable problems and develop capabilities others could rely on. Company business and culture shape opportunities, while personal interest and strengths shape what a person can sustain. Moving into a field only because its salaries appear higher may not serve someone who dislikes the daily work.

The discussion of age, layoffs and the market had the same balance. Deeper project responsibility can increase future options, but macroeconomic conditions still affect individuals. Hard work cannot guarantee immunity from every external shock. A job decision must also account for a person's financial and family circumstances and how long they can afford to search; no category of employer promises complete stability.

### Web3: separate technical claims, jobs and investment

The host and Yuu disagreed in a useful way about NFTs, Web3 and blockchains. Yuu was skeptical of claims that a large application could be fully decentralized. He pointed to ordinary dependencies such as network access, domains and distribution, and questioned whether a service could really escape every manageable point of control. The host did not demand that he abandon the critique, but argued that present implementation flaws cannot settle every possible direction decades ahead. Equally, a possible future does not mean a current project has delivered its promises.

They then separated three decisions that are often conflated. An engineer can evaluate whether a technology works as described; consider a job in a team hiring contract, backend or frontend developers; and decide whether to invest personal money in an asset. Those are different risk and evidence questions. Both speakers referred to investment losses. Yuu acknowledged that his own purchases had sometimes sat uneasily beside his technical skepticism. The value of the exchange is in keeping the distinctions visible, not in retrospectively declaring a winner. Market prices and salaries from 2022 are not useful as present-day promises.

### Individual contributor or manager is not a permanent answer

Yuu described the familiar choice between an individual-contributor path and a management path. At the time, he leaned toward technical work and found constant coordination tiring, but he did not want to choose a permanent identity too early. Hosting live conversations had already changed how comfortable he was speaking publicly. For now, he preferred work he cared about and problems he could continue to solve; when a real opportunity to lead people or make broader technical decisions arrived, he could consider its responsibilities then.

He traced a route from the Chinese Academy of Sciences to Baidu and later LinkedIn. A hoped-for role in Hangzhou did not materialize; Baidu brought him to Beijing. Seeking more personal time then led to LinkedIn. He also mentioned an unsuccessful interview with Microsoft in Suzhou. Those decisions changed his city, daily rhythm and later opportunities, but he resisted turning them into a story of perfect foresight. In 2019 he could not have predicted the pandemic, subsequent market changes or stock prices. When viewers returned to promotion to Staff, he returned to identifying and driving work of wider value, rather than simply adding one more framework to a resume.

## Learning and life outside work

### Identify prerequisites, then test learning in a project

Yuu used his study of deep learning as an example. Before following an advanced course, check the mathematics and concepts it assumes. If linear algebra is missing, running a model by copying steps is not the same as understanding it. Next, find out whether the problem you care about concerns images, text or something else; each area has its own background. Choose resources that explain ideas systematically and let you test them, instead of collecting courses because their titles are attractive. Finally, make a small project. Only then can you see what you can really do with the tool.

He had used Stanford's CS193p to build an iOS foundation and mentioned Mu Li's *Dive into Deep Learning*. A course can build understanding without automatically preparing someone for a specific interview. After learning iOS, he still had to spend time on the knowledge a role expected candidates to demonstrate. The two efforts should be checked against a person's goal: only practicing interview problems may leave no working project, while only completing courses may leave a candidate unfamiliar with the job's expectations.

### Shared documents preserve a discussion

His first productivity recommendation was a collaborative document. In an exchange of attachments, several recipients soon hold different files each called "final." A shared document gives everyone one place to edit, comment and read the latest version. Threaded conversations in a chat tool do something similar for discussion: replies stay attached to the question instead of burying unrelated work under dozens of messages. He also mentioned Git graphical tools and keyboard shortcuts. Each saves only a little friction at a time, but repeated daily actions make the cost matter.

These tools share a purpose: they reduce information loss as work passes between people. Specific products, licenses and prices from the recording belonged to that period and should be checked afresh before choosing a tool today.

### Time for games and other interests

Yuu's team paid more attention to results than to a rigid start and end time. Reduced commuting gave him room to study and play games, with the balance changing according to his interests. He had once considered moving abroad through an internal opportunity, but later circumstances and his own priorities changed that plan. A career plan is allowed to change when reality changes.

The host initially framed games as a way to relax after work. Yuu replied that some games require genuine attention: their world, characters and story can engage a player much as a book or film can. He liked games with a coherent world in which the player participates. He was less interested in repetitive daily checklists that make play feel like a second job. Personal time need not exist only to restore work capacity; it can be spent on an experience someone actually wants.

### Video creation needs iteration, and a reason to continue

Yuu had also made videos and streamed. He recommended choosing one editing program and learning the basic cuts, music and keyframes needed to publish a first piece. Software proficiency alone would not explain why an audience watched. After publication, a creator could compare similar channels: did the title and cover accurately present the subject, was the pacing too slow, and where did viewers leave? Making a series of roughly ten pieces and looking back at their different results could teach more than studying a purported secret formula before making anything.

He was candid that effort and reach do not rise together reliably. Someone can invest heavily and still see little growth. If the process itself brings no satisfaction, it is reasonable to reconsider the investment. If the creator wants to keep going, actual feedback is more useful than treating one video's view count as a final judgment on personal ability.

The closing questions returned to pay and promotion. Yuu noted that compensation changes with location, joining date and the value of equity, so another employee's experience cannot yield one portable number. Promotion likewise depended on real contribution to projects and the organization. Throughout the conversation, his experience offered examples and questions for listeners to test against their own circumstances, not guarantees about their futures.

## Full recording

- [Yuu on mobile engineering at LinkedIn, full T Chat episode (Chinese)](https://www.bilibili.com/video/BV11r4y177E5)
