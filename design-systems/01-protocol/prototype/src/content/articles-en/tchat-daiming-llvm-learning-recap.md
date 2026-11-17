---
title: "Dai Ming on LLVM and Lifelong Learning: From Engineering Optimization to Drawing and Sharing"
summary: A recap of both recordings from T Chat episode 6 in 2022, covering dead-code analysis, LLVM IR and passes, faster development feedback, and Dai Ming's views on learning, technical communication, drawing, team culture, and career direction.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 25
author: editorial-team
topics:
  - LLVM
  - Mobile Development
  - Engineering
  - Career Growth
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-6
cover: /images/talks/tchat-6.jpeg
coverAlt: Dai Ming discusses LLVM and personal growth in T Chat episode 6
citations:
  - label: Dai Ming's technical talk on LLVM
    url: https://www.bilibili.com/video/BV18T411g7HC
  - label: Dai Ming's conversation on a multidisciplinary career
    url: https://www.bilibili.com/video/BV1Sf4y1d7W2
  - label: Clang SanitizerCoverage documentation
    url: https://clang.llvm.org/docs/SanitizerCoverage.html
  - label: Clang source-based code coverage documentation
    url: https://clang.llvm.org/docs/SourceBasedCodeCoverage.html
  - label: LLVM IR language reference
    url: https://llvm.org/docs/LangRef.html
  - label: LLVM pass-writing documentation
    url: https://llvm.org/docs/WritingAnLLVMNewPMPass.html
tldr:
  - "Long-lived apps need another look at the code they carry: Dai opened with two questions: How can a mobile project that has grown for years be optimized, and how can developers remain productive as the project expands?"
  - "Shortening feedback: From code injection to IR execution: The second half of the talk turned to development speed."
  - "Future interests still centered on tools and underlying systems: Dai described a desktop tool for publishing sites and subscriptions locally, together with his interest in IPFS and decentralized technology."
faq: []
featured: false
draft: false
translationOf: tchat-daiming-llvm-learning-recap
translationStatus: reviewed
seo:
  title: Dai Ming on LLVM, Engineering Optimization and Learning | T Chat
  description: A recap of Dai Ming's 2022 T Chat LLVM presentation and conversation about dead-code analysis, IR, passes, developer feedback, drawing, and technical sharing.
  noindex: false
---

> These videos were published in 2022. Technical conditions, personal circumstances, and opinions described here reflect that time.

How does a technical talk that starts with removing unused code arrive at drawing and continuous learning? In T Chat episode 6, published in July 2022, Dai Ming gave a connected answer: improving successive solutions to one problem forces an engineer into new fields of knowledge; drawing an explanation and sharing it with others reveals what the engineer has not yet understood.

The first recording runs for about 33 minutes. It moves from the optimization needs of a large mobile codebase through LLVM intermediate representation, passes, and development feedback speed. The second, about 57 minutes long, covers his work at Kuaishou, earlier experiences, the relationship between drawing and programming, team choices, and the technologies he wanted to explore next.

## Technical talk: Why look for optimizations in the compilation process?

### Long-lived apps need another look at the code they carry

Dai opened with two questions: How can a mobile project that has grown for years be optimized, and how can developers remain productive as the project expands? An old codebase may retain features and code that nobody needs. Because the client is delivered to users' devices, those leftovers can also remain in the installed package. Cleaning them up therefore concerns both maintainability and the resources consumed on a user's phone.

He chose unused code as his starting point and compared what could be learned at several observation points. His progression was to inspect compiled output, examine source structure, observe what actually runs, and finally ask whether the compiler could produce exactly the evidence his team needed.

The mobile context makes the first question tangible. Code left unused on a server generally does not have to be downloaded and installed by every user, while an obsolete mobile feature may still travel in every app package. Dai also related cleanup to launch time and memory use, without claiming a universal conversion from lines removed to resources saved. Before deciding what to delete, one must know what the available evidence actually shows.

### References in a binary are not the whole runtime story

The first approach starts with the build product. Dai described combining linker results with Objective-C reference information and comparing the set of methods with the set that appears to be referenced. The difference might reveal code worth investigating.

Objective-C can also invoke methods at runtime, however. Selectors, strings, and framework callbacks may lead to a method that a simple static-reference comparison misses. Such an analysis is better at producing candidates for review than certifying that every unrecognized method can be deleted. Not finding evidence at one observation point is different from proving that the program will never call the method.

He reconstructed an early workflow: obtain a list of methods from the link map, extract Objective-C call relationships from the binary, and subtract one set from the other. The subtraction is easy to implement but can miss calls whose target is determined at runtime. Conversely, a static reference does not prove that a user ever takes that path. This splits the word “unused” into two questions: Can the code potentially be called, and was it actually called during execution?

### Return to source to understand how calls are written

To supplement binary inspection, Dai turned to the compiler front end. Using Clang and its syntax structures, he explained how an analysis tool can traverse nodes, recognize certain forms of calls, and inspect their arguments. Source retains information about the expression that the final binary may no longer present in the same way.

His examples included `performSelector`, event handlers, and timers. The point was to design a rule for each kind of invocation, rather than expect one scan to capture all dynamic behavior. The tool can narrow a search, but source analysis is still static and cannot replace runtime verification.

He showed the front-end plugin's job more concretely: traverse call nodes in the abstract syntax tree, identify a use of `performSelector`, and read its argument to find a selector that a binary reference table might not reveal. Strings may also take part in method lookup for events, timers, and key-value mechanisms. The rules must therefore grow with the invocation mechanisms under examination. A single syntax-tree pass is not a complete list of dynamic calls.

### From “could be called” to “was observed running”

Even if source contains a call, real users may never reach it. Dai moved to dynamic evidence. A page event can show that someone visited a page, but is too coarse to say which method ran inside it. Class initialization can show that a class was used, yet tells little about the individual methods of a very large class.

Code coverage supplies finer evidence. Dai described using build options to generate execution data and accompanying tools to turn that data into a report. Such a report describes what ran during a particular test or execution period, at the cost of collecting, building, and processing the data. The granularity needs to match the question being asked.

An uncovered method in one test, or even in a group of sampled users, is not by itself safe to remove. The samples, entry points, and rare use cases must still be checked. Dai compared the choices explicitly: page events are too broad, class initialization still leaves uncertainty about methods, and line-level coverage gathers far more detail than he needed merely to know whether a method ran. Offline coverage reports and online observation also pose different questions about instrumentation size, build time, and runtime overhead.

### Instrumentation is a choice about where to observe

Dai then introduced the coverage feedback and instrumentation used in fuzzing. Calls inserted at function, basic-block, or control-flow-edge positions can record execution. He surveyed several tool paths, but his engineering question was narrower: Could he observe function execution at an appropriate granularity without paying to record everything else?

Two mechanisms should not be conflated. Clang's source-based coverage and SanitizerCoverage are distinct. SanitizerCoverage can insert calls to a user-provided callback at selected functions, blocks, or edges; it is inaccurate to describe all code coverage as a fuzzing implementation or assume identical overhead for every technique. See the [source-based coverage documentation](https://clang.llvm.org/docs/SourceBasedCodeCoverage.html) and [SanitizerCoverage documentation](https://clang.llvm.org/docs/SanitizerCoverage.html).

With a callback, the program can record a function's identity, the order in which functions appear, or call counts when an instrumented location executes. SanitizerCoverage allows different positions and scope controls. In Dai's project, however, compilation still seemed too slow, and he wanted to reduce the inserted instructions further. That concrete concern led him toward a custom LLVM pass. It was a decision about his workload, not a claim that the existing mechanism was unsuitable for every project.

### LLVM IR is a working layer between source and machine code

Before explaining a pass, Dai introduced LLVM IR as an intermediate representation in the compilation pipeline. It gives a developer a place to analyze or change a program after it has left its original source syntax but before target-code generation finishes.

He organized it as modules, functions, basic blocks, and instructions. A module contains functions and global information. A function's body contains basic blocks; instructions sit in those blocks, whose connections form control flow. In his diagram, a block has a label that another block can jump to. The instructions load, store, compute, and eventually branch or return. Loops and conditions no longer look like their original source syntax, but their control-flow relationships remain visible. This structure tells us exactly where a pass that inserts a call needs to operate.

Objective-C runtime behavior provided another analogy: features of a high-level language have corresponding lower-level implementations. IR does not preserve every source-level meaning as an abstract syntax tree would, and it is not machine code ready to run directly on a processor. Specific instructions should be checked against the [LLVM IR reference](https://llvm.org/docs/LangRef.html) for the toolchain in use.

### How a pass enters the compilation pipeline

Dai described a pass as a unit of analysis or transformation that can join the compiler's pipeline. Analysis collects information; a transformation may alter IR, for example by adding a call to a logging function. He discussed implementation in C++, the C interface, and the extra work involved in language wrappers. Interface and version choices matter.

Passes are not completely unrelated units. They can be arranged in a pipeline, and management mechanisms coordinate ordering, analyses, and callbacks. Dai referred to Pass Manager, the execution entry point, and callbacks before and after a pass to show how one processing step is invoked without asking application code to manage the whole sequence.

He compared compiling a processing step into a tool with loading it from a dynamic library, and suggested looking at LLVM's own examples. The official [pass-writing documentation](https://llvm.org/docs/WritingAnLLVMNewPMPass.html) also distinguishes analysis from transformation and describes plugin interfaces. Concrete class names and build flags must be checked for the LLVM version being used. Dai described the C interface as relatively stable and a Swift wrapper as additional work; those were implementation-cost observations at the time.

### Inserting one recording function into the target program

The example returned to the initial goal: determine whether selected functions execute. Dai's approach was to locate or declare a recording function in a module, visit the relevant functions and blocks, and insert a call at a chosen position. The logging behavior would then be part of the built program, without manually adding a log statement to every business function.

The demonstration went in sequence: find the recording function through the module and compilation context; traverse functions and basic blocks; obtain an insertion point near the block's entry; and generate a call. This gives the generated program evidence at the chosen locations while leaving business source free of those individual logging calls. It also makes the scope, location, and content of the instrumentation configurable, at the cost of moving responsibility into build tooling. The compact instruction count in a demonstration cannot be treated as fixed overhead for all projects. Any attempt to use these observations to delete code still requires checking build configurations and usage scenarios.

Dai then discussed integrating the custom processing step with an Xcode build, including toolchain and option choices. A real project would still need to verify the resulting binary, debugging workflow, and runtime behavior. One demonstration does not establish that the technique is suitable for every production app.

### Shortening feedback: From code injection to IR execution

The second half of the talk turned to development speed. The desired experience is to edit code and see the effect quickly, rather than wait for an entire large project to rebuild. Dai contrasted interpreted scripting with code injection in native development. An auxiliary process can watch files, compile changed code into a dynamic library, load it into a running app, and replace the implementation that receives future calls.

The apparent instant update still includes compilation, loading, and symbol replacement. He mentioned `dyld` interposition and SwiftUI Preview to explain parts of the mechanism. Existing instance state, code integration, and new framework support constrain what an injection tool can update. A method usable during development does not automatically become a permissible production update mechanism.

He then proposed exploring the IR layer. Auxiliary behavior could be inserted during an intermediate compilation stage without placing it in business source, and the resulting representation could be interpreted. He found features such as static single assignment appealing for this research: each assignment gets a new name, and the representation does not directly manage a target machine's limited physical registers. He described generating bitcode for files, linking modules, reading and parsing them, and passing them to an interpreter. That interpreter would still need integration and adaptation by the team.

In 2022 this was an exploration, not a generally verified hot-update product. Whether a resulting build could be released, including any App Store review questions, would require assessment of the actual artifact and applicable rules.

## The conversation: One problem can open up many fields

### Work direction and long-term returns

The host began with two audience questions from the technical session. Asked whether a new iOS developer should learn Objective-C or Swift, Dai chose Swift in the context of Apple's development direction at the time. Asked whether an app built with a self-compiled LLVM toolchain was guaranteed to pass App Store review, he made no guarantee. The toolchain could first be useful for offline analysis; the eventual submission build would need to follow its own requirements. Being able to experiment with compilation is not proof that a release path has been validated.

Describing his work at Kuaishou, Dai named three areas: iPad adaptation, introducing Swift into an existing project, and long-term research into compilation. iPad adaptation may look like a UI task, but in an old project hand-built layouts and window management can be difficult. He had also just joined, did not know the people or codebase well, and worked with several teammates who were similarly new to the project. Parts already using automatic layout were somewhat easier. He suggested declarative UI might make future adaptation simpler, without claiming it would erase the old project's problems.

On Swift, Dai valued language and tooling support that lets developers catch certain errors earlier than in Objective-C, as well as the way code is expressed and maintained. That does not mean a new language removes every memory or runtime issue. He described his role as continuing to be a strong technical specialist and pursuing work with durable benefits.

### Knowledge from different experiences connects later

Asked about his path, Dai began with jobs he took while studying. He frankly recalled not fully understanding Cookies, Sessions, GET, or POST when he first accepted some work. He searched for examples matching the requirements and learned as he built. He worked with web technologies, Flash, and a Delphi-related database project. A startup later gave him development, product, design, and management responsibilities, but its small user base offered fewer occasions to dig deeply into large-scale performance and stability. A subsequent work environment involved both server and frontend work, including the challenge of supporting older browsers.

When he reached a product with many users, real feedback and faults arrived much more frequently. He felt greater technical pressure and faster growth. Earlier server, web, scripting, and client experience still helped him understand later problems. The host summarized this as evidence that growth need not come early; Dai immediately said he did not consider himself someone who had already “made it.” His point was that different stages expose an engineer to different problems, not that he had followed a perfectly planned route.

### Detours are useful only when the solution keeps improving

Dai named three connected influences on his growth: learning from detours, iterating solutions to the same problem, and recording and sharing what he learned. His example of an early complex list was specific. He assigned different states to different kinds of cells, then found that content became mixed when the list scrolled and cells were reused. After many attempts, including changes in more than one callback, the symptom finally settled. The difficulty motivated him to learn the cell lifecycle and reuse mechanism. It was an account of what past detours taught him, not advice to repeat avoidable errors deliberately; making a symptom disappear was not the same as understanding its cause.

Nor are detours enough by themselves. Package-size optimization was a problem he returned to in different companies. When one technique had already been adopted, further progress required another observation point: compiled output, the compiler front end, the linker, and finally IR instrumentation. The question remained similar, while a better solution drew him into more of the toolchain.

### If an explanation fails, the understanding may still be incomplete

To investigate, Dai read books and documents, saved useful material, then tried to explain his findings. He recalled sharing an open-source-library practice with his team for the first time and discovering mid-talk that he had not organized the relationships clearly even for himself. Repeating the talk and redrawing the diagrams gradually made his explanation more precise. A room of two or three attentive people was enough: questions about why a step followed another, or what a diagram's colors meant, exposed missing details. The host connected the pattern back to experience, deeper solutions, and recorded sharing. “Output” did not stand apart from practice.

He also tried to make material retrievable. A macOS tool built with Swift concurrency brought together technical links, books, websites, manuals, and a map of iOS development knowledge. When programming, he would rather consult a manual than pretend to remember every language detail. He followed developers whose work he respected to notice what they were exploring, then used those leads to find material relevant to his own questions. None of these channels was presented as the single required learning route.

### Drawing became part of technical explanation

The host called him a multidisciplinary creator and asked how he combined engineering with drawing. Dai began with trade-offs: he devoted substantial time to those two interests and therefore spent less on others. In the days before a talk he had promised, he might temporarily reduce new input and focus on finishing it. He described this as a short-term method, not a rule to stop reading or listening indefinitely. Asked how long a slide took to draw, he said one illustration once occupied him for days. With practice, composing it mentally still took thought, but drawing it became faster.

The connection between drawing and engineering arose from a particular problem. An early auto-layout crash in a system version needed an explanation for a large team that might otherwise stop using the technique. Dai searched through extensive material and eventually understood the issue, but could not easily explain its cyclic relationship in words. He sketched it on paper, then drew it step by step on a whiteboard while presenting. The audience could follow each relationship and interrupt with questions. He began using diagrams more often and also associated images with abstract information when memorizing, even trying drawings for English vocabulary.

### Team culture appears in conversations and work

Asked about Kuaishou's culture, Dai described giving two technical talks there before joining. Many people attended the first; questions at the second even exceeded what he expected. That gave him a concrete sense of the team's interest in technical discussion. After joining, he helped organize client engineering material and observed work on startup optimization, performance diagnosis, and open source. These were his experiences of particular colleagues in 2022, not a uniform evaluation of an entire company.

On hiring, he distinguished students from experienced candidates. For students, learning ability mattered greatly, based on his experience interviewing and mentoring graduates. For someone with work experience, foundational and technical ability also needed to be considered alongside collaboration and fit with the team. The recruitment information mentioned in the video was time-sensitive. When the host asked what mattered in choosing an employer, Dai added whether he agreed with the company's direction. Technical interests, team relationships, and business direction all informed his choice.

### Being skilled does not end uncertainty

Asked about difficulty, Dai chose a drawing question that had lasted for years: Why could a picture still feel unattractive after he learned something about line, color, light, and structure? He tried each element in turn, even contrast, and looked closely at art he admired, asking why the artist had chosen a particular shape or color. The intensity sometimes disrupted eating and sleep; he did not present that strain as a desirable habit.

Later, a book's idea about order amid disorder connected his scattered observations. When he returned to film compositions, lighting, and costume, he noticed more of what made an image work for him. The host emphasized learning from experienced people; Dai added that, without his long attempts, the same short proposition might have remained just a memorable sentence. This was a personal account of learning to see, not a universal formula for beauty.

### Future interests still centered on tools and underlying systems

Dai described a desktop tool for publishing sites and subscriptions locally, together with his interest in IPFS and decentralized technology. These sparked speculation about more capabilities returning to user devices. The host clarified that “client” in this conversation meant a broad kind of endpoint computing, including tools, execution environments, and system capabilities, rather than only writing an app interface. Content in a decentralized system still requires availability, maintenance, and governance; the discussion did not establish that servers would disappear or guarantee any class of jobs.

Closer to daily engineering, Dai wanted results from compilation and performance analysis to appear naturally in the editor developers already use, with less switching to separate web dashboards. That connects the first half's compilation analysis and shorter feedback loops to an entire development experience. He was also interested in emulators and virtual machines, including how older games can run in new environments. At the time he expected to keep working around the Apple ecosystem, whose languages, tools, clients, and products intersected with those interests, while leaving room for a better environment in the future.

The [episode 6 page](/articles/tchat-6/) links to both full videos and their segments.
