---
title: Fan Wenjie on Webpack Source Code and Frontend Growth
summary: A recap of both T Chat episode 11 recordings, from tracing the Webpack entry point, Compiler, Compilation, and plugin hooks to frontend growth, framework choice, technical writing, work priorities, and team development.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 23
author: editorial-team
topics:
  - Webpack
  - Frontend
  - Engineering
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-11
cover: /images/talks/tchat-11.jpeg
coverAlt: Fan Wenjie discusses reading Webpack source code and growing as a frontend engineer
citations:
  - label: Fan Wenjie's talk on reading Webpack source code
    url: https://www.bilibili.com/video/BV1vD4y1v7ok
  - label: One-to-one conversation with Fan Wenjie
    url: https://www.bilibili.com/video/BV1gd4y167HK
  - label: Official Webpack Compiler Hooks documentation
    url: https://webpack.js.org/api/compiler-hooks/
  - label: Webpack 5.74.0 webpack.js source
    url: https://github.com/webpack/webpack/blob/v5.74.0/lib/webpack.js
  - label: Webpack 5.74.0 EntryPlugin source
    url: https://github.com/webpack/webpack/blob/v5.74.0/lib/EntryPlugin.js
tldr:
  - "Why study a complex codebase at all?: Fan began with his reasons for choosing the topic."
  - "Vue, React, and the cost of bringing a team along: When the host presented Vue and React as a choice, Fan returned to a task he knew well: helping a new teammate identify what to learn before contributing."
  - "Plans for what came next: Fan said there was an important work problem in a field he knew well that affected the business, but its specifics were not appropriate to discuss publicly."
faq: []
featured: false
draft: false
translationOf: tchat-fanwenjie-webpack-career-recap
translationStatus: reviewed
seo:
  title: Fan Wenjie on Webpack Source Code and Frontend Growth | T Chat
  description: The Webpack build path from entry point to plugins, Compiler, and Compilation, followed by Fan Wenjie's views on frontend learning, writing, work, and team development.
  noindex: false
---

> These videos were published in 2022. Technical conditions, personal circumstances, and opinions described here reflect that time.

Preparing a short technical book on Webpack led Fan Wenjie to spend a long time reading its source code and developing a method for working through a complex codebase. In T Chat episode 11 he used a minimal build to show how to run the source, find the important steps, and follow calls made indirectly through the plugin architecture. At the time, he introduced himself as a frontend engineer on ByteDance's Feishu team.

The conversation afterwards went beyond the tool. The host asked how a frontend developer moves from completing assigned requirements toward technical depth, how to choose frameworks, practice writing, make room to learn amid heavy work, and help a team grow. The two halves connect: sustained technical depth requires investment, but deciding what to invest in and how to check progress also takes judgment.

## Technical talk: Follow one build through Webpack

### Why study a complex codebase at all?

Fan began with his reasons for choosing the topic. By 2022, many new frontend build tools had appeared and the field continued to develop. At the same time, many companies' infrastructure and plugin systems, including mini-program projects, already depended on Webpack. Understanding it still mattered to people maintaining those systems. That was a judgment about concrete needs at the time, not a prediction of future market share.

The difficulty was obvious to him: a large amount of code, interrelated types, and many construction stages make it easy to lose the thread. He limited his talk to where the important code lives, how to debug it, how the main process fits together, and which habits transfer to other projects. He did not attempt a line-by-line reading of the repository.

### Find the entry point and build the smallest debugging setup

In an unfamiliar repository, Fan first looks at the directory structure and `package.json` to identify the entry point, dependencies, and tools. In this demonstration he concentrated on `lib` and the files `webpack.js`, `Compiler.js`, and `Compilation.js`. Other directories still have value, but there is no need to investigate them all at once.

His test project contained only a configuration file and a single source entry. He ran `npm link` in the cloned Webpack source and linked that local package into the small project. Then he added `debugger` at the entry point and started a build under a Node.js debugger. He used ndb at the time; it crashed repeatedly on stage. Once debugging resumed, the breakpoint landed in the local source. That verification matters: studying a checkout is futile if the demonstration is secretly running another installed copy.

Being able to stop the program at any important location was his prerequisite for reading it. Static browsing alone makes it hard to know which branch actually executes, what concrete type an object has, or how state changes before and after a call.

### Trace the simplest Compiler path first

Fan deliberately reduced the first run to one configuration object and a normal build. Multiple configurations and watch mode could wait. He followed the entry point through compiler creation, option initialization, applying plugins, obtaining a `Compiler`, and then `run` and compilation. At each layer he asked what the layer does and which call matters next, recording the answer as a flowchart.

Creation and execution are distinct. In the contemporary [Webpack 5.74.0 implementation](https://github.com/webpack/webpack/blob/v5.74.0/lib/webpack.js), a call with a callback can run or watch according to its configuration; a call without a callback returns a compiler for the caller to drive later. Temporarily skipping a branch during reading does not make that branch irrelevant to the API.

During the demonstration he wrote down nodes such as `create`, construction of `Compiler`, `run`, and `compile`. When he reached extensive variable setup or conditional logic, he checked which path the example took, then continued without immediately following every helper. He noted watch mode for later and kept to the ordinary build. This bounded the first pass through the code; once the central route was clear, he could revisit branches that changed the result.

Further in, the process creates a `Compilation` and triggers a stage such as `make` through hooks. Direct jumps between ordinary functions no longer explain the whole execution sequence. The reading method must accommodate plugins.

### At a hook, inspect both the trigger and the registration

Fan explained Webpack's Tapable-based plugins through three questions. When is a hook triggered? Which code registers a callback? What context object and parameters does the callback receive? Stopping at the line that fires a hook makes the call chain appear to vanish; the work may be in a registered plugin.

He searched for registrations of `make`, set aside DLL and dynamic-entry paths that his example did not use, and found `EntryPlugin` for a static entry. A breakpoint confirmed that its callback ran and invoked `compilation.addEntry`, putting the entry into this compilation. The contemporary [EntryPlugin source](https://github.com/webpack/webpack/blob/v5.74.0/lib/EntryPlugin.js) uses `compiler.hooks.make.tapAsync`; a source search needs to allow for registration forms beyond the exact text `tap(...)`.

From `addEntry`, execution continues through entry dependencies, module creation, and factories. Static reading eventually reaches an abstract method with no implementation to open. Fan stopped the debugger there, inspected the concrete factory at runtime, and followed that implementation. He repeatedly proposed what a layer did, examined object types and changed state, and corrected his diagram. There is no shortcut that removes all the layers; careful tracing and verification are the method.

The official [Compiler Hooks documentation](https://webpack.js.org/api/compiler-hooks/) also helps find triggers and understand arguments. The version of documentation should be compared with the checked-out source rather than assumed identical.

### Organize what you have seen into three phases

After tracing the calls, Fan grouped the route into initialization, building, and sealing/generation. This is a reading aid. Initialization prepares configuration and the compiler. Building begins at the configured entry, recursively finds its dependencies and their dependencies, parses them, and forms a module relationship graph. Subsequent work organizes modules into chunks, generates code, and emits assets.

The distinction helps frame a fault: was an entry never read, was a module parsed incorrectly, or did an existing module get organized incorrectly at output time? A simple example may merge many source files into one output file, but actual splitting and assets depend on configuration, dependencies, and optimizations. The existence of chunks between modules and output matters.

Fan opened `Compilation.seal` to show a long function with many hooks, including chunk organization, optimization, and code generation. Trying to memorize it in one pass is unhelpful. He advised choosing a node on the flowchart, perhaps JavaScript parsing or code generation, setting a breakpoint, and checking its inputs and outputs. Once the module-to-chunk route is clear, readers can return to the hooks that change it. HMR, tree shaking, watch, and caching become easier to place in the overall sequence. Skipping them on the first pass is not a reason to ignore them forever.

### Turn one source-reading session into a repeatable method

Reading Webpack could help an engineer write plugins and loaders with more confidence, locate build failures, improve performance, and potentially take on infrastructure work. Fan presented these as possible capabilities and opportunities, not rewards guaranteed by finishing the repository.

His reusable sequence was: observe the directories, entry point, and dependencies; pick one question; consult existing material; outline the key route; investigate branches and details; and leave a summary. The entry point can be program startup or a narrower question such as how all dependent modules are read. Its size should fit the reader's present experience.

Two often-missed actions followed. First, verify someone else's article or diagram by running the code; Fan showed his own charts but urged the audience to set breakpoints and see whether the described calls apply to their version. Second, keep notes. Record uncertain layers as questions for another pass and confirmed object types or state changes as findings. He had read other projects, including React, without enough notes and later forgotten much of the detail. Even a private summary can prevent the next investigation from starting again at the directory listing.

## The conversation: Choose problems worth pursuing

### Why frontend, and where can it lead?

Fan recalled writing C# at university. Before graduation, he made a personal judgment about job prospects and realized he preferred visible page effects and interactions to continuing on a backend route. He started full-time frontend work after graduating in 2013. His comments about the relative job market for languages were explicitly personal impressions, not market statistics.

When the host asked where frontend's ceiling might be, Fan described criteria for choosing a direction: a problem should be difficult and have real business value. A drag-and-drop page is only the start of a low-code product. The generated pages must also perform well, be usable, and cover diverse business requirements. Complex visualization and interaction involve similarly deep work. Engineering systems have to improve team productivity and infrastructure, not just show a clever demo. Fan was working on low-code problems at the time and saw substantial room to grow.

### From doing the job to leading larger solutions

Fan made his proposed growth stages concrete with his own early work. At his first small company, he mainly knew how to assemble pages with jQuery. Real requirements revealed gaps; his first task was to become capable of delivering what the job demanded. Once he could do that, repeated CSS and similar work made him ask whether tools such as Less or Sass could improve the process. That was a move from meeting expectations to improving the existing environment.

Deeper performance and tooling problems then required understanding underlying implementations rather than merely calling APIs. Later, an engineer may need to understand the business, team, frontend and backend boundaries, and choose an appropriate engineering system before guiding others through the work. Wider responsibility can cross functional lines and involve different roles. This is a summary of changing capabilities, not a required sequence of job titles or years of service.

### Vue, React, and the cost of bringing a team along

When the host presented Vue and React as a choice, Fan returned to a task he knew well: helping a new teammate identify what to learn before contributing. If a framework is easier for his team to explain and adopt, that training cost belongs in the decision. Based on his experience, he would lean toward Vue when forming a new team. React had other strengths and a different developer experience, but could create different ways for novices to make mistakes. He acknowledged the role of his own habits and would also consider newer tools.

His spoken comparison of performance “ceilings and floors” was personal experience, not a reproducible benchmark. A real choice must account for people, requirements, and the current project instead of memorizing the name he favored.

### Would Vite replace Webpack?

The question came from the live audience. Fan first declined to predict the whole industry's future. “Complete replacement” seemed unlikely in existing projects: internal plugins and established systems do not vanish when a new tool appears. Webpack was also changing, including its approaches to caching and delayed work, while some specialized or complex scenarios already had mature implementations. Vite was worth learning, but he could more easily imagine tools coexisting across different projects.

He had only made a limited experiential comparison, not a full performance study. His answer is useful for understanding how to think about a 2022 project's existing constraints, not as a present-day speed or suitability benchmark.

Another audience member asked whether interviews' apparent focus on React meant everyone should prepare around it. Fan described his own practice: if a candidate's resume mainly shows Vue, he asks about Vue; if it mainly shows React, he asks about React; if both appear, both can be discussed. He was explaining how he learns what a candidate knows, not promising every interviewer follows that method.

### Practice writing and sharing

Asked how he improved his writing, Fan began with anxiety rather than a formula. He worried about career risk, sought abilities beyond his immediate work, and admitted that finding it difficult to relax was not a healthy pattern to copy. The transferable part was his way of turning a goal into a path: avoid an impossibly large first milestone, work backwards into achievable stages, and find feedback that helps him continue.

His early articles lacked focus and structure, he said. Repeated writing helped him notice that. When producing his short technical book, he actively sought an editor's guidance on organization and expression. Advice and writing techniques helped, but only drafting and revising exposed what needed to change. He summarized his method as a clear aim, executable steps, encouraging feedback, and continued practice.

### Competition, personal choice, and technical depth

The host described Fan as someone who worked exceptionally hard and asked how to escape the industry's competition. Fan replied that he had not escaped it himself. If an engineer is only being pushed by company tasks or other people's advice, adding more study hours may not solve the problem. First ask whether this is a direction one really wants. There are meaningful pursuits outside technology as well.

For someone who chooses to continue, he recommended building a deep capability. Broad exposure is valuable once there is a foundation, but switching from one new technology to another without substantial understanding can leave everything shallow. Finishing a genuinely complex task develops technical understanding, judgment, and confidence; broader exploration can then rest on that base. His reading of Webpack was an example, not the one task everyone must undertake.

### Learning under intense work demands

The host asked how Fan could produce technical material while working roughly “996” hours. His first distinction was between whether a problem must be solved and whether he must be the person to solve it. A question may be better answered by a colleague who knows the area; a routine task may belong with another role. Sharing work appropriately leaves room to think about what truly blocks the team.

In that remaining time, he looked for a painful team problem that had enough technical depth and enough benefit to justify sustained work. Solving it could improve the business and his own capability; the result might later become a tool or article. Work outside office hours was another part of his personal routine. He sometimes returned home late, walked his dog, and continued studying; while under pressure to finish the book, he even wrote on the subway. He repeatedly acknowledged that his tense mental state was unhealthy and should not be copied as a formula for output. Choosing valuable work, reducing unnecessary interruption, and recording research that arises from real tasks are practices that can be adjusted to a person's available time and energy. The host added that delegation is a way to assign work appropriately, not evade responsibility.

### Building a learning culture in a team

The host began at company level. Fan mentioned technology newsletters, public accounts, live discussions, and internal exchanges, then shifted to the small team he could influence directly. He described regular technical sharing, asking whether the content had depth, and agreeing on a direction worth learning over the next month or two. An article or talk was a way to check understanding, not the ultimate goal.

He also paired people with similar abilities or complementary experience to study and produce work together. Early on this required active encouragement. Over time he wanted members to develop a sense of what to learn next themselves. He had seen capable colleagues grow comfortable with daily work but leave because they could not see a path forward. A learning direction could give them a new challenge and help the team solve a real problem. Output counts alone would not establish mastery, and these were practices in his team rather than a uniform ByteDance policy.

### What he looked for in candidates and colleagues

Asked what mattered beyond technical skills, Fan admitted that a short interview reveals little about every aspect of a person's character. He watched whether a candidate understood the question and could explain their reasoning in an orderly way. An initially wrong answer can lead to a useful discussion; fragmented statements that never show the logic make understanding harder. This concerns organized communication, not simply being extroverted.

After someone joined, his attention moved to actual delivery. Given the goal and background, would they think of ways to improve the result rather than stop the moment they met the minimum requirement? Further responsibility may also require communicating with people outside one technical function and coordinating across roles. None of this requires everyone to abandon technical depth for an identical management path.

### Plans for what came next

Fan said there was an important work problem in a field he knew well that affected the business, but its specifics were not appropriate to discuss publicly. He wanted to continue making progress on it, keep a moderate level of community writing and occasional sharing, and build a stronger team. When the host asked for more detail, he shifted to his general method: name a career aim, reason backwards about the necessary projects and abilities, set milestones, and execute. He did not describe an unfinished project as a completed result. Community activity was another line of growth, not a replacement for the core problem at work.

The [episode 11 page](/articles/tchat-11/) links to both full videos and their segments.
