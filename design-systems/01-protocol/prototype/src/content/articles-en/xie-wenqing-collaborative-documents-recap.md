---
title: "Xie Wenqing on Collaborative Documents, Editing Algorithms, and Frontend Growth"
summary: "Xie Wenqing explains the editor and synchronization challenges behind collaborative documents, compares OT and CRDT approaches, and discusses AI in development, career growth, and team culture in a follow-up interview."
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 38
author: editorial-team
topics: [Frontend, Collaborative Editing, Engineering, Career Growth]
relatedEvents: []
relatedRecordings: [xie-wenqing-collaborative-documents]
cover: /images/default-cover.svg
coverAlt: General cover for Xie Wenqing's T Salon discussion of document editing and collaboration
citations:
  - label: "Xie Wenqing: Exploring Collaborative Document Editing"
    url: https://www.bilibili.com/video/BV1HM4y117Az?p=1
  - label: "One-on-one interview with Xie Wenqing"
    url: https://www.bilibili.com/video/BV1go4y1n72a?p=1
  - label: "Original ot.js implementation"
    url: https://github.com/Operational-Transformation/ot.js
  - label: "Official Yjs documentation"
    url: https://docs.yjs.dev/
  - label: "ByteDance's public culture page"
    url: https://jobs.bytedance.com/experienced/m/culture
tldr:
  - "A text field is not a rich-text editor: input and textarea accept text but cannot directly support rich paragraphs, formatting, tables, and more demanding interactions."
  - "Clients distinguish synchronized state from pending work: Using ot.js, Xie explains three client states: synchronized, awaiting confirmation, and awaiting confirmation with another local operation in a buffer."
  - "Team culture has to appear in daily work: The last interview question concerns “ByteDance Style.” Xie understands it as shared ways of working and describes his experience through six public themes: keeping an entrepreneurial mindset, embracing diversity, communicating candidly and clearly, seeking truth pragmatically, pursuing excellence, and growing together."
faq: []
featured: false
draft: false
translationOf: xie-wenqing-collaborative-documents-recap
translationStatus: reviewed
seo:
  title: "Xie Wenqing on Collaborative Documents | T Salon"
  description: "A detailed recap of document editors, models, live connections, OT server versions and client states, CRDT trade-offs, AI-assisted development, and career growth."
  noindex: false
---

> These two recordings were published in 2023. Technical implementations, personal circumstances, and opinions below reflect that time.

An online document still appears to be a web page. What must it solve, however, to let several people edit the same content smoothly? Xie Wenqing organizes the problem around two lines of work: how an editor understands and displays input, and how a collaboration system reaches a consistent result after concurrent changes.

He had worked at companies and startups of different sizes, in both backend and frontend development, and was on the Feishu Docs team at the time. He gave the presentation inside an online document, reflecting the team's habit of using documents for meetings, discussion, and presentations. A technical talk of about 69 minutes was followed by an interview of about 24 minutes on AI, professional growth, and team culture.

## Making text editable is only a beginning

### A text field is not a rich-text editor

`input` and `textarea` accept text but cannot directly support rich paragraphs, formatting, tables, and more demanding interactions. Xie starts with the browser's editable features: `designMode` makes a whole document editable, while `contenteditable` applies to a selected region.

The region matters. An online document also has navigation, comments, and toolbars; users should not be able to edit the entire page. An early implementation can isolate the editing area in a separate document or iframe, or mark only the relevant element as editable.

Combined with browser editing commands, these features can quickly produce bold, italic, and other basic functions. They are enough to assemble a simple editor, but default browser behavior becomes insufficient when the product needs a stable structure, richer capabilities, and room to grow.

In his staging model, `contenteditable` plus `document.execCommand` is L0. It explains the editor's starting point: the browser handles input, selection, and formatting, and the developer gets a visible result quickly. The more the product relies on those default actions, the more behavior it may eventually need to correct or normalize.

### The same action can produce different DOM trees

Xie uses pressing Enter and then deleting the newline as an example. Seemingly identical actions can produce different combinations of `div`, `br`, and text nodes across browser versions. The user may think the text is back where it started, while the underlying structure has not returned to its original state.

He shows three successive cases. Pressing Enter in an empty `div` produces different `div` and `br` combinations in different browsers. Pressing Enter within an existing line may leave one half as a text node and wrap the other half in a new element, or split the line into two blocks. Deleting that newline can restore the visual line without restoring the original DOM. If the document treats that structure as authoritative, undo, storage, and collaboration all inherit the discrepancy.

Bold formatting poses a similar problem. Browsers may use `b` or `strong` for nearly identical visual output. An editor that trusts whatever structure comes back must continually bridge browser differences, and more advanced features may lie beyond the available commands altogether. The challenge is not finding an API that makes letters look bold; it is defining a document structure that can be understood, modified, and saved reliably.

## From browser behavior to an editor-owned model

### Separate input, model, and rendering

The talk describes L0, L1, and L2 as stages in how much control an editor takes over. This is a way to compare design choices, not a requirement that every product follow the same upgrade path.

The first shift reduces dependence on browser editing commands. An editor can still use some native input, caret, and selection behavior, but it turns the user's actions into changes to its own data model and then renders that model. The meaning of the document no longer depends solely on HTML generated by one browser action.

More concretely, the editor intercepts keyboard and mouse events, determines the intended edit, updates the model, and renders the corresponding interface. The browser may still supply a caret and selection, but `execCommand` output is no longer the sole source of truth. Giving input, model, and rendering separate responsibilities also allows the presentation to change without redefining the document itself.

Xie discusses input that is uncontrolled, partly controlled, or fully controlled; a model that may be a string, an array, or a tree; and rendering based on DOM, SVG, or Canvas. The choice depends on what the product must control and how much implementation complexity it can carry.

### Document models explain why editors behave differently

He compares several designs rather than merely listing library names. Changeset represents text and attributes as content changes. Quill's Delta expresses inserts, deletes, retains, and formatting as a sequence of operations. A sequence of changes can describe a single edit or construct an entire document from an initial state.

Draft.js separates editor state, content state, blocks, and entities. Slate uses nested nodes for the editor, elements, and text. Flat and tree-shaped structures express different kinds of content and shape how changes and rendering are organized. The comparison asks what data an “insert text” action actually changes in each model, and therefore what a collaboration algorithm must later transform.

Xie also notes that a mature product can contain several models because of its evolution and compatibility obligations. To understand a current interface, one may need to understand the design it inherited.

### Greater control brings more responsibilities

At the next stage, an editor manages more of its own layout, caret, and selection behavior to achieve consistent interactions and advanced features. “Less reliance on the browser” does not mean abandoning browser input entirely: a hidden editable element may still capture input while the editor controls what the user sees.

Taking on more control transfers complexity to the implementation. The editor must decide where lines wrap, how the caret moves, how a drag selection crosses blocks, and how interactions stay consistent across browsers and input methods. L2 is therefore not automatically the right choice for every product. The progression explains a relationship between need and cost: reclaim structural control when stable data is essential, and reclaim more layout and interaction behavior when the product demands it.

The talk mentions products that moved from DOM toward Canvas, but does not treat rendering technology as the only test for a stage. The deeper question is which decisions remain with the browser and which belong to the editor's own model and rules.

## Collaboration requires both transport and conflict handling

A conventional rich-text editor mostly handles one person's input. A collaborative document must deliver edits to other users promptly and decide what happens when they edit at the same time. Xie divides the work into data synchronization and conflict handling; neither can substitute for the other.

### A live connection needs failure behavior

The communication layer needs bidirectional, timely messages and dependable operation. Multiple access points, heartbeat messages, and reconnect logic are among the measures he discusses. If a persistent connection cannot work, the system may need a fallback based on other requests so that editing remains usable, even with less immediate synchronization.

Connections have failure paths. Clients can land on different access services, network changes can break an existing connection, and a server needs a way to detect a connection that only appears to remain alive. Heartbeats expose failures; reconnecting restores subscriptions and catches up on state. Short requests can provide a degraded route when a persistent connection is unavailable. Merely choosing WebSocket does not complete collaboration: it moves messages but does not decide how concurrent messages are combined.

### Rooms and channels define the granularity of resources

The communication layer also serves multiple kinds of business data. Xie describes a collaborative entity with channels inside it: a document or workspace can be the larger unit, while online presence, permissions, editing operations, and other messages are distinguished within that unit.

In his example, users subscribe using a document identifier; delivery can be organized around that entity while each channel carries a more specific type of event. If every small feature becomes an independent entity, connection, subscription, and delivery costs rise. If all events share one undifferentiated stream, permissions and business logic become harder to maintain. He compares the grouping to the relationship between a process and its threads to convey the intended level of separation.

## Delivering the same operations may still produce different documents

Xie uses a small example to expose the conflict. Two users see the same starting text and insert a character at the same position. Each sees their own change immediately. If the server forwards both operations unchanged, the two documents can end with different character orders.

The starting text is `12`. User A inserts `A` at the end; B inserts `B` at that same position. Their local views promptly show `12A` and `12B`, as a responsive editor should. But if each then applies the remote insertion using its original position, A can end with `12BA` while B ends with `12AB`. Every message arrived, yet the documents did not converge. What they need to share is a consistent interpretation of the order and position of those concurrent actions.

Deletion, formatting, and document blocks raise related problems. The conflict is not merely whether a message arrives, but what document version it assumes and under what rules it is executed.

Xie connects the problem to consistency in distributed systems. Local input should respond immediately; network delay and temporary disconnection are unavoidable. A system can tolerate briefly different views, provided they converge after changes propagate and are processed, rather than making every keystroke wait for every user. He uses the trade-off between availability and consistency to explain why requiring universal confirmation is unattractive for writing. This describes an editing requirement; a CAP label alone does not determine the actual protocol.

Locking the editor, or making people manually merge conflicts after each change as they might with files, would not fit the expected experience of real-time collaboration. The talk therefore turns to OT and CRDT approaches to see how conflict resolution can be built into operations and data.

## OT: understand operations before transformation

### Basic operations compose into edits

In the text model used for the explanation, an edit can be decomposed into insert, delete, and retain. Retain advances across existing text to the next point of interest; replacement can be a delete followed by an insert.

To turn `123` into `12A3`, for example, an operation can retain the first two characters, insert `A`, and retain what remains. A deletion similarly describes which span to remove rather than sending only the entire resulting text. Decomposing an edit into a few atomic actions makes it possible to define rules for pairs of concurrent actions. Their positions, however, still depend on the document version on which they were created.

An operation sequence describes a move from one version to another. Unlike transmitting only the final text, retaining the action itself gives the system a basis for analyzing two concurrent changes.

### Transformation aims for the same result along either path

Suppose A and B are both based on document version S. After applying A, the original B may need to become B-prime. After applying B, A may need to become A-prime. The goal is:

`apply(apply(S, A), B′) = apply(apply(S, B), A′)`

Xie illustrates the equation as a diamond: two paths start at the same state and meet again after their transformed operations. The equation specifies the desired result; the actual work lies in how a transform function handles all the combinations.

He examines branches in ot.js. Retain versus retain, delete versus delete, insert versus retain, and other pairs have different rules for advancing. Two inserts at the same place require a stable priority rule. Even three basic action types produce several combinations; objects, arrays, blocks, and tables multiply the cases. The equation offers a way to judge correctness, not an automatic implementation of the transform.

### Concurrent inserts need an agreed ordering

His first demonstration tries transformation at the two clients alone. Both A and B insert from the same starting version, and each device naturally treats its own insertion as having happened first. If the transform arguments and tie-breaking rule differ between them, both sides can call a transform function and still diverge.

This motivates the client-server protocol he explores: a central server establishes the order of accepted operations, and clients align their local states with it. A transform function is not enough by itself; version numbers, operation order, and acknowledgments are part of the design. The demonstration explains why this particular protocol needs a shared ordering context, rather than proving that every possible OT design must use one central node.

## Server and clients must transform against a shared context

### The server keeps versions and operation history

Clients attach version information when they submit an operation. The server checks the version on which it was based against the current version. If they match, the operation can enter the history and advance the version. If the client is behind, the server retrieves operations confirmed since that older version, transforms the new operation against them in sequence, and then accepts the transformed result.

The history is not merely an audit log; it is the context that lets a later-arriving operation be repositioned. The source client receives an acknowledgment, and other clients receive a broadcast. What the server broadcasts may already be a transformed operation, so it is not simply a relay.

### Clients distinguish synchronized state from pending work

Using ot.js, Xie explains three client states: synchronized, awaiting confirmation, and awaiting confirmation with another local operation in a buffer. A user does not stop typing because the previous edit is still in transit, so subsequent edits must have somewhere to go.

The first local operation has already changed the screen when it is sent, but the client remains in an awaiting-confirmation state. If the user continues typing, the next operation is buffered rather than pretending the server has caught up. If another user's operation arrives meanwhile, the client must transform it against the sent operation and, when needed, the buffer. An acknowledgment of the client's own edit advances the state and may cause the buffer to be sent; it does not reapply the edit to the screen. These transitions can be compared with the [ot.js client source](https://github.com/Operational-Transformation/ot.js/blob/master/lib/client.js).

### The demonstration follows both messages and local states

The live example can be read as a message chain. A and B both edit locally from version 0 and send operations. The server receives A first, accepts it, acknowledges A, and broadcasts it to B. B's local view already includes B's own change, so it cannot mechanically apply A; it transforms A against its unconfirmed operation. The server next receives B, still marked as based on version 0. Because A is now in the history, it transforms B into a version-aware B-prime, accepts it, and broadcasts it. A applies B-prime; B processes A and its acknowledgment; both settle on the same order.

The demonstration puts A, B, A-prime, and B-prime from the equation back into an actual message flow. A function that passes one algebraic example does not make the whole system correct by itself. Version checks, acknowledgments, buffering, and broadcasts must follow compatible rules, even if messages arrive in a different order.

## Moving from text to document blocks adds operation types

The talk compares ot.js, Etherpad's collaboration implementation, Delta, and JSON-based OT. Their models and API names differ, but each must express operations, deal with concurrency, and work with client state.

JSON OT addresses more than a string of characters. An operation names a path and an action at that path; strings, objects, arrays, and numbers have different operation types. A block-based document may use a structural operation to move or alter a block, while text inside it receives more specialized treatment. Xie says Feishu's approach at the time also combined mechanisms at different levels to handle structural and inline conflicts. The talk does not specify enough to reconstruct its internal implementation, but it shows why treating an entire document as one string position is insufficient.

As the number of operation types grows, so do the combinations the transform rules must cover. Tables, document blocks, and richer business behavior increase the cost of implementing and verifying those rules. In the central-server model he analyzes, server computation and network behavior also affect how many people can collaborate at once. Any particular user limit depends on a product and deployment; it cannot be deduced from the use of OT alone.

## CRDT: handle concurrency through data and merge rules

### Merge rules must account for duplication and reordering

In the CRDT portion, Xie shifts the focus to data-type design. Network messages can be delivered again, and their arrival order may differ from their sending order. Idempotence, commutativity, and associativity help explain why some merge rules tolerate these conditions.

His example starts with three nodes all seeing an inventory count of `100`. One increases it by `10`, another decreases it by `10`, and the third does nothing. If the network sends only the resulting values `110`, `90`, and `100`, the third node cannot tell from those values alone which result to keep. If it receives “add 10” and “subtract 10” instead, either order returns it to `100`. Yet applying the same action twice after a retry is also wrong, so the system needs a way to recognize duplicates, such as an operation identifier. The example shows why the representation of shared information matters; ordinary additions and subtractions alone are not a complete counter CRDT.

Different CRDTs have different prerequisites. Naming a few algebraic properties cannot replace the full conditions and correctness analysis of a specific implementation.

### YATA uses identities, neighbors, and deterministic order

Xie then discusses YATA as an approach to collaborative text. A character or insertion item carries more than its content: it has an identity and a relationship to nearby items. When different users insert near the same place, agreed ordering rules resolve the position rather than relying only on an array index at one moment.

He uses a doubly linked list to explain the relationships. A user identifier and locally increasing count identify an operation. An inserted item refers to left and right neighbors; deletion first leaves a logical marker, with reclamation considered later. Even if replicas do not see the same numeric index at the same time, they can still express an intent to insert between existing items. In his diagram, there are already items between a new item's named endpoints. The question is not simply which numeric index receives a character, but how to order several candidate insertions under shared rules.

He emphasizes **preserving intent**: if an item is specified as lying between two endpoints, the final order must keep it within that interval. Conflicting items also need a deterministic total order so replicas can obtain the same text despite different arrival sequences. He cites conditions and pseudocode from the paper, while acknowledging that he had not worked through its full proof or implementation details in the talk. That limitation matters more than presenting the brief demonstration as a complete correctness proof.

Logical deletion also preserves information needed to process later concurrent operations. Memory reclamation becomes a separate design problem. The key lesson here is why position and identity belong in the model, not that a short diagram covers every edge case.

### Last Write Wins still needs a definition of “last”

He also mentions Last Write Wins for cases such as object fields: when writes conflict, a predefined order based on time and identity can determine which value survives. The outcome is easy to explain, but it may discard a previous value, so suitability depends on the meaning of the field. Timestamp creation and comparison must also be defined consistently across nodes.

This echoes the OT discussion. A strategy name by itself does not specify the result of concurrency; identifiers, ordering, and message handling must work together.

## Choosing a design involves memory, deployment, and product needs

In comparing OT and CRDT approaches, Xie focuses on costs in the product setting he knew at the time. Richer identifiers and history take space; logical deletion and reclamation require design work; and complex documents put pressure on memory, latency, and the editing experience.

His specific concern uses a YATA-like text representation. If each character is a node carrying an identifier and links, and deleted characters remain temporarily as tombstones, a long document needs careful memory management. The Changeset and Delta examples he showed were flatter and could express some text operations more compactly. This is a cost observation about the compared implementations, not a conclusion that every CRDT necessarily consumes more memory than every OT system.

He also asks a product question: is decentralization itself a requirement for an enterprise document? If documents need clear permissions, auditability, and data boundaries, where data is replicated and when it is removed affect the design. He leaves open whether CRDTs are the future of collaboration. This was his judgment for a particular context, not a general claim that CRDTs cannot serve documents or must operate without servers. The [Yjs documentation](https://docs.yjs.dev/) describes different networking and persistence combinations; security and access control depend on the deployment.

He ends by stressing that editing and collaboration are only part of an online document's complexity. Understanding why a design arose and how it addresses real constraints is more useful than memorizing an algorithm's name.

## How might AI enter frontend development?

The interview's first question turns to ChatGPT, which had drawn rapid attention at the time. Xie considers both the development process and software architecture; he does not reduce the subject to code completion.

He starts with a familiar delivery chain: a proposed requirement, design, technical planning, implementation, testing, and release. In the requirements phase, AI might help explain and decompose a request. He uses behavior-driven development as an example. Teams have long hoped to express requirements as use cases that product, development, and test staff can share, but everyone must learn a different descriptive form, which makes adoption hard. If a tool can turn a natural-language request into proposed behavior cases for people to check, it may lower that translation cost. It would not make the product decision on the team's behalf.

He points to opportunities elsewhere in the chain. Image-generation tools of the period suggested assistance with design; Copilot and ChatGPT suggested coding assistance; generating test cases might help teams that struggle to agree on coverage and sustain automated testing. Release work might benefit as well. These were 2023 possibilities, often expressed as “might” or “in an ideal case.” Whether generated code would actually reduce elementary mistakes still required testing.

### Engineers need to define boundaries and interfaces clearly

Xie describes AI at the time as a copilot. An engineer explains the scenario, goal, and constraints, asks the tool to help implement, and reviews the result. His process diagram moves from technical design to an abstraction of the logic, then to a prompt the tool can understand, generated code, and human code review.

The point is not just to hand over typing. Engineers must know what problem and algorithm they are asking about, where one module ends and another begins, and what inputs, outputs, and acceptance conditions apply. An eloquent prompt cannot repair an architectural decision the engineer has not yet made. He expects abstraction, architectural judgment, and review to become more valuable even if a tool writes some code.

### A “prompt layer” was a proposal, with people still responsible

Xie speculates that software architecture might eventually include a prompt layer that needs maintenance, organizing some generated behavior around durable descriptions of intent. He treats it as a possibility rather than an architecture already in operation.

The host asks a more immediate staffing question: if calling a model is cheaper than hiring a developer, does it replace engineers? Xie does not accept the leap to giving the entire job to AI. He sees a more credible role for people who can break down work, use the tool, and check it. The required skills may shift toward abstraction, expression, and review. The host connects this idea to low-code platforms and assembly-line delivery. Both present these as speculative directions, not settled roles or proven processes.

They agree on learning to use new tools while recognizing that unconditional delegation of a whole project is not realistic. The lasting method in their discussion is to look for actual friction in delivery and test where assistance helps, rather than assume one tool can do every stage.

## Frontend growth: learning, technical depth, and business understanding

### Depth and breadth call for different investments

Asked how frontend engineers can grow, Xie puts continuous learning first. At any seniority level, and even after moving toward management, people need to retain the ability to understand new problems.

Technical depth means developing an informed analysis of a particular direction. In the interview, he relates this to hiring: whether a candidate has truly investigated an area can affect the decision to hire. Breadth provides a different judgment. Two engineers may know the same local technique, while one also considers boundary cases, effects on other modules, business constraints, and knowledge from other domains.

His advice to classify knowledge is about allocating time. Choose a main line in which to go deep and build working familiarity elsewhere, instead of investing equally in every new frontend topic and feeling permanently behind.

### Business work is also a source of technical growth

He addresses the feeling that daily feature requests leave no time for technical development. Understanding the business is itself a skill. The same request implemented by two engineers can differ substantially in architecture, boundary handling, quality, and maintainability.

Looking back at work in smaller companies, startups, and larger organizations, he describes extracting technical questions from business work and then pursuing them in depth. “Working on requirements every day” does not mean no technical growth. Treating infrastructure as the only advanced work can obscure the domain rules and engineering decisions inside a feature. From a team or product perspective, the practical question is whether the technology solves a real problem.

The host adds an example from a mobile team. Junior colleagues sometimes preferred infrastructure because feature work seemed to mean drawing UI. He would tell them not to underestimate a business feature: the same requirement in the hands of a beginner and an architect would likely produce very different results. What matters is how they interpret the requirement and handle quality and edge cases.

The host also discusses his own move away from daily programming. He had been learning a language, international teamwork, and management, while insisting on retaining the ability to learn technical material and solve hard problems. They both reject the idea that a manager no longer needs technical judgment when it matters.

## Team culture has to appear in daily work

The last interview question concerns “ByteDance Style.” Xie understands it as shared ways of working and describes his experience through six public themes: keeping an entrepreneurial mindset, embracing diversity, communicating candidly and clearly, seeking truth pragmatically, pursuing excellence, and growing together. The names can be checked against [ByteDance's public culture page](https://jobs.bytedance.com/experienced/m/culture).

For him, an entrepreneurial mindset applies to projects within a company: commit to the work, but allow attempts, validation, and the possibility of failure. Diversity matters when people from different backgrounds collaborate. Candid communication made a particular impression on him. People could bring a question or idea directly to colleagues and, in his experience, across management levels, instead of shaping every statement to please a superior. He adds that making such an aspiration real is difficult.

High standards mean more than shipping a requirement. Two people can both finish a feature, while one also considers quality, cases the product brief omitted, and a better long-term implementation. Seeking truth calls for judgments based on facts; growing together returns to sustained learning so that work builds lasting capability as well as delivering projects.

The host says this way of working sounds appealing to technical people. Xie immediately distinguishes a culture an organization advocates from every individual's and team's actual experience. His personal account cannot stand for every workplace. The interview therefore ends not with a slogan, but with concrete behavior: how colleagues express disagreement, collaborate, and deliver their work.

## Full recordings

- [Technical talk: Exploring Collaborative Document Editing](https://www.bilibili.com/video/BV1HM4y117Az?p=1)
- [One-on-one interview: AI, frontend growth, and team culture](https://www.bilibili.com/video/BV1go4y1n72a?p=1)
