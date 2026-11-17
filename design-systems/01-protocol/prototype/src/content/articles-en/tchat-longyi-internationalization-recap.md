---
title: Long Yi on Internationalization, Team Management, and Career Growth
summary: A recap of Long Yi's 2022 T Chat talk and interview, moving from languages, layouts, time, money, and data compliance to distributed teams, career choices, knowledge organization, and understanding users and oneself.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 20
author: editorial-team
topics:
  - Internationalization
  - Engineering
  - Career Growth
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-9
cover: /images/talks/tchat-9.jpeg
coverAlt: Poster for Long Yi's T Chat conversation as a former international-client lead at Didi
citations:
  - label: Long Yi's technical talk on internationalization
    url: https://www.bilibili.com/video/BV1HN4y1F7pV
  - label: One-to-one interview with Long Yi
    url: https://www.bilibili.com/video/BV1Da4y1f7VB
  - label: W3C on internationalization and localization
    url: https://www.w3.org/International/questions/qa-i18n
  - label: MySQL 8.0 utf8mb4 character set
    url: https://dev.mysql.com/doc/refman/8.0/en/charset-unicode-utf8mb4.html
  - label: Text of the EU GDPR
    url: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
  - label: CNIL guidance on cookies and trackers
    url: https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi
tldr:
  - "Internationalization removes assumptions; localization supplies specific answers: Long Yi first distinguished globalization, internationalization, localization, and translation."
  - "Optimism, curiosity, and reflection without self-punishment: Asked what had helped her through difficult periods, Long Yi named optimism, curiosity, and reflection."
  - "Leave room for the team's growth and for your own future: On future plans, Long Yi offered no fixed promotion timetable."
faq: []
featured: false
draft: false
translationOf: tchat-longyi-internationalization-recap
translationStatus: reviewed
seo:
  title: Long Yi on Internationalization and Team Leadership | T Chat
  description: Long Yi discusses localization, time and currency, privacy and cross-border data, her career path, note-taking, distributed teams, and personal choices.
  noindex: false
---

> These videos were published in 2022. The technical conditions, personal experiences, and opinions below reflect that period.

How much must change when a product built for one domestic market enters another? Long Yi began her answer with language, then moved to time, money, culture, privacy, and teamwork. Internationalization is difficult partly because software silently assumes local conventions, and partly because the engineers changing it may be far from the people who actually use it.

The episode poster introduced her as a former lead of Didi's international client development. In the interview, she said she had joined Tencent and was leading a platform team with iOS, Android, and frontend developers. A technical talk of about half an hour was followed by nearly fifty minutes of conversation about her role, early setbacks, career choices, learning habits, and management regrets.

## Internationalization removes assumptions; localization supplies specific answers

Long Yi first distinguished globalization, internationalization, localization, and translation. They are related but not the same. She used a multinational restaurant brand to make the point: the overall brand can remain recognizable while names, menus, and service arrangements change for a market. Translation is only one part of adapting a product to how people live locally.

She wrote the four terms as G11N, I18N, L10N, and T9N; the number counts omitted letters between the first and last. The shorthand helps prevent “translate Chinese copy into English” from becoming the whole definition of an international product. She gave an apparently simple three-step path: prepare the internationalization foundation, localize for a target market, and release the product. The complexity lies in the assumptions each step exposes.

In software, the foundation starts by removing hard-coded premises. A system that assumes everyone uses Simplified Chinese, the same currency, and the same time zone will struggle in another market. It needs a way to represent variation before a particular locale can supply language, formats, and rules. Finishing that foundation alone does not make the product suitable for every overseas market.

This distinction is consistent with the [W3C's explanation of internationalization and localization](https://www.w3.org/International/questions/qa-i18n): one makes a product easier to adapt, while the other meets the linguistic, cultural, and other needs of a particular target market.

## Language, writing system, and region cannot be one country field

One country can use several languages, and one language can develop different conventions in different regions. A user's location does not automatically tell a product which interface language to use. Language, writing system, and region need to be understood separately, then connected to content and configuration through suitable locale data.

On screen, Long Yi compared Simplified Chinese in mainland China, English in the United States, and French in part of Canada. Using the Latin script does not make US English and Canadian French one content configuration. Moving to a right-to-left language requires more than right-aligning words: reading order, forward and back arrows, directional images, and the wider layout must be checked.

Grammar makes simple string substitution unreliable too. Some languages distinguish grammatical gender; others have several plural forms. Case, punctuation, and sentence structure vary. A Chinese sentence may change only one noun, while another language also changes a verb. Visually similar commas can be different characters, and Spanish questions and exclamations have punctuation conventions of their own. Concatenating isolated fragments can lose these relationships.

She showed Russian sentences whose Chinese equivalents were “the magazine was on the table,” “the book was on the table,” and “the letter was on the table.” The Chinese pattern hardly changes; in a language with grammatical gender, another word in the sentence may change with the noun. Long Yi did not claim to read the Russian examples aloud. Her point was that code must not assume it can assemble a good sentence from a handful of fixed pieces; the slide was not a ready-made translation table.

## Reuse language rules, and leave room for layouts to change

Long Yi suggested storing and passing locale information across frontend and backend, then using it to choose content, assets, and direction. Each business feature need not reinvent plural and grammar support. Platforms have localization mechanisms, and CLDR provides language data worth consulting. Character encoding and sorting also matter: alphabetical order in English and pinyin-based organization of Chinese text reflect different user expectations.

Her layout example was immediate. In the Chinese version of an app, five short labels fitted on one row. In English, longer words left several labels as ellipses. Another delivery app used a less crowded row and gave each label more room. Neither design was declared universally right; the question was whether one layout could accommodate the target languages.

She recommended leaving space for text, adapting to content width, and avoiding words baked into images. Mixed image-and-text layouts, directional artwork, and small screens all need to be seen in the actual languages. A wrapped layout attractive with one script may be awkward with another. Internationalization therefore affects the design system, not merely the final translation files.

## Time, numbers, and money carry meaning beyond display

Date, time, calendar, time zone, daylight-saving rules, and the first day of a week formed another group of examples. Even when describing the same day, the order of year, month, and day, separators, and calendars can differ. Long Yi emphasized a consistent storage convention and discussed UTC as an approach. A system with substantial historical data must account for existing users and records during any migration; changing one field's format does not complete internationalization.

Time-zone offsets are not always whole hours, and daylight-saving rules can change by place. If a database has long stored Beijing time, a team must not simply reinterpret old fields as UTC. It should first establish what those values mean and where conversion occurs, then plan migration.

Numbers likewise have more than a visual shape. Decimal and grouping marks vary, as do numeral systems and conventions for abbreviating thousands or ten-thousands. Currency symbols can be ambiguous. An amount must be understood together with its currency rather than as a bare number or symbol. Storage range and capacity deserve attention before a new market presents amounts that do not fit the original fields.

She pointed out that the international currency code for the renminbi is CNY. A symbol resembling `¥` can denote more than one currency, and a dollar sign does not by itself identify a country. The data layer should retain an explicit currency type and format amounts for their display context. If it stores only a formatted string, later conversion, aggregation, or market adaptation loses the original meaning.

Long Yi also discussed Unicode, UTF-8, ICU, and the MySQL character set. According to the [MySQL 8.0 documentation](https://dev.mysql.com/doc/refman/8.0/en/charset-unicode-utf8mb4.html), `utf8mb4` supports both the Basic Multilingual Plane and supplementary characters, whereas `utf8mb3` supports only the former. “UTF-8” appearing in a configuration name does not establish that every link in the storage path supports every needed character.

## Local experience includes names, addresses, culture, and accessibility

Phone numbers, addresses, and personal names are other places where a domestic product can carry unexamined assumptions. Long Yi included accessibility in market adaptation as well: a team should check not only whether users can read the copy but whether they can operate the product.

Her cultural examples included maps, names for places, holiday greetings, gestures, and brand words. A word, number, or movement natural at home may be read differently elsewhere. Her light examples were a warning against projecting one's own context into another market. Asking people in a specific market how material is understood is more useful than memorizing a list that treats everyone in an entire country as having one preference.

## Privacy capabilities belong in product, data, and process

Long Yi split compliance work into three layers. At the product layer, users need explanations of how information is used and, where applicable, ways to close an account, delete or export data, and change settings. The data layer covers collection, transfer, storage, use, and destruction. The process layer includes response to incidents, internal information-security management, and necessary handling procedures.

She called out children's information, sensitive data, profiling, and collection minimization. The engineering implication is that a privacy notice added at the end cannot make an unsupported promise true. If a system cannot delete data, control access, or identify where information travels, the product cannot easily deliver on such promises. She also discussed cookie notices and consent behavior as matters for client and frontend teams.

These were engineering observations from that period. The GDPR has specific provisions on scope, conditions, and penalty limits. Cookie rules also distinguish purposes and exceptions; the recording's simplified descriptions should not be read as one global consent rule for every cookie. See the [GDPR text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) and [CNIL guidance on cookies](https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi).

Cross-border data brought the discussion back to actual system paths. Even if the product team does not deliberately copy records abroad, third-party SDKs, services, or a CDN can change where information goes. Long Yi suggested monitoring traffic at entry points, scanning and analyzing third-party behavior in clients, and understanding which data a CDN handles. An image can contain sensitive information too; being outside a user table does not make it irrelevant. Engineers first need to see the path. Whether a transfer is permitted depends on the location, data, and applicable rules.

## An internationalization platform should reduce what each team must memorize

Long Yi ended the technical talk with a direction for shared infrastructure: a business team should not have to become expert in every internationalization rule before it can integrate correctly. Shared configuration and services can carry language, formatting, translation, privacy, and regional infrastructure concerns, reducing repeated implementation across teams.

As the number of markets grows, configuration branches multiply and testing can become a bottleneck. Internationalization engineers should help testers verify combinations of languages, regions, and settings. The platform's value is not merely wrapping some code; it should make the product's behavior in varied environments easier to see.

For example, a team might specify the relevant languages and regions and receive the appropriate content, formatting, and base capabilities. That shifts pressure to testing: language, text direction, dates, money, and privacy settings form many combinations that people cannot reliably cover by clicking through screens one by one. Generating, checking, and reproducing configurations is part of reducing the platform's cost to its users.

## A manager's role changes, but technical sensitivity still matters

The interview began with Long Yi's work at the time. She led a platform team spanning mobile clients and frontend engineering. More of her time went to coordination, technical direction, and code review, and less to production feature code, though she still experimented through demos.

She had begun leading teams in the second half of 2015. Early on she felt she could solve almost anything. Familiarity and some weariness followed; later she came to see how much more management required her to learn. It called for technical and business understanding, empathy, and the ability to move work forward.

Asked how to divide time between management and technology, she first asked what stage the team was in. On taking over an unfamiliar group without trust, the priority is relationships and shared goals. Once cooperation is stable, the lead can reserve more room to read and try new technology. Unexpected tasks still arrive, so a permanent daily ratio is unrealistic.

She did not require a manager to take ordinary frontline feature tickets. Writing demos and trying technology personally can nevertheless ground technical judgement. As a platform lead, she also discussed direction and reviewed code. Keeping that connection mattered even while she wrote less business code.

## From digital media to engineering, without a fixed route

Long Yi and the host had been university classmates. She studied digital media technology, including some drawing, and had not decided from the outset to be a programmer. Competitions and similar opportunities initially sounded interesting to try rather than like steps in a finished career plan.

In early work in Wuhan, recognition for something she had done suggested that she might go further in engineering. A subsequent period in Beijing was harder. She asked herself whether the field was wrong for her or whether she still liked it but needed another environment and direction.

At Didi she connected her growth to the organization's growth: encounter a challenge, then work to solve it. She did not present that period as a repeatable recipe and acknowledged the role of opportunity and luck. When she joined Tencent in 2022, she saw a chance to start learning about herself again. She wanted to respect her strengths, limits, and desires rather than believe every choice had to be made at the perfect moment.

## Optimism, curiosity, and reflection without self-punishment

Asked what had helped her through difficult periods, Long Yi named optimism, curiosity, and reflection. Optimism leaves room to try again. Curiosity encourages a person to understand why things work as they do. Reflection helps with the next attempt rather than proving that every previous decision was right.

She gave reflection a personal boundary. Once she understands a character trait, she need not assume it must be completely removed. Growth does not require endlessly forcing oneself into another person's ideal.

The host recalled a startup that failed after he graduated, showing why optimism does not mean an absence of low points. He also described revisiting judgements made years earlier to see whether his way of thinking had changed. Long Yi's response kept the distinction: notice a habit that caused a problem and adjust next time, but do not punish yourself for a trait that need not change. That startup story belongs to the host, not to Long Yi's career.

## Turn notes into knowledge, while leaving some choices open

When asked how to become an excellent developer, Long Yi played down the gender label; the basic qualities of a developer are shared. One habit she wished she had started earlier was systematic note-taking. When younger, she thought she could remember what she encountered. Later she saw that memory alone could not preserve and connect it all.

She described three layers: an Inbox for miscellaneous input, Notes organized from that inbox at intervals, and Knowledge refined into linked ideas she could retrieve when needed. The aim is not to keep every item ever read, but to make understanding more structured.

This grew from her regret that “I have seen it” did not mean “I can find and use it again.” The host then asked how to recognize one's own preferences more quickly, moving the conversation from arranging information to arranging possible choices.

Her other advice was to know one's personality and preferences. Choosing between specialist and management paths should not depend solely on which one looks more prestigious. She groups decisions into things she particularly likes, things she particularly dislikes, and a middle category of things she does not dislike. The middle can remain open for experiments; not every direction needs an immediate final answer.

## Growth is not determined only by the task you are handed

Audience discussion brought up whether developers should select only the “good” tasks. Long Yi resisted waiting for a more prestigious assignment with an obvious technical label. If the same work keeps recurring, she would ask why, whether it can be done more effectively, and whether that improvement can free time for other problems.

The host connected this to business development and architecture. An inexperienced developer and an experienced architect can design the same business feature very differently; the task's label does not fix how much can be learned from it. Long Yi said she had interviewed people wanting to move from business to architecture and others wanting the reverse. What matters is what someone can do well, not treating one class of job as inherently superior.

## A fast-growing organization offers room and uncertainty

Looking back at joining Didi relatively early, Long Yi saw advantages and disadvantages together. Rapid growth can let an individual take on more, but the company might also fail to grow as expected. Compared with a mature organization, an early team may have less developed training, rules, and mentoring.

She tied her choice to her appetite for challenges, not to a rule that earlier is always better. She and the host joked with investment analogies, but the decision was about risk tolerance. Opportunity and uncertainty often arrive together; a person has to consider which environment they are willing to bear.

## In international work, the hardest distance is from real users

Returning to work, Long Yi said that building for overseas users while sitting in China makes it difficult to feel what those users experience. Local operations colleagues may send information back, but engineers still need the context behind a reported issue. Cultural differences are not solved by speaking English; some markets do not primarily use it.

Travel preferences, family life, and communication across backgrounds also affect teamwork. She wanted people willing to work through these questions together and to understand users with greater empathy, rather than assume a single technical answer would solve every market.

The host contrasted his earlier delivery-service work, where he could ride along and experience the process himself. In overseas work, he felt farther from real users. Even when a city team or management chain reports that “this does not work well,” the engineer must ask what happened and in which setting. Long Yi recognized the same difficulty: an internationalization team must often spend effort just to describe the right problem before changing the product.

## Distributed leadership starts with trust and a shared goal

Long Yi placed trust and goals at the center of managing across locations. When colleagues are apart, both sides need to believe one another and agree what the work is meant to achieve.

She asked a pointed question: is the lead supposed to watch cameras every day to see when each person reaches the office? In her team, she said she normally approved leave requests and focused instead on agreeing goals and responsibilities, then letting people arrange their time. That describes her management practice, not a personnel rule for every organization. The host connected it to another lead's task: helping people in different cities understand the common destination.

Long Yi added that management principles are easier to say than to practice. She preferred to see the lead as one role within the team, not a person naturally above colleagues. Shared goals have to be understood together; trust has to be built through actual work.

## Take responsibility for the past without trying to redo it

Asked about management mistakes, Long Yi said some past events had returned to her thoughts for years. She kept wondering whether she could have been more mature, tried harder, or achieved a better result. Eventually she accepted that good intentions do not give one person control over every outcome.

Letting herself move on was not abandoning reflection. It meant understanding her capacity and circumstances at the time without continuing to punish herself for a past she could not replay. The host responded with his own move from feeling able to do anything to accepting ordinary human limits.

## A job change need not happen after a fixed number of years

Explaining her departure from Didi, Long Yi said she had spent many years there and knew the work and life well, but wanted to see something new. She had never assumed that being a programmer was the only identity she could have for life.

Earlier, she had tried to require herself to spend a set number of years in a job. Experience showed her that such rules could not replace a real decision. She took her work seriously, but staying had to be judged against her wishes and circumstances. Trying Tencent was driven by curiosity and a wish to learn, not a recommended job-switching frequency for everyone.

The host read this as respect for what she really wanted. Neither reduced a career to a sequence of titles. They asked whether a choice could still invite commitment and what a new environment could teach.

## Leave room for the team's growth and for your own future

On future plans, Long Yi offered no fixed promotion timetable. She wanted to do the present work well and understand things she had not yet encountered in the new organization. For her team, she hoped colleagues would grow technically, know their goals, feel achievement, and be treated reasonably within the scope she could influence.

She put those wishes in the 2022 industry context. Opportunities would not necessarily keep coming at the rate seen during rapid growth, and a lead had to know the limits of their own influence. A larger team, a promotion, or a new responsibility can be an opportunity, but watching those outcomes alone can obscure worthwhile work in front of a person.

At the close, the two former classmates recalled joining activities together at university and imagined another conversation ten years later. Would they still discuss programming, or something entirely different? Long Yi returned to optimism and openness. People and opportunities change; a person need not lock every later stage into a plan now.

From product adaptation to personal choices, the two conversations repeatedly examined default assumptions. Users do not necessarily live by our conventions; colleagues do not all need the same management style; and one's own career need not follow an old diagram. Understanding those differences creates room for better systems, collaboration, and work.
