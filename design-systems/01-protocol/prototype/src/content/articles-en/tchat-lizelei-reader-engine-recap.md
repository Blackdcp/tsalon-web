---
title: "Li Zelei on a Reader Layout Engine: Cross-Platform Rebuilding and Reading Experience"
summary: A recap of two T Chat Episode 10 recordings, from Baidu's C++ fiction-reader layout engine, content and render trees, two-stage pagination, and Chinese typography to engineering growth, team decisions, and career choices.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 18
author: editorial-team
topics:
  - Layout Engines
  - Engineering
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-10
cover: /images/talks/tchat-10.jpeg
coverAlt: Li Zelei discussing Baidu's reader technology and his engineering career in T Chat Episode 10
citations:
  - label: Li Zelei, Building a Reader at Baidu
    url: https://www.bilibili.com/video/BV1At4y1775f
  - label: One-to-one interview with Li Zelei
    url: https://www.bilibili.com/video/BV1XY4y1T7Uz
tldr:
  - "Baselines and punctuation shape continuous reading: The talk began with two comparisons."
  - "Font metrics and internationalization are layout problems too: The final technical section returned to fonts."
  - "Industry change and what came next: Li offered an everyday parking example."
faq: []
featured: false
draft: false
translationOf: tchat-lizelei-reader-engine-recap
translationStatus: reviewed
seo:
  title: Li Zelei on Reader Layout Engines and Engineering Growth | T Chat
  description: Episode 10 covers reader architecture, layout, pagination, text selection, Chinese typography, technical learning, management, and technology choices.
  noindex: false
---

> These videos were published in 2022. The technical conditions, personal experiences, and opinions below reflect that period.

A reader app may look like a program that puts words on a screen. Its layout engine must decide where lines and pages break, how a user selects text, and how the experience stays smooth during long reading sessions. In T Chat Episode 10, Li Zelei explained a technical rebuilding of Baidu's fiction reader. A following one-to-one interview discussed his move from an individual developer to a team lead. Together the two recordings run for roughly 67 minutes.

## A layout engine does more than make text visible

### Baselines and punctuation shape continuous reading

The talk began with two comparisons. The same words look unbalanced when glyphs are not aligned to an appropriate baseline. A full stop or comma stranded at the start of the next line can interrupt the reader's eye. System text controls often handle such rules already, so application developers may not notice them.

Li defined typesetting as presenting content appropriately within a fixed page. “Appropriately” includes many specific strategies. In a broad sense, a layout engine can cover parsing, layout, rendering, and display. This talk focused mainly on the narrower component that calculates where content goes.

He had the audience read the same passage twice. In one arrangement, punctuation or an isolated character at the line boundary disrupted the flow; in the other, a layout rule adjusted the end of one line and the beginning of the next. The exercise showed that layout rules are more than decoration. They affect whether a sentence reads continuously.

He also distinguished reflowable layout from fixed-position layout. Reflow changes the arrangement as screen width and height change; a fixed page preserves planned coordinates more closely. Fiction readers mainly handle reflowable text, while more complex documents can combine the two approaches.

### Why rebuild when operating systems already render text?

The team's existing iOS and Android readers used separate implementations. Its iOS wrapper around Core Text provided limited application capability, while Android relied on an older third-party framework version. Li grouped the problems into three areas: missing reader functions and difficulty adding images, tables, or lists; duplicate development across the two platforms; and layout quality and performance that were hard to align.

In practice, the old versions lacked capabilities such as copying and selecting text. Future EPUB resources with mixed text and images, tables, and lists would be difficult to support within the old structure. Even the same selection feature would need different designs and implementations on iOS and Android. Li also described memory use and stuttering in the old project; those observations should not be treated as a performance baseline for every reader.

The new project therefore aimed to share a C++ implementation across platforms, with control over parsing, layout, and rendering. Better reading experience was meant to support business goals as well. This self-built engine addressed the team's specific constraints; it was not an assertion that every app should replace system text capabilities.

## How a shared engine organizes data and work

### Separate the reader shell, engine, and basic services

The upper reader layer handles settings, scrolling, bookmarks, and the table of contents. The team wanted to put suitable non-system logic in C++ too, reducing behavioral differences between platforms. The middle layer contains parsing, layout, and rendering. A lower layer wraps shared capabilities such as threads and file access.

The older layout process was relatively closed to the team. In the new structure they could intervene at several stages: how content is parsed, how it enters layout, and what the rendering layer receives. A new feature need not be bolted onto the final drawn image.

### The content tree describes input; the render tree describes its layout

Li used two project terms, here called the content tree and render tree, for the two main data structures. Different book formats first become one common content representation. The layout engine walks it, applies policies, and produces a render representation. He compared their relationship with a browser's document tree and rendering tree.

The content side holds text and attributes. The render side includes actual positions and other drawing information. The engine need not make one object for every character: it can group spans by language and properties. Attribute storage also reflects use and memory costs. An absent property need not consume space in the input tree; data exposed for rendering should remain clear to its callers.

He made grouping tangible with one displayed line containing eighteen Chinese characters and three punctuation marks. Grouping by shared text properties and punctuation boundaries produced eight boxes, not a separate peer-level object for each character. The saved work came from the structure of the data. The content side stored only attributes that existed, while the render side explicitly carried details such as size, color, and coordinates for downstream use.

Separating the trees also loosens the tie between input format and layout policy. A new file format can be parsed into the common representation, then processed by the same engine. A new visual effect has a defined place in the data and strategy stages.

### Why use a native implementation here?

The host raised the natural question: why not use a WebView? Li answered through parsing, layout, and drawing. The team wanted a focused, lighter implementation for book content. Long chapters also require careful handling of memory and many pages. Once the engine emits element coordinates, native code can draw directly from the result.

He likened his approach to a lighter layout capability for a narrower kind of content. The answer was tied to the project's requirements for control and performance and to the team's experience. It does not imply that native code is the right technology for every reader.

## From large-book pagination to complex pages

### Separate page boundaries from finished page layout

The old reader could open a large book slowly. To know the total page count, it previously generated a great deal of complete layout data in advance. This cost computation and kept unshown pages in memory.

The new engine divided the work into a first pass and a detailed pass. The first determines which content falls on each page and stores lightweight beginning and ending positions. When a page is actually needed, the second creates the full rendering data for it. Time-consuming rules that affect appearance but not a page boundary can wait until that detailed pass.

The important distinction is what pagination alone needs and what final display needs. Once it has PageInfo records, the reader can answer “how many pages?” and “where is this page?” Only when the user turns to a page must it construct the positioned render tree. The first pass is not an arbitrarily low-quality version of the second; it deliberately postpones calculations that are not needed yet.

Li used a book of about five thousand pages to explain the memory cost. Under the team's implementation and estimate at the time, storing complete layout for all those pages might take roughly 30 to 40 MB. A shallow PageInfo record per page needs far less. Full justification, for instance, matters to the final appearance but need not change what content belongs on a page, so it can run later. Those estimates do not automatically apply to another engine.

The public operations followed the same split: one paginates the book, and another builds the detailed render result for a specified page. The caller requests the data it needs.

### Drop caps, phonetic annotations, and nested layout

The ordinary process walks the content tree, calculates positions on a page, and writes a render tree. A drop cap occupies part of several subsequent lines, so the engine cannot keep laying text across each full line width.

In Li's demonstration, an enlarged first letter took space on the left of the next few lines. The engine tracked the region that remained occupied. For each affected line it recalculated the available width before placing the rest of the text. Once it passed the drop cap's vertical range, later lines could use the full width again. A layout engine needs more state than a cursor that simply moves rightward.

He also showed a Chinese character with a phonetic annotation above it. The character and annotation can first be treated as one box; inside that box, the annotation and centered character get positions relative to each other. Before drawing, those positions are flattened into page coordinates. A fraction's numerator and denominator can be understood through similar nesting. This differs from a drop cap: one arranges components within an element, while the other changes the available region for later lines.

### Position data also enables text selection

The render tree serves more than drawing. For selection, the app supplies gesture coordinates. The engine needs to find the paragraph, line, and character under a point and use both selection endpoints to determine the content between them.

Li demonstrated this hit testing in an engine demo. To select two characters in a title, the engine finds the touched paragraph, then the line and characters, and combines the endpoint positions. A reader sees one continuous sentence; the engine already knows each character's position and index. Drawing text and deciding which character a user touched can therefore share one layout result.

## Reading experience requires continuing refinement

### Complete content, smooth movement, and page detail

Li divided reading experience into three concerns. First, the book's content must be supported correctly: if important material disappears, other polish cannot compensate. Second, long reading sessions need smooth scrolling and sensible CPU and memory use, which also affect device heat. Third come the finer visual decisions.

He used the idea of a page's overall “grayness” to describe the distribution of letters, punctuation, and white space. A large empty patch interrupts the eye; overly dense placement feels cramped. He showed strategies that compress some full-width punctuation at the beginning of a line or next to other punctuation, making better use of a phone's narrow line width. These were two examples among the team's many refinements, not a complete typography rulebook.

### Font metrics and internationalization are layout problems too

The final technical section returned to fonts. A glyph's visible width differs from its advance width, which includes spacing on either side. Its extent above and below the baseline also contributes to layout. Pairs of letters may require kerning rather than simply adding two fixed widths.

Li separated glyph width, side bearings, and advance width. Two Chinese characters with the same nominal font size may still leave visible space between their strokes when placed at their advance positions. In the Latin pair `VA`, kerning can move the `A` closer to the `V`. Ascent above the baseline and descent below it describe vertical extent. Putting a glyph in a rectangular box does not capture all these measurements.

He ended with a question about right-to-left Arabic text. If a reading product enters another language market, which original layout assumptions must change? The recording raises the issue but does not provide a full bidirectional-text algorithm.

## From individual developer to team lead

### Care about business results and developers' technical goals

The interview began with Li describing his role leading Baidu's fiction-client team at the time. The reader's layout work had stabilized, but inherited code still carried historical debt and coupling that the team needed to improve. Alongside technical decisions, a lead had to think more about business results and the growth of colleagues.

He understood why developers wanted technically deep projects; he had wanted them himself. Part of leading the team was learning what members hoped to work on and finding technical projects that could serve a real business need, so personal development and team goals could reinforce one another.

### Growth expands the range of problems you own

Li described growth as repeatedly changing how one understands technology. At first, a developer draws screens and satisfies functions. Later they care about code quality and ask why third-party libraries or system APIs were designed as they were. Responsible for a complex module, they must design interfaces, internal boundaries, and the way others will use it.

The host asked what really changes when a person goes from writing a module alone to leading a project. A module owner can concentrate on their own interfaces and code. A project lead must connect several people's work to one objective. Li joked that while writing a module it is easy to think one's own code is best; later one can discover that a pattern one disliked was in fact one's own earlier work. Growth also means revising that judgement.

Across multiple projects, the questions expand again: which capabilities should be shared, and which technical choices should differ by project? Technical depth remains useful, but “my own part works” no longer covers the full responsibility.

### Challenges are occasional; failures can still teach

Asked for the three most important factors in growth, Li declined to force a fixed formula. Specific challenges mattered more to him. An unfamiliar technical field can deepen or broaden skill; a large project teaches coordination and management. Most ordinary work is not a new challenge every day, so it is worth engaging when one arrives.

He also acknowledged that attempts fail. A setback can be technical or organizational. Analyzing and continuing to solve the problem can still leave knowledge for the next attempt. His positive attitude was a willingness to act through difficulty, not a claim that every challenge succeeds.

### Lower-level learning needs a direction, practice, and foundations

For areas such as layout and media, Li recommended learning in a real use case when possible. Reading books and articles without using the ideas for a long time makes them easier to forget and hides the actual engineering difficulties. C++ can help someone enter several cross-platform fields, but knowing the language is not the same as knowing a domain.

He specifically credited guidance from a layout specialist while he was learning. Typography rules, layout techniques, and character encoding create a large search space; an experienced guide helped him find a direction. Without a work opportunity, a learner can still design and finish a personal project, then test their understanding against its behavior.

### Think beyond the next few weeks when choosing a path

His career uncertainty often took the form of choices: go deeper technically or take on management; stay in the current field or explore cross-platform work. He looked one or two years ahead and asked what he wanted to gain and what actually interested him, rather than follow a short-lived trend.

Changing jobs also carries costs: entering a new environment, rebuilding trust, and establishing working relationships. Pay and the work itself matter, but they are not the only variables. This was his decision process, not one universal career prescription.

## Connecting technical evolution to team results

### Benefit and fit are both tests for a technology choice

Architecture work can matter without blocking the business as urgently as a production defect. That makes it important to explain the benefit of a technical project. “Less coupling” and “clearer architecture” describe a change; the team should also say how it reduces maintenance, saves development time, or improves delivery.

Fit matters alongside benefit. A cross-platform approach that succeeds elsewhere may not suit this team's stack, experience, and products. Adoption, learning, maintenance, and the eventual extent of use are all part of the choice.

### Hiring looks at platform skill, engineering foundations, and explanation

Li split “iOS engineer” into two dimensions. The person needs competence and depth on the platform; as an engineer, they also need broader computer science, algorithms, and data structures. He looked at whether candidates could communicate clearly and reason coherently, because colleagues have to explain problems to one another.

Responsibility changes with experience: first deliver the role's ordinary work reliably, then own a module, then move projects forward from technical and business perspectives. Initiative, accountability, and cooperation matter increasingly along that path. Hiring mentioned in the video belongs to 2022 and says nothing about current openings.

### Exploration can be uncertain, but its purpose should be clear

The host pressed him on performance descriptions for technical projects. Is “reduced coupling” or “clearer architecture” an outcome? Li saw these as descriptions of what changed; the team should go further and explain how maintenance takes less time or new requests become easier to deliver. The conversation did not provide a verifiable efficiency gain for this reader rebuild, so the host's illustrative numbers cannot be presented as its measured results.

Another question followed: if benefits matter, what happens to exploratory work whose outcome is unknown? Li said exploration is possible, but the team should explain the problem, why this direction is worth trying, and the rough range of benefit it hopes for. Not being able to guarantee a result differs from having no rationale.

He gave cross-platform adoption as an example. Introducing a large new stack for only one or two pages may fail to deliver the originally promised efficiency. After an experiment, the actual use and maintenance costs need review. Popularity or a successful demo alone does not establish the value.

## Industry change and what came next

Li offered an everyday parking example. With few spaces at the office, even he might worry that a colleague's car would take the last one. It made his point about competition for scarce resources concrete. In his view, performance reviews, promotion, and bonuses keep such competition present in work. The host shifted the discussion to growth: inefficient work could exist during rapid expansion but be hidden by it. As growth slows, teams need to distinguish productive effort from wasted effort. These were their observations in 2022, not findings about the whole industry.

They then discussed room for mobile engineers to grow. If skill means only one UI framework, the field looks narrow. Looking toward devices, systems, and lower-level capabilities can connect to many products. The layout engine from the first half is one example of going deeper from a business need.

At the time, Li's team planned to keep improving architecture and performance, addressing development efficiency and reading experience respectively. Personally, he wanted to explore EPUB's more complex layout capabilities, but said the business did not yet urgently need those resources. Technical interest and business priority still had to be balanced.
