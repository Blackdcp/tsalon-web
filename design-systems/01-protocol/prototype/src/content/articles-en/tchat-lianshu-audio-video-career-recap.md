---
title: "Lian Shu on Audio and Video Fundamentals: From a Small Player to the Whole Problem"
summary: A recap of two T Chat Episode 8 recordings. Lian Shu builds Tiny Player to explain cross-platform engineering, FFmpeg demuxing and decoding, video rendering, audio callbacks, and synchronization, then discusses his startup and UC experience, learning, hiring, and career choices.
type: interview
publishedAt: 2026-09-26
updatedAt: 2026-09-27
readingMinutes: 24
author: editorial-team
topics:
  - Audio and Video
  - Media Players
  - Mobile Development
  - T Chat
relatedEvents: []
relatedTalks:
  - tchat-8
cover: /images/talks/tchat-8.jpeg
coverAlt: Lian Shu discussing media-player development and mobile engineering in T Chat Episode 8
citations:
  - label: Lian Shu's talk, Learning Audio and Video by Building a Player
    url: https://www.bilibili.com/video/BV1bd4y1m73H
  - label: Interview with Lian Shu
    url: https://www.bilibili.com/video/BV19d4y1N7v7
  - label: FFmpeg project and components
    url: https://ffmpeg.org/about.html
  - label: FFmpeg 5.1 send and receive decoding API
    url: https://ffmpeg.org/doxygen/5.1/group__lavc__encdec.html
  - label: FFmpeg audio resampling documentation
    url: https://ffmpeg.org/libswresample.html
  - label: WebRTC project
    url: https://webrtc.org/
tldr:
  - "Start with the full production and playback chain: Lian Shu chose audio and video partly because shooting, playback, streaming, and image processing have many applications."
  - "From programming for fun to a startup and UC: At the beginning of the interview, Lian Shu said his team covered not just short video but also related feed and live-streaming work."
  - "Mobile development and his own future: In his view at the time, people still used phones extensively, so mobile development had not lost all demand merely because new fields were fashionable."
faq: []
featured: false
draft: false
translationOf: tchat-lianshu-audio-video-career-recap
translationStatus: reviewed
seo:
  title: Lian Shu on Media Players and Mobile Engineering | T Chat
  description: Episode 8 covers player architecture, FFmpeg decoding, rendering, audio synchronization, technical learning, hiring, and career decisions.
  noindex: false
---

> These videos were published in 2022. Technical conditions, personal experiences, and opinions below reflect that period.

Lian Shu approached audio and video fundamentals by building a small program that actually runs. In T Chat Episode 8, his Tiny Player takes a media file all the way to the screen and speakers, giving formats, codecs, threads, and synchronization concrete places in one system. At the time he worked on UC's short-video client and was interested in audio and video, functional programming, and on-device intelligence.

After the technical talk, the interview returned to the developer: how interest becomes sustained work, how business problems can build depth, and how to form a judgement when platforms and careers change.

## Technical talk: getting audio and video to the screen and speakers

### Start with the full production and playback chain

Lian Shu chose audio and video partly because shooting, playback, streaming, and image processing have many applications. He also thought their central ideas carry across platforms and tools. Standards and implementations evolve, but compression, formats, rendering, and synchronization remain useful for understanding new tools. He compared changes from OpenGL to Metal to show how knowledge of underlying graphics ideas can transfer.

He used the creation and consumption of a short video to trace the data. The camera captures images; the processing chain converts formats as needed and uses graphics processing for effects such as beautification. One branch supplies the preview, and another goes to the video encoder. Microphone samples undergo audio processing and encoding. A muxer arranges the encoded audio and video into a container such as MP4.

Playback roughly reverses that path. A demuxer separates the streams, decoders turn them into frames and samples, a renderer displays the picture, and an audio device produces sound. The player must also keep those outputs aligned in time. The YUV-to-RGB conversion in the demonstration belongs to its chosen rendering path; it does not mean every device must make an identical conversion in memory.

The selfie example makes each branch visible. The photographer needs the processed camera image on screen to see the shot, while another copy goes to encoding. Encoded microphone audio then joins encoded video at the muxer. The two should be interleaved according to playback order. If the first half of a file were all video and the second half all audio, a player would have to keep seeking between distant parts of the file. Muxing is more than adding a `.mp4` extension.

### Containers, codecs, and raw data are separate layers

Several terms need separating before the player makes sense. A container specifies how media is arranged in a file. A codec defines how sound or images are compressed and recovered. Decoded, raw data has its own sample or pixel format. An MP4 extension alone does not tell us which audio and video codecs are inside.

The talk mentioned H.264, H.265, VP8, and VP9 for video, and AAC for audio. Raw audio can be represented as PCM; images can use RGB or YUV families of formats. Memory ordering, components, and sampling subdivide these further. Much media engineering consists of converting correctly among formats and handling real input at the boundaries.

### Build the cross-platform project before the player

The demonstration had three goals: create a cross-platform project, implement a minimal player, and run it on iOS. The shared core uses C++, with platform-specific parts implemented separately. Android was a possible future port, not a completed version shown in the talk.

Platform separation can be done in several ways. Conditional compilation is direct, but extensive use can scatter platform decisions throughout shared code. Lian Shu chose abstract interfaces with platform implementations. The directory structure likewise separated core source, platform source, libraries, examples, and build outputs.

In his organization, `Core` holds a pointer to an abstract interface, while each platform supplies its implementation under `Platform`. Objective-C++ can bridge the iOS implementation to system views and audio APIs. An Android implementation would have a clear place to attach later. Build configuration may still need conditions, but every player operation need not contain a platform switch.

The target platform also determines the toolchain. Producing iOS code on a Mac requires the appropriate SDK, architecture, and cross-compilation settings; it differs from compiling a program only for the current machine. He used CMake to organize the project and mentioned other build tools, without presenting CMake as the only possible choice.

His CMake setup declared the target, collected shared and platform sources, configured header and library search paths, linked iOS frameworks and FFmpeg dependencies, and handled settings needed for signing and compilation. He generated an Xcode project, added the player target to a sample app, and continued running and debugging there. This connected a reusable core to a platform app.

Debugging convenience was one of his design requirements. Even though the common code is C++, he still wanted to set breakpoints in Xcode and inspect iOS behavior. The directory layout, toolchain, and demo target all serve that daily workflow. Android would need its own platform code and build environment; a C++ core alone is not a finished two-platform product.

### Divide a minimal player into components

The complete path includes demuxing, audio and video decoding, conversion, rendering, and synchronization. To keep the teaching project manageable, Lian Shu combined demuxing, decoding, and some conversion in one Decoder component, with Audio Render and Video Render beside it. Queues buffer data between producers and consumers so they can work at different rates.

The read thread places decoded results into separate audio-frame and video-frame queues. The output sides consume those queues. A temporarily slow media read need not immediately stall output, though the two outputs still need to follow their timestamps. Combining several operations in Decoder was a teaching choice, not a rule for every production player's class layout.

For the foundational library, he compared FFmpeg and WebRTC. FFmpeg offers broad media processing, while WebRTC concentrates on real-time communication and related network and audio-processing needs. Their capabilities overlap, but they are not interchangeable merely because both work with media. For this player he chose FFmpeg. See the [FFmpeg overview](https://ffmpeg.org/about.html) and [WebRTC project](https://webrtc.org/).

He also distinguished FFmpeg's command-line tools from its development libraries. `ffprobe` inspects media, `ffplay` plays it, and the `ffmpeg` command processes or converts it. An application can use libraries such as `libavformat` for container handling, `libavcodec` for codecs, and `libswresample` for audio conversion; `libswscale` serves image conversion, among other components.

He gave two conversion examples that occupy different layers: changing a container from MKV to MP4 and changing video encoding from VP9 to H.264. Tiny Player's task is to read local media and produce picture and sound, so broad demuxing and decoding support matters first. Network transport and real-time audio processing matter more in WebRTC's main use case. The library choice follows the task.

### Let the public interface and threading model define the work

Lian Shu worked backward from how an app should use Player. A caller can set a media URL, call `open`, `play`, `pause`, and `stop`, and obtain a platform view for its own interface. The demo app creates the player, adds its view, points it to a bundled MP4 file, opens it, and plays it. That short calling sequence becomes a practical statement of requirements.

Internally, two threads actively run player loops. A read thread demuxes and decodes, filling audio and video frame queues. A video-render thread takes frames from its queue and draws them. Audio output has a different rhythm: iOS Audio Unit calls back when it needs more samples, and the player supplies them. Audio still involves a thread of execution; the audio system manages when its callback runs.

### Turn a Packet into a playable Frame

Decoder first defines its own frame representation with media type, data, length, position, and duration. A video frame also needs dimensions and image components. Queues hold references to these frames. Opening media establishes FFmpeg contexts; a loop then reads demuxed packets and sends each one to the decoder for its stream.

A packet still contains compressed data, not a picture ready for the screen. The example calls `avcodec_send_packet` to supply it and `avcodec_receive_frame` to obtain decoded output. It then turns FFmpeg's frame into the player's representation. Video processing extracts image information; audio processing continues through format conversion.

The read loop checks the packet's stream index to decide whether it contains audio or video. The resulting `AVFrame` is not yet Tiny Player's own frame: Lian Shu extracts dimensions, duration, position, and image components before queueing it. That translation means later rendering code does not have to depend directly on every detail of FFmpeg's structure.

Anyone reproducing the demo must remember that packet input and frame output are not one-to-one. FFmpeg documents cases in which output is not ready yet or more than one frame is available. A full implementation also handles return codes and drains remaining decoder output at end of input. The talk simplified some branches to explain the main path, so its displayed loop is not a complete production error and end-state handler. See the [FFmpeg decoding API](https://ffmpeg.org/doxygen/5.1/group__lavc__encdec.html).

Audio conversion must match the output device's sample rate, sample format, and channel layout. The example uses `swr_convert` before storing playable data. `libswresample` can change rates, sample representations, and channel layouts; those settings need to agree as a group. Matching one number alone is insufficient. See the [libswresample documentation](https://ffmpeg.org/libswresample.html).

### Isolate platform details in video rendering

Video output connects to the platform through an abstraction such as PlayerView. On iOS, an Objective-C++ file can operate both C++ objects and the platform's view objects. The common player invokes preparation, binding, and presentation interfaces; the platform implementation handles the actual view and graphics context.

The bridge sits in a `.mm` file. A C++ PlayerView implementation holds the platform view and delegates the platform operations to an iOS object. Reading and synchronization code then sees only the shared interface. This encapsulation is about organizing calls to different systems, not a claimed rendering speedup.

The demonstration used an OpenGL-related path. Preparation created and connected renderbuffers and framebuffers, set up a graphics program plus vertex and texture coordinates, and included a shader for YUV-to-RGB conversion. For each frame, its Y, U, and V components became textures, were drawn to the target buffer, and were presented by the platform layer. That sequence connects decoded data, GPU processing, and the on-screen view. The exact pixel format and graphics API still depend on the target platform.

### In an audio callback, do not throw away half a frame

Audio Unit's input format must match the PCM produced by the preceding conversion, including sample representation and related parameters. The mismatch discussed in the recording shows why defaults cannot be assumed to match decoded media. Buffer count, channel arrangement, and filling behavior must also match the format actually configured; a simplified stereo example is not a universal recipe.

Each callback asks for a particular amount of data, which may stop in the middle of a queued frame. Lian Shu used a 200-byte frame and a callback that needed only 80 bytes. The player must retain the current frame and an 80-byte offset, then supply the remaining 120 bytes before moving to the next frame. The queue buffers across frames; the frame and offset preserve continuity within one frame. Popping a new frame on every callback would lose samples that have not played.

### Bring the two output paths together with synchronization

The first integrated run ended its video while the audio was still playing. Video frames had been consumed too quickly; audio output followed its own sampling and playback rate. Displaying every picture as soon as possible does not produce the correct timing.

Lian Shu made this visible with frame rates. Thirty pictures shown at 30 frames per second take one second; at 60 frames per second, they take half a second. His first version did not even constrain the video display rate, so its render thread emptied frames as quickly as it could. Sound must be emitted sample by sample at the audio device's pace. That difference made synchronization a necessary final component.

He outlined video, audio, or an external clock as possible timing references. The demo chose the audio clock: wait when video gets ahead, drop some frames when it falls too far behind, and display normally when it is close enough. The simple thresholds in the recording are an illustration, not values every player should copy. After the change, the audio and video finished much closer together in the demo.

Tiny Player's value is that it makes the central stages run in sequence. Lian Shu closed by saying that his purpose was to show fundamental media processing and the important points in that path. A complete product must still handle many more inputs, devices, and runtime states.

## Career conversation: connecting interest, business, and technical depth

### From programming for fun to a startup and UC

At the beginning of the interview, Lian Shu said his team covered not just short video but also related feed and live-streaming work. He developed alongside colleagues and stepped in when a request needed help. Recounting his path, he said he began programming out of interest in secondary school, built many management information systems in university, and encountered multimedia through laboratory projects. Graduate study and internships involved more server work. After leaving school to start a business, he moved into iOS and continued along that path.

Asked what helped him grow, he put interest first. Early on, he cared about what he could create with a tool, not merely whether he could solve an exercise. Programming became connected to things he wanted to make, giving him a reason to keep trying.

The work environment was another influence. During the startup, scarce resources and many business problems meant solving enough of a problem to support the business could take priority over perfecting every detail. At UC he had more opportunities to investigate the parts he previously could not pursue. The startup widened the range of problems he could handle; UC helped him deepen the technical work. His “first 70 percent and remaining 30 percent” was a metaphor for different constraints, not a measurement of startup product quality.

### Find room to grow at work, not only in side projects

His third point concerned projects outside work. A developer may put all technical interest into a side project and treat the day job as lost time. But after-work hours are limited, while a large part of life is spent on company projects. Lian Shu suggested looking for a connection between work and technical interest: which business problems deserve investigation, and how can doing one's job also develop new ability?

The host added that some of these problems might lead to a more systematic solution, tool, or open-source result. Neither claimed that every assigned task is automatically interesting. They were looking for opportunities inside real work.

### Make learning continue

Lian Shu admitted that he also procrastinates. A private intention to learn may not be enough, so he gives the work an observable result: a talk he has promised to deliver or another deadline. Preparing can be stressful, but the completed presentation often reveals how much he learned by organizing the material.

For sources, he said he read Medium on subjects he followed. For harder material that needs a coherent foundation, he preferred books. Individual articles may each make a good point without giving a beginner a connected route through the subject. That was his learning preference, not a claim that medium alone determines quality.

The host jokingly asked whether this very talk was driven by a deadline. Lian Shu said he volunteers readily and then feels the pressure when preparation approaches. Afterward, however, the act of organizing and explaining usually proves valuable. A deadline in his account gives a task that invites procrastination a concrete output.

### Where technical depth comes from

He advised finding a field that interests you, or gradually learning to care about the work you already do. Then understand the problem around it: how upstream and downstream systems fit together, what principles underlie it, and what other practitioners in the field are trying to solve. This is not a demand to master everything; it supplies context for choosing where to go deeper.

For iOS, he described a progression: first deliver business features well; then investigate performance problems and their causes; then learn what other specialists encounter and how they solve it. Which of those issues might appear in your own project? From there, choose the point that will most help the current business. Interest, a view of the field, and an actual problem together guide the investment.

### Team culture and hiring

Asked about UC's culture, Lian Shu recalled organizational changes and shared language about equality and innovation. He was cautious about explaining a company's success through slogans alone. He cared more about capabilities an organization had built over time, such as its work on tools and user experience. This was his view of his environment, not a verdict on every company culture.

In the 2022 conversation, he said his team had hiring capacity but recruitment had not yet resumed. That is historical information, not a current opening. In candidates, he looked for computer science foundations and project experience: can they apply operating-system, networking, and data-structure ideas to actual problems, rather than recite definitions? Had they, for example, used extra space to save time where it made sense?

He said a hard algorithm puzzle is not the only way to assess that. Discussing a candidate's real project—when they traded memory for speed, why they selected a structure—can show whether fundamentals inform engineering judgement. Follow-up questions can ask how far they improved the experience, whether the design extends beyond the first requirement, and how stability or media knowledge affected it.

Past projects therefore tell him more than whether someone has touched a named product. He wants to know whether the person keeps improving the result, makes an approach more complete and systematic, and has developed depth in areas relevant to the position. The working method behind the project helps both sides judge the fit.

### Questions to ask before joining another company

Lian Shu considered two levels: the industry and the specific work. Is demand still growing, or does a company have to win in an established market? Then, what technical problems would the role actually involve, and do they fit the person's interests and abilities? Some people learn to enjoy a new field; others work much better when they already care about it.

He used industries familiar in 2022 and joked about opportunities, but did not promise that entering any one industry guarantees a return. The lasting part of his answer is to inspect the market and the actual role together.

### Build your own judgement when a career feels uncertain

After his startup, Lian Shu wondered whether to keep doing iOS and considered server work. His iOS experience was deeper, while his understanding of backend development was still limited, so he stayed with iOS. During that uncertainty he focused on doing his present work well and finding substantial questions inside it, rather than making a decision from a broad job label alone.

The host followed up: what if other people tell you to switch? Lian Shu distinguished a person whose judgement might follow several frustrating job searches from someone who had examined the field across many projects and still saw a problem. Advice cannot be evaluated by counting votes; it matters what experience and reasoning produced it.

His further question was: why does this person believe that? If you do not yet have your own answer, investigate their reasoning. Understanding how a conclusion was reached helps you build a judgement you can trust more than simply adopting the conclusion.

### Would a platform change erase the work?

The host sharpened the concern: iOS depends on Apple; what if the platform landscape changes? Lian Shu answered that years of solving mobile problems build more than knowledge of Swift, Objective-C, and one SDK. They also build ways to investigate performance, deliver a good experience with limited resources, and solve business problems.

A new platform would require learning new APIs and constraints, but those broader abilities could transfer. He did not promise that any platform would last forever. He asked developers to distinguish platform-specific knowledge from the problem-solving ability they carry with them.

### Mobile development and his own future

In his view at the time, people still used phones extensively, so mobile development had not lost all demand merely because new fields were fashionable. Finding one's place might take more effort. This was his 2022 judgement based on user behavior, not a report on today's job market.

He described two lines in his own plans. To navigate later career stages, he wanted to retain technical ability and view the business more completely: if he owned this business, what problem would matter most? The answer might be team coordination or project organization rather than a line of code. He used a “CEO's perspective” to mean taking broader responsibility for problems, not that every developer must become a CEO.

The second line remained personal interest. If life allowed it, he wanted to keep writing code, exploring new technology, and making things he found exciting. Professional capability and personal exploration could reinforce one another. The conversation thus returned to its starting point: interest lasts longer when it is joined to real problems and action.

The [Episode 8 archive page (Chinese)](/articles/tchat-8/) has the original recordings and segment information.
