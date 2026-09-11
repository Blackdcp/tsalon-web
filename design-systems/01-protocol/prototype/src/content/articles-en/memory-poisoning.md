---
title: "Memory Poisoning: Six Long-Term Memory Controls Enterprise Agents Must Establish"
summary: If a system records a fake contact from a web page as a "trusted supplier," the impact extends beyond the current conversation. Memory Poisoning refers to untrusted, incorrect, or manipulated information entering persistent memory and being recalled in subsequent sessions.
type: news
publishedAt: 2026-09-01
readingMinutes: 3
author: editorial-team
topics:
  - AI
  - Agent
  - Security
cover: https://segmentfault.com/img/bVdqDAZ?spec=cover
coverAlt: Memory Poisoning
citations:
  - label: Original Post on SegmentFault
    url: https://segmentfault.com/a/1190000048255404
featured: true
draft: false
translationOf: memory-poisoning
translationStatus: reviewed
seo:
  title: "Memory Poisoning: Six Long-Term Memory Controls Enterprise Agents Must Establish"
  description: "If a system records a fake contact from a web page as a \"trusted supplier,\" the impact extends beyond the current conversation. Memory Poisoning refers to untrusted, incorrect, or manipulated information entering persistent memory and being recalled in subsequent sessions."
---
![Cover](https://segmentfault.com/img/remote/1460000048255406)

If a system records a fake contact from a web page as a "trusted supplier," the impact extends beyond the current conversation. In the next procurement task, this information might be recalled, and other agents might continue to use it.

Memory Poisoning occurs when untrusted, incorrect, or manipulated information enters persistent memory and is repeatedly called upon in subsequent sessions, tasks, and multi-agent collaborations.

As Agents gain the ability to work across sessions, call tools, and share task experiences, memory becomes a system resource that must be managed independently. Enterprises must establish controls around the source, writing, updating, isolation, recall, and deletion of memory.

## How a Single Error Becomes Long-Term Contamination

Prompt Injection affects the current interaction, whereas Memory Poisoning happens after the current interaction ends. The system writes unverified information into persistent memory and later retrieves it as historical fact, user preference, or verified experience.

For long-running Agents, risks are transmitted along the memory lifecycle.

## Six Questions Memory Governance Must Answer

1. Where did this memory come from?
2. Who can write or modify it?
3. How do new and old memories coexist?
4. Who can see the memory?
5. How are errors handled once discovered?
6. How are anomalies detected?

## How MemOS Helps Enterprises Avoid Similar Problems

MemOS places memory between the Agent and the model, providing system endpoints for writing, retrieving, providing feedback, deleting, and orchestrating memory modules. 

MemOS Cloud now offers interfaces for search, writing, deletion, and feedback, making it easy to integrate these operations into Agent workflows.

## Different Industries Require Different Memory Rules

Companion products need to focus on personality settings and sensitive preferences.
Smart devices must consider multi-user isolation and device-to-device memory boundaries.
Financial scenarios pay more attention to policy timeliness and full audit trails.
Industrial scenarios need to differentiate between equipment facts, expert experience, and on-site anomalies.

## FAQ

**What is the difference between Memory Poisoning and Prompt Injection?**
Prompt Injection primarily affects the current task. Memory Poisoning allows untrusted information to enter persistent memory, continuously impacting subsequent tasks.

**Can private deployment solve memory poisoning?**
Private deployment can reduce the scope of data exfiltration. Issues like untrusted sources, excessive permissions, and erroneous writing still need to be handled through memory governance.

## Conclusion

When Agents work long-term, memory will begin to affect the quality and safety of subsequent tasks. Enterprises need to know where a memory comes from, why it was written, which tasks have called it, and whether it can be corrected or deleted promptly when problems are discovered.

## Related Links

MemOS Website: [memos.openmem.net](https://memos.openmem.net)
GitHub: [github.com/MemTensor/MemOS](https://github.com/MemTensor/MemOS)
Docs: [memos-docs.openmem.net](https://memos-docs.openmem.net)

---

## About MemTensor

MemTensor Technology Co., Ltd. is a new generation large model and long-term intelligence infrastructure enterprise incubated by the Shanghai Artificial Intelligence Innovation Center.
