---
title: "Wang Yu on a Custom Rendering Engine: Packaging a Graphics Pipeline as a Client Component"
summary: "Starting from a local need for interactive curves and animation, Wang Yu reviews coordinate transformations, the rendering pipeline, and graphics APIs, then builds toward a lightweight engine organized around frame requests, a rendering view, and extensible drawing commands."
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 16
author: editorial-team
topics: [iOS, Computer graphics, Rendering engines, Client development]
relatedEvents: []
relatedRecordings: [shanghai-mobile-practices]
cover: /images/default-cover.svg
coverAlt: Generic cover for a historical T Salon Shanghai mobile talk; it is not a photograph of the speaker or event
citations:
  - label: Building and Applying a Custom Rendering Engine in a Client App — Wang Yu
    url: https://www.bilibili.com/video/BV1cP4y137bk?p=1
  - label: Apple OpenGL ES Programming Guide — About OpenGL ES
    url: https://developer.apple.com/library/archive/documentation/3DDrawing/Conceptual/OpenGLES_ProgrammingGuide/Introduction/Introduction.html
tldr:
  - "When does building an engine make sense?: Wang begins by acknowledging that UIKit and other ordinary components cover most interactions."
  - "A frame, from input to display: Wang first lists the familiar loop: update the camera, update scene elements and other state, render, and present."
  - "An application: from gestures and configuration to drawing: The final complete example is a tracing interaction for children."
faq: []
featured: false
draft: false
translationOf: shanghai-wang-yu-rendering-engine-recap
translationStatus: reviewed
seo:
  title: "Wang Yu on a Lightweight Client Rendering Engine"
  description: "From graphics fundamentals to frame queues and drawing commands, Wang Yu explains a rendering component for interactive client interfaces."
  noindex: false
---

Wang Yu does not begin with an ambition to build an all-purpose rendering engine. His question is narrower: when most of a client app uses ordinary UI components but one area needs frequent drawing, interactive curves, or a distinctive animation, how can the team support that area without reshaping the whole app around a new UI stack?

> This recording is from T Salon Shanghai's mobile technology practice series. The article associated with the video was published on March 13, 2022; the event date has not been confirmed. Its iOS and OpenGL ES choices belong to that technical period and are not, by themselves, advice for a new project today.

## When does building an engine make sense?

Wang begins by acknowledging that UIKit and other ordinary components cover most interactions. Established GUI and graphics solutions also exist for unusual screens. The reason to build something in-house must therefore be a local need that available approaches do not meet conveniently, not just the fact that drawing can be done with custom code.

He offers four conditions to examine together: the custom area is only part of an otherwise native screen; base components do not express it well; interaction places substantial demands on drawing speed; and the business logic inside the drawing component is relatively simple. A curve that reacts to a gesture illustrates the problem. The goal is to update the curve with input and embed the result in an ordinary page. Bringing in a complete UI engine for one drawing area could mean a disproportionate amount of code and integration work. Conversely, a static curve might already be handled adequately by system drawing APIs. The interaction and continuous animation requirements are what justify a deeper assessment.

Performance must still be measured. The motivation comes from a particular implementation, not from a general rule that system drawing is all CPU-bound or that self-written GPU code will always be faster. Bottlenecks, maintenance, and integration costs all affect whether the engine is worthwhile.

## First foundation: getting an object onto the screen

Wang spends much of the talk rebuilding the graphics knowledge needed to understand his abstraction. He begins with Model, View, and Projection transforms. The model transform places an object in a world; the view transform describes the observer's position and direction; and projection determines how that scene maps toward a displayable result.

He moves a sphere and cube through object coordinates, world coordinates, and viewing coordinates in a diagram. Placing the cube in the world and moving the observer are different operations, even if either can change the final picture. Perspective projection produces familiar near-large, far-small effects; orthographic projection serves another kind of spatial presentation. The illustration also explains why a general 3D API might represent scenes, cameras, and renderers separately. These transforms are stages in an imaging process; multiplying matrices alone is not the entire mapping to screen pixels.

Next comes the rasterization pipeline. Vertex positions, colors, texture coordinates, and texture data enter the process; geometry is assembled, rasterized into fragments, and processed into output. Relevant tests and blending take place before data reaches a target buffer. Wang follows the flow from vertex input through primitive assembly and rasterization to fragment processing. A vertex shader affects how vertices participate in the eventual image, while a fragment shader computes fragment output. Texture coordinates say where to sample and texture data provides the content. Explaining these programmable points keeps “shader” from becoming a black box for adding effects.

## Second foundation: joining data, programs, and an output target

Using a WebGL-style diagram, Wang explains that a draw requires a context to hold relevant state. One branch prepares geometry, color, texture coordinates, and textures; another creates, compiles, and links the vertex and fragment shaders into a program. Only after the data and program are connected does a draw call produce output. The target may be a buffer for display, or an image that another processing step will consume.

This separation between preparing data, preparing a program, executing a draw, and presenting its result becomes the basis for the engine's interfaces. It also explains the later roles of Surface and Command: repeated setup and output ownership should not be mixed into every changing drawing operation.

## API abstraction: what is in the scene, and how is it viewed?

Wang uses a familiar 3D API example to show what higher-level objects buy a developer. First create a scene, camera, and renderer. A cube's geometry describes its shape and a material describes its surface; together they make a mesh. Add that mesh and several lights to the scene. An animation function changes the cube's pose a little on each update, then asks the renderer to draw the current scene from the camera's viewpoint.

The point is to show how an API can collect low-level graphics calls into usable concepts. It is not a requirement that a small local engine reproduce a complete 3D class hierarchy. On the contrary, Wang sees that his primarily two-dimensional area does not need the full set of lights, a movable perspective camera, and 3D scene objects.

He narrows the objective to three requirements: performance and size appropriate to a local component, easy integration as a normal view in the existing project, and places to extend drawing for different scenes. Defining the target first gives the team a way to judge whether added code actually earns its keep.

## A frame, from input to display

Wang first lists the familiar loop: update the camera, update scene elements and other state, render, and present. Then he draws the execution path for his own component. UI interaction produces input data; the UI side packages it as a frame request. A rendering side consumes that request, prepares drawing commands, programs, and data, executes the work, and makes the result visible in a view. Business input no longer has to manipulate every low-level graphics call.

He describes the handoff as a producer-consumer arrangement. Frame requests enter a queue, and the rendering side takes them at its own pace. A queue gives the two sides a defined synchronization point and can absorb a short difference in speed. It cannot guarantee that no frame will ever be dropped: if rendering remains slower than incoming input, requests accumulate. Queue length, what happens to stale requests, display timing, frame time, and memory use all matter to the promised performance. His “GPU thread” means an application-side execution role that submits rendering work, not a hardware GPU unit.

## Thread, Event Loop, and Task Runner

Wang pauses to distinguish three ideas that are easy to conflate. A thread provides an execution carrier. An event loop repeatedly receives and processes work. A Task Runner provides an interface for submitting tasks to an execution path. That separation lets logic and drawing have appropriate task submission points without making every caller manage an OS thread directly.

But a small, intermittently active drawing component does not necessarily warrant two permanently dedicated threads. On iOS, Wang considers letting the main queue handle the UI-side logic and a serial queue arrange rendering work, using existing scheduling resources. Queue, thread, and Run Loop are not interchangeable. Moving work to a GCD queue does not mean that a display operation still gets the same implicit transaction commit timing it had on another execution path.

He calls out a Core Animation transaction issue: some commit behavior is tied to a Run Loop cycle. When rendering tasks use a different queue, the implementation has to inspect transaction boundaries and whether explicit submission is required for the result to reach the rendering service. Completing a task on another execution path is not the same as seeing its output on screen. This is an integration detail to verify in the concrete system, not a universal one-call fix for asynchronous drawing.

## A view for output, a Command for extension

Wang works backward from the display in his OpenGL ES example. The output is associated with a `CAEAGLLayer`; the implementation creates a framebuffer, attaches a color renderbuffer, and, if the scene needs depth information, adds the relevant attachment. Storage must be allocated and bound to the intended output target. After drawing, the buffer is presented. The business developer should ultimately see an ordinary embeddable rendering view, not framebuffer operations scattered across buttons and gesture callbacks.

He reduces the public shape of the engine to a rendering view and a command queue. Surface coordinates the view, underlying display layer, graphics context, and output target. A Command describes one piece of drawing work. This leaves no need to impose a full lighting or movable-camera system on local two-dimensional content.

Commands can cover a single draw, sample changes over time to produce an animation, or form a chain in which one command's output becomes the next one's input. Wang uses a mosaic filter to explain the chain: first generate an image, then feed it to another command with its own shader and output. A one-off draw, time-based animation, and multistep image processing can share the Surface and queue machinery while differing inside the Command. Each Command still has to provide its program, vertices, texture coordinates, textures, and other needed data. The abstraction gives those elements a home; it does not make graphics data disappear.

## An application: from gestures and configuration to drawing

The final complete example is a tracing interaction for children. A user moves a small brush along a stroke; when the stroke is complete, the app presents a dynamic drawing effect. The engine serves a product interaction, not merely a demonstration that it can render a shape.

Wang divides the path into gesture sampling, a path or stroke description, client-side rules, and rendering. Sample points from the gesture help identify movement along the intended path. The stroke becomes descriptive configuration; client logic decides when the interaction is complete, and drawing commands produce the line and animation. Wang passes quickly over the actual stroke algorithm and does not provide reproducible interpolation or shader code. The reusable idea is the explicit boundary between input, product logic, and rendering.

He also begins to discuss integrating a skeletal-animation runtime and mentions an atlas. The available recording ends in the middle of that section, before the remainder of the implementation or the planned questions and answers. It does not support a fuller account of that integration.

The talk's lasting lesson is how a local requirement leads to a deliberately small set of abstractions. Its particular API choice has a historical boundary: Apple deprecated OpenGL ES starting with iOS 12 and directs developers toward Metal. The old implementation is still useful for understanding the organization of a renderer, while a new project should choose a graphics path supported on its target platforms. [Apple's archived guide](https://developer.apple.com/library/archive/documentation/3DDrawing/Conceptual/OpenGLES_ProgrammingGuide/Introduction/Introduction.html) provides the relevant historical context.
