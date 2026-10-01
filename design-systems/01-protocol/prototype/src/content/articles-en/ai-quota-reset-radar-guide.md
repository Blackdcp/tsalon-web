---
title: "AI Quota Reset Radar: How to Track Codex, Claude & Grok Limits"
summary: "A practical guide to T Salon's AI Quota Reset Radar (WhenReset). Learn how rolling limits work across Codex, Claude, and Grok, how to project recovery times, and how to pace your weekly budget."
type: guide
publishedAt: 2026-10-01
updatedAt: 2026-10-01
readingMinutes: 6
author: editorial-team
topics:
  - AI
  - Engineering
  - Agent
cover: /images/default-cover.svg
coverAlt: Practical guide to T Salon AI Quota Reset Radar and usage planning
featured: true
draft: false
translationStatus: reviewed
translationOf: ai-quota-reset-radar-guide
tldr:
  - "T Salon Reset Radar aggregates verified global resets and promotional card events across OpenAI Codex, Anthropic Claude, and xAI Grok."
  - "The 5-hour rolling recovery calculator helps you find when limits actually lift: the key is anchoring to the first request of the window, not the error timestamp."
  - "The weekly quota planner calculates your safe daily burn budget, supporting Cursor 30-day and standard 7-day model billing cycles."
  - "Dedicated RSS 2.0 feeds and webhook scripts let teams pipe automated reset alerts straight into Feishu, Slack, or WeCom without manual polling."
faq:
  - question: "What is the difference between a global reset and a reset card?"
    answer: "A global reset wipes usage clean for all or nearly all accounts on the platform. A reset card is an incentive or promotional voucher that individual eligible users must claim manually before it expires."
  - question: "Why cannot I just add 5 hours to the timestamp when I hit my rate limit?"
    answer: "Because a rolling 5-hour limit starts counting from the very first request sent in that window, not when you run out of tokens. Adding 5 hours to your error timestamp usually gives you a recovery time that is hours later than reality."
  - question: "How does the weekly quota planner prevent teams from burning out early?"
    answer: "Given your current consumption percentage and target reset date, the planner computes an allowable daily budget for the remaining days and flags early-exhaustion risks with an exact predicted cutoff date."
seo:
  title: "AI Quota Reset Radar: How to Track Codex, Claude & Grok Limits"
  description: "Tired of hitting rate limits mid-refactor? Learn how T Salon Reset Radar tracks Codex, Claude, and Grok resets, projects recovery times, and alerts your team."
  noindex: false
citations:
  - label: "T Salon AI Quota Reset Radar"
    url: https://www.tsalon.tech/whenreset/
  - label: "Anthropic Claude Rate Limits Documentation"
    url: https://docs.anthropic.com/en/docs/
  - label: "OpenAI Developer Platform Usage and Limits"
    url: https://platform.openai.com/docs/
  - label: "xAI Developer Platform API Documentation"
    url: https://x.ai/api
---

**If you write code with Cursor, Claude Code, or run multi-agent workflows in your terminal, you've almost certainly hit the wall:** right in the middle of a refactor, an unexpected `You've reached your limit` pops up, bringing your entire working session to a dead stop.

What makes this genuinely painful isn't just the pause — it's the guesswork. Does the 5-hour rolling limit reset 5 hours from right now, or 5 hours from your first prompt? Did OpenAI or Anthropic just do a quiet global refresh? What about those "reset cards" floating around developer forums?

We built [WhenReset (AI Quota Reset Radar)](https://www.tsalon.tech/en/whenreset/) to replace that guesswork with clear, verifiable facts. This guide explains how the radar tracks provider events, how the recovery and weekly pacing calculators work under the hood, and how to pipe live alerts into your team's chat.

## Why Is Model Quota Recovery So Confusing in Practice?

**Frontier AI providers rely on sliding windows and dynamic throttling that make quota recovery non-linear and hard to predict.** Unlike traditional cloud infrastructure where meters reset at midnight or on the first of the month, modern AI services introduce several operational quirks:

1. **The 5-hour rolling window is commonly miscalculated**: Most developers assume that getting locked out means waiting 5 hours from the moment the error banner appears. In reality, the clock started when you sent the *first prompt* of that session. Measuring from the lockout moment means waiting hours longer than necessary.
2. **Global resets get mixed up with promotional cards**: Providers occasionally wipe all account limits during major releases or service outages (a global reset). Other times, they hand out limited voucher codes to specific beta testers (a reset card). Confusing the two leads to false hope and interrupted schedules.
3. **The post-reset concurrency crunch**: When a widespread reset takes place, thousands of developers resume their pipelines at the exact same moment. Even if your quota shows 100% available, requests often suffer from sudden spikes in latency and intermittent timeouts.

Reset Radar exists to turn fragmented community rumors into a clean, machine-verifiable timeline.

## What Exactly Does the Reset Radar Monitor?

**The radar monitors verified events across OpenAI Codex, Anthropic Claude, and xAI Grok, alongside presets for popular developer environments like Cursor.**

At the top of the [Reset Radar Console](https://www.tsalon.tech/en/whenreset/), you can switch between dedicated telemetry views:

- **OpenAI Codex**: Tracks historical global resets, scope modifications, and verified community cards, showing the actual days elapsed between major events.
- **Anthropic Claude**: Focuses on Claude 3.5 Sonnet and Opus refresh pulses, logging patterns across rolling daily and weekly quota horizons.
- **xAI Grok**: Telemetry for Grok models, recording quota adjustments and verified global refresh milestones.
- **Cursor and Developer Ecosystems**: The pacing calculator includes dedicated presets for Cursor's 30-day billing cycle (such as 500 fast requests) alongside standard 7-day weekly quotas.

Each provider view features a health status badge, verified event counts, average recurrence intervals, and timestamped audit logs.

## Hit a Rate Limit? Here Is How to Calculate Your True Recovery Time

**The 5-hour rolling window calculator simply adds 300 minutes to your verified session start time, saving you from doing tricky timezone math in your head.**

As mentioned earlier, anchoring to the moment you hit the limit is the most common mistake. Here is how to get an accurate estimate:

1. **Find your true window start**: Open your client logs, terminal history, or vendor dashboard to find the timestamp of the *first successful request* in your current burst.
2. **Enter the start timestamp**: Type that time into the calculator (24-hour format, with cross-midnight support like yesterday 23:40).
3. **Read your projected recovery time**: Based on the 5-hour rolling assumption, the tool outputs your expected unlock time in Shanghai time (UTC+8) along with an active countdown.

Keep in mind: this calculator runs entirely on your device. It never asks for or interacts with your private API keys. Always treat official vendor consoles as the ultimate source of truth.

## Burning Quota Too Fast? How to Pace Your Weekly Usage

**The Weekly Quota Planner tells you how much quota you can safely spend today without stranding yourself before the cycle ends.**

During heavy refactoring or eval runs, it is alarmingly easy to burn 80% of your weekly quota by Tuesday afternoon. The planner prevents this with a straightforward daily budget model:

### Key Inputs and Formulation

You only need to supply two numbers:
1. **Used Quota Percentage**: Adjust the slider or type a percentage from 0% to 100%.
2. **Target Reset Time**: Defaults to Sunday 23:59 UTC+8, or tap a preset button to switch to a 30-day Cursor cycle.

The engine computes two vital metrics:

$$\text{Daily Safe Budget} = \frac{100\% - \text{Used Percentage}}{\text{Remaining Days}}$$

$$\text{Projected Total Burn} = \frac{\text{Used Percentage}}{\text{Elapsed Days}} \times \text{Total Cycle Days}$$

### Understanding the Four Health Tiers

- 🟢 **Comfortable**: Your burn rate is trailing elapsed time. You have plenty of headroom for heavy batch jobs.
- 🔵 **On Track**: Consumption matches the calendar cadence. Continue your normal workflow without modification.
- 🟡 **Tight**: Burn velocity is high. Your daily allowance is narrowing; consider routing secondary tasks to smaller models.
- 🔴 **Exhausted Early**: At your current pace, quota will hit zero before your reset day. The planner calculates the *exact date and time* you are projected to run dry.

Your inputs are automatically saved in `localStorage`, so everything stays in place when you revisit the page.

## Stop Refreshing Manually: How to Pipe Alerts into Feishu, Slack & RSS

**Manually checking a status page is a waste of time. Hooking verified events directly into your team's chat keeps everyone informed automatically.**

### 1. Dedicated RSS 2.0 Feeds

Reset Radar publishes clean RSS 2.0 endpoints that emit structured entries whenever an event is logged:

- **English Feed**: `https://www.tsalon.tech/en/whenreset/rss.xml`
- **Chinese Feed**: `https://www.tsalon.tech/whenreset/rss.xml`

Drop these into NetNewsWire, Reeder, or a GitHub Actions workflow.

### 2. Feishu and Lark Webhook Bots

Create a custom bot inside Feishu, grab the webhook URL, and use this lightweight script to send interactive cards:

```javascript
// feishu-alert.mjs
const WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL;

async function sendFeishuAlert(provider, title, content) {
  const payload = {
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: `AI Quota Reset: ${provider.toUpperCase()}` },
        template: "blue"
      },
      elements: [
        {
          tag: "div",
          text: { tag: "lark_md", content: `**Event**: ${title}\n**Details**: ${content}` }
        },
        {
          tag: "action",
          actions: [{
            tag: "button",
            text: { tag: "plain_text", content: "Open Reset Radar" },
            type: "primary",
            url: "https://www.tsalon.tech/en/whenreset/"
          }]
        }
      ]
    }
  };

  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
```

### 3. WeCom, Slack and DingTalk

For Slack, WeCom, or DingTalk, construct standard JSON payloads with markdown text and POST them to your incoming webhook endpoint.

### 4. Native Desktop Notifications

Click "Enable Desktop Notifications" on the radar dashboard. Whenever a new event is recorded, your browser triggers a system notification banner so you never miss an unannounced reset while working in another window.

## What Are the Most Common Traps When Reading Reset Data?

**Reset Radar is a community telemetry tool, not an authoritative billing portal. Keep these four boundaries in mind:**

1. **A reset card is not a universal reset**: Always verify the eligible audience. Most cards are limited promo vouchers, not automated account refreshes.
2. **Error timestamps are not window origins**: When calculating rolling 5-hour recovery, anchor to your session's first prompt, not the error banner.
3. **Public radar cannot see private balances**: The radar tracks macroeconomic platform events. Check your vendor console for personal token balances.
4. **Post-reset congestion is real**: The first 30 minutes after a major platform-wide reset are often plagued by traffic spikes. Wait a short bit before kicking off large batch runs.

By pairing verified event tracking with realistic pacing budgets and automated team alerts, you can protect your development rhythm from unexpected quota walls.
