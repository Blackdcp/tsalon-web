---
title: "Zhang Tao on an Android Coroutine Prototype: JNI Scheduling and the Limits of Suspension"
summary: "Zhang Tao demonstrates an exploratory Android coroutine prototype connecting Java, JNI, and C++, from task queues and state transitions to suspension and resumption, while identifying its callback and I/O limits and clarifying a mistaken comparison with Kotlin coroutines."
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 16
author: editorial-team
topics: [Android, C++, Kotlin, Coroutines]
relatedEvents: []
relatedRecordings: [shanghai-mobile-practices]
cover: /images/default-cover.svg
coverAlt: Generic cover for a historical T Salon Shanghai mobile talk; it is not a photograph of the speaker or event
citations:
  - label: Designing Android Coroutines with C++ — Zhang Tao
    url: https://www.bilibili.com/video/BV1da411b7N8?p=1
  - label: Kotlin Coroutines basics
    url: https://kotlinlang.org/docs/coroutines-basics.html
  - label: Kotlin delay API
    url: https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/delay.html
  - label: Kotlin specification — Asynchronous programming with coroutines
    url: https://kotlinlang.org/spec/asynchronous-programming-with-coroutines.html
  - label: C++ working draft — csetjmp synopsis
    url: https://eel.is/c++draft/csetjmp.syn
tldr:
  - "Why begin with threads?: Zhang uses cooking to introduce concurrency."
  - "Queues and task state: Zhang traces two entry paths."
  - "Audience exchange: how does this compare with Kotlin coroutines?: After describing the prototype's limits, Zhang answers a question about Kotlin."
faq: []
featured: false
draft: false
translationOf: shanghai-zhang-tao-android-coroutines-recap
translationStatus: reviewed
seo:
  title: "Zhang Tao on JNI Scheduling and Android Coroutines"
  description: "Zhang Tao explains a Java, JNI, and C++ coroutine prototype, its suspension limits, and how its behavior differs from Kotlin coroutines."
  noindex: false
---

Zhang Tao's talk asks what it takes to build a coroutine prototype oneself. On which thread does a task run? When does it yield? How does a scheduler find another task, and how can it return to the point where the first one stopped? Those concrete questions, rather than a claim to have built a production-ready coroutine library, drive the demonstration.

> This recording is from T Salon Shanghai's mobile technology practice series. The article associated with the video was published on March 12, 2022; the event date has not been confirmed. The implementation is an exploratory teaching prototype, and claims about Kotlin made during the audience exchange need to be distinguished from Kotlin's documented behavior.

## Why begin with threads?

Zhang uses cooking to introduce concurrency. One cook initially makes one dish at a time. To alternate between two dishes, the cook must remember which ingredients went into the first and where work stopped before switching. Saving that “scene” is his analogy for a context switch. He then connects it to the state maintained for processes and threads and to the cost of scheduling them. The analogy explains the problem; it is not a quantitative comparison of actual process and thread costs.

Starting several tasks is easy, but controlling when they wait, switch, and cooperate takes additional mechanisms. Giving every unit of work a thread does not eliminate waits, scheduling, resource use, or shared-state problems. In his diagram, one task starts file or network I/O and waits. If its execution thread can work on another runnable task during that wait, the waiting time may be put to use. A coroutine supplies a way to organize yielding and later resumption; it does not make a CPU-intensive calculation faster. If the underlying I/O still blocks the carrier thread, naming the task a coroutine will not supply that benefit.

Zhang also values control over a task's sequence and a way to avoid deeply nested callbacks. Concurrency and parallelism remain distinct. Tasks can interleave on one thread, while simultaneous execution requires parallel resources. It is inaccurate to infer that coroutines on a single thread never need state coordination: shared state may have changed while one was suspended. [Kotlin's language specification](https://kotlinlang.org/spec/asynchronous-programming-with-coroutines.html) provides a more precise account of suspension.

## List the operations before implementing them

The prototype aims to start, suspend, and resume a task, wait for another task, and delay execution. Zhang wants a waiting task to make room for other work and a dependent task to express the order it needs.

He divides construction into three stages: create a native thread capable of running tasks; give that thread a scheduler for multiple tasks; then decide how `delay` or `join` can interrupt and resume a running task. The order matters. Merely launching tasks is still just queuing work. Suspension needs a saved resumption point; waiting needs dependency management; completion needs result handling and cleanup. An API named `delay` or `join` does not automatically have the cancellation, exception, and scheduling semantics of a mature library.

## Connecting Java, JNI, and a native thread

The on-screen code starts at Java's `start`, enters a native `startNative` method through JNI, reaches a C++ thread wrapper, and uses a native threading facility to create an execution thread. That thread's `run` ultimately calls back into the Java task method. Zhang lists other interfaces for yielding, sleeping, and interruption, but does not walk through each implementation. The point is to establish a round trip between Java business code and the native scheduler.

The coroutine API sits on this route. He puts the task body in the operation corresponding to `async`, and the eventual result in a separate callback. Compared with Kotlin's `Deferred.await` style, the Java caller still writes an explicit result callback. A new task defaults to the current thread but can be given an existing thread identifier. A map keyed by thread identifier finds the thread that will schedule it. This choice determines which task queue receives the work.

The arrangement shows how the languages can be joined, and immediately reveals a limit: the user-facing syntax still looks like callbacks, not straight-line asynchronous code.

## Queues and task state

Zhang traces two entry paths. During construction, `init` crosses JNI and establishes the native-side scheduling loop. At submission, `async` crosses to the native side and associates the task with its chosen thread, placing it in that thread's queue. The loop repeatedly takes runnable work. A task that has not begun follows the start path; a task waiting to resume follows a recovery path. Task submission is the producer, and the scheduler is the consumer. This explains more than simply saying that the library “starts a thread for tasks.”

The task has stages for initial creation, entering suspension, waiting to resume, resuming, and finishing. Zhang shows numbered states from initial to finished. The intermediate suspend and resume states can cycle as one task stops and starts more than once. Some transitions are brief because they mark the scheduler saving or returning control, not a long-lived queue position. The scheduler needs to distinguish work that has never run from work that must continue, and must eventually release resources when work finishes.

Java expresses the task, JNI provides the cross-language calls, and the native layer maintains threads, queues, and execution order. That division makes the prototype understandable, but the video is not a complete validation of thread safety, exception propagation, resource cleanup, or performance.

## The difficult part is the suspension point

A coroutine cannot necessarily stop on any instruction. It needs a defined suspension boundary and enough information to resume. Zhang enlarges a queue diagram to illustrate his intent: temporarily save a task that needs to pause, take another task from the queue, and later put the first task back where it can resume. The drawing explains scheduling order; it does not establish that timing, fairness, or cancellation edge cases are complete.

His implementation has just one suspension point. The native layer invokes a Java method as a whole. JNI can call that method, but this wrapper alone cannot automatically divide its statements into several independently resumable segments. A call to the prototype's delay operation is meant to record the current work and give another task an opportunity to run, yet the limited boundary constrains where that can happen.

Zhang considers two directions for finer control: insert more notifications from Java code to the native scheduler, or change runtime behavior more deeply. The first would mean many JNI crossings; the second would be highly invasive. He presents neither as an implemented solution. His description sometimes uses “every statement” as shorthand for a more granular suspension boundary. Kotlin's actual mechanism does not require a JVM modification or permit arbitrary suspension after every statement: compiler transformation uses continuations and a state machine around suspendable calls. [The Kotlin specification](https://kotlinlang.org/spec/asynchronous-programming-with-coroutines.html) gives the mechanism.

## Choosing low-level facilities and naming the unfinished work

Zhang surveys language-level and library-level options for saving and switching execution context. He views C++20 coroutines as lower-level facilities for which an application still needs usable scheduling interfaces. He also considers libraries tied to particular instruction sets, worrying that some implementations centered on x86 could not simply be used in his Android target environment. He chooses the `setjmp` / `longjmp` idea largely because it is easy to try in a prototype, not because the talk establishes it as a portable, exception-safe, production recommendation. His comparison does not establish the full Android support of the other libraries.

Nonlocal jumps do not form a complete coroutine system by themselves. In C++, object lifetime and destructors put real constraints on where such jumps may be used. A sketch of “save a place and jump back” must not silently ignore those rules. [The C++ working draft's csetjmp synopsis](https://eel.is/c++draft/csetjmp.syn) is relevant to that boundary.

He ends with three connected gaps. Without compiler or language-level transformation, the Java caller still needs a callback for the result. Without more resumable boundaries, the scheduler cannot split an arbitrary task. Without I/O readiness events integrated into the queue, an ordinary blocking I/O call cannot automatically free the carrier thread for another task. Zhang raises signals as a possible line of exploration, but shows no complete path from starting I/O through suspension, notification, and resumption. These are directions for further work, not delivered features of the prototype.

## Audience exchange: how does this compare with Kotlin coroutines?

After describing the prototype's limits, Zhang answers a question about Kotlin. The comparison is concrete: does a Kotlin coroutine occupy one thread, and must suspending it also stop that thread? His answer treats Kotlin coroutines as a thread-pool wrapper and connects suspension and `delay` to blocking the execution thread. That confuses “a coroutine can run on a thread pool” with “each coroutine owns one thread,” and mixes ordinary blocking I/O with a Kotlin suspending operation. It is not a sound basis for choosing a library or estimating performance.

Kotlin coroutines execute on threads, and a dispatcher determines how their execution is arranged. Multiple coroutines can make progress by alternating on one thread. Suspending a coroutine and blocking a thread are different operations; whether work runs in parallel depends on the dispatcher, available threads, and the work itself. [Kotlin's coroutine basics](https://kotlinlang.org/docs/coroutines-basics.html) explain this distinction.

In particular, `kotlinx.coroutines.delay` suspends without blocking a thread for the wait. It is not equivalent to `Thread.sleep`; the corresponding dispatcher implementation handles timing. [The delay API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/delay.html) states that behavior.

The talk is most useful as a hands-on view of scheduling, task state, and the Java/native boundary. Its incomplete pieces are part of the lesson: moving from “I can switch between tasks” to a usable asynchronous runtime requires explicit answers for suspension, I/O, results, errors, and resource lifetime.
