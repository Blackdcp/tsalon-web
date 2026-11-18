export interface ComparisonRow {
  dimensionZh: string;
  dimensionEn: string;
  valuesZh: string[];
  valuesEn: string[];
}

export interface ComparisonEntry {
  slug: string;
  badge: string;
  titleZh: string;
  titleEn: string;
  seoTitleZh: string;
  seoTitleEn: string;
  descZh: string;
  descEn: string;
  directVerdictZh: string;
  directVerdictEn: string;
  columnsZh: string[];
  columnsEn: string[];
  rows: ComparisonRow[];
  whenToChooseZh: { option: string; reason: string }[];
  whenToChooseEn: { option: string; reason: string }[];
  toolPathZh: string;
  toolPathEn: string;
  toolLabelZh: string;
  toolLabelEn: string;
  faqZh: { q: string; a: string }[];
  faqEn: { q: string; a: string }[];
}

export const COMPARISONS: ComparisonEntry[] = [
  {
    slug: 'claude-code-vs-codex-vs-cursor-vs-antigravity',
    badge: 'AGENT IDE & CLI COMPARISON · 2026',
    titleZh: 'Claude Code vs OpenAI Codex CLI vs Cursor vs Google Antigravity：2026 四大 AI 编程工具配额与架构对比',
    titleEn: 'Claude Code vs OpenAI Codex CLI vs Cursor vs Google Antigravity (2026 Comparison)',
    seoTitleZh: 'Claude Code vs Codex vs Cursor vs Antigravity 对比 | T Salon',
    seoTitleEn: 'Claude Code vs Codex CLI vs Cursor vs Antigravity (2026) | T Salon',
    descZh: '从配额重置机制（5小时窗口 vs 月度500次 vs 太平洋午夜清零）、Prompt Cache 省钱率、多文件重构能力与订阅性价比四个维度，横向对比 Claude Code、OpenAI Codex、Cursor 与 Google Antigravity。',
    descEn: 'Side-by-side 2026 engineering comparison of Claude Code, OpenAI Codex CLI, Cursor, and Google Antigravity across quota reset rules, prompt caching efficiency, and monthly cost.',
    directVerdictZh: '重度终端多文件重构首选 Claude Code（搭配 $100/$200 Max 订阅与 85%+ 缓存命中率）或 OpenAI Codex CLI（擅长异步云端沙箱 + 本地双模）；日常 IDE 实时补全与可视化 Diff 首选 Cursor Pro（$20/500 次 Fast Requests）；需要按模型独立配额池兜底（Flash 不受高阶模型限流影响）及每日固定北京时间 15:00/16:00 清零则选 Google Antigravity / Gemini CLI。',
    directVerdictEn: 'Choose Claude Code ($100/$200 Max) or OpenAI Codex CLI for autonomous multi-file terminal refactoring; choose Cursor Pro ($20/mo, 500 Fast Requests) for interactive IDE diffs and tab completion; choose Google Antigravity & Gemini CLI when you want per-model quota isolation (Flash fallback) and predictable daily Midnight PT resets.',
    columnsZh: ['对比维度', 'Claude Code', 'OpenAI Codex CLI', 'Cursor Pro / Ultra', 'Google Antigravity / Gemini'],
    columnsEn: ['Dimension', 'Claude Code', 'OpenAI Codex CLI', 'Cursor Pro / Ultra', 'Google Antigravity / Gemini'],
    rows: [
      {
        dimensionZh: '核心交互形态',
        dimensionEn: 'Primary Interface',
        valuesZh: ['终端原生 Agent + IDE 插件', '终端 CLI + 云端异步沙箱容器', '独立 AI 原生 IDE（VS Code 分支）', 'Agentic IDE + 内置浏览器/子代理'],
        valuesEn: ['Terminal-native Agent + IDE extension', 'Terminal CLI + Cloud async sandbox', 'Standalone AI IDE (VS Code fork)', 'Agentic IDE + built-in browser/subagents'],
      },
      {
        dimensionZh: '配额限制与重置机制',
        dimensionEn: 'Quota & Reset Mechanism',
        valuesZh: ['5 小时滑动窗口（首条消息起算）+ 7 天周限额', '滑动窗口 + 周限额 + 官方不定期发重置卡（@thsottiaux）', '30 天账单周期（Pro 含 500 次 Fast Requests）', '按模型独立计池 + 每日太平洋午夜（北京时间 15/16 点）清零 RPD'],
        valuesEn: ['5h rolling window (from 1st msg) + 7d weekly cap', 'Rolling window + weekly cap + bonus Reset Cards (@thsottiaux)', '30-day billing cycle (500 Fast Requests on Pro)', 'Per-model quota pools + daily Midnight PT (15:00/16:00 UTC+8) RPD reset'],
      },
      {
        dimensionZh: 'Prompt Cache 缓存折扣',
        dimensionEn: 'Prompt Cache Read Discount',
        valuesZh: ['缓存读 $0.30/1M（常规输入 $3 的 10%）', '缓存读 $0.25/1M（常规输入 $2.50 的 10%）', '订阅制按请求次数扣减（Max Mode 按 Token 计费）', '缓存读约常规输入的 25%（长上下文优势明显）'],
        valuesEn: ['$0.30/1M cache read (90% off $3.00 input)', '$0.25/1M cache read (90% off $2.50 input)', 'Request-metered on Pro; token-billed in Max Mode', '~75% discount on cached context reads'],
      },
      {
        dimensionZh: '主流订阅档位',
        dimensionEn: 'Subscription Tiers',
        valuesZh: ['$20 Pro / $100 Max (5x) / $200 Max (20x)', '$20 ChatGPT Plus / $200 ChatGPT Pro', '$20 Pro / $40 Business / $200 Ultra', 'AI Studio 免费层 / $19.99 Google AI Pro / Ultra'],
        valuesEn: ['$20 Pro / $100 Max (5x) / $200 Max (20x)', '$20 ChatGPT Plus / $200 ChatGPT Pro', '$20 Pro / $40 Business / $200 Ultra', 'Free AI Studio tier / $19.99 Google AI Pro / Ultra'],
      },
      {
        dimensionZh: '限流后的兜底手段',
        dimensionEn: 'Fallback When Rate-Limited',
        valuesZh: ['用 `/compact` 压缩上下文或切 API Key 按量计费', '核销囤积的 Reset Card 或切换本地/云端模式', '降级至慢速队列（Slow Requests）或开启按量付费', '无缝切换至独立配额池的 Flash / Flash-Lite 模型'],
        valuesEn: ['Run `/compact` or fall back to pay-as-you-go API key', 'Apply a banked Reset Card or switch local/cloud mode', 'Fall back to Slow Requests queue or usage-based billing', 'Switch to Flash or Flash-Lite (separate model quota bucket)'],
      },
    ],
    whenToChooseZh: [
      { option: '选 Claude Code', reason: '需要跨 10+ 文件做深度架构重构、跑终端测试循环，且愿意通过 `/compact` 和 `CLAUDE.md` 管理上下文。' },
      { option: '选 OpenAI Codex CLI', reason: '希望把独立 PR 任务丢给云端沙箱异步执行，同时享受官方高频率的全局重置与发卡福利。' },
      { option: '选 Cursor', reason: '更习惯可视化 GUI Diff 逐行审查代码，且日常以中小粒度功能开发与 Tab 补全为主。' },
      { option: '选 Google Antigravity / Gemini', reason: '需要百万级超长上下文检索、内置浏览器自动化验证，以及高阶模型限流后仍能用 Flash 继续干活。' },
    ],
    whenToChooseEn: [
      { option: 'Choose Claude Code', reason: 'You run deep multi-file refactors and terminal test loops, and manage context with `/compact` and `CLAUDE.md`.' },
      { option: 'Choose OpenAI Codex CLI', reason: 'You want to offload parallel PR tasks to cloud sandboxes and benefit from frequent bonus Reset Cards.' },
      { option: 'Choose Cursor', reason: 'You prefer visual inline diffs and fast interactive Tab completions inside a full GUI editor.' },
      { option: 'Choose Google Antigravity / Gemini', reason: 'You need 1M+ context windows, built-in browser verification, and per-model Flash fallback pools.' },
    ],
    toolPathZh: '/whenreset/',
    toolPathEn: '/en/whenreset/',
    toolLabelZh: '在 WhenReset 实时查看四大工具重置状态 →',
    toolLabelEn: 'Check Live Reset Status for All 4 Tools on WhenReset →',
    faqZh: [
      { q: '为什么很多高阶开发者同时混用 Claude Code 和 Codex CLI？', a: '因为两者的 5 小时窗口与周限额完全独立。当 Claude Code 触发 5 小时滑动窗口上限时，基于本地 `REFACTOR_PLAN.md` 任务单可以直接无缝切到 Codex CLI 或 Antigravity 继续收尾，实现零停工。' },
      { q: '哪款工具的真实社区 Token 吞吐量最高？', a: '根据 T Salon TokenRank 社区遥测数据，Claude Code 与 OpenAI Codex CLI 占据了 80% 以上的重度 Agent 吞吐量，其缓存读取占比普遍在 82%–89% 之间。' },
    ],
    faqEn: [
      { q: 'Why do many engineers pair Claude Code with OpenAI Codex CLI or Antigravity?', a: 'Because their 5-hour windows and weekly caps are independent. Persisting task state in a local markdown checklist lets you hand off work immediately when one provider hits a rolling cap.' },
      { q: 'Which tool generates the highest token volume in real telemetry?', a: 'On the T Salon TokenRank leaderboard, Claude Code and OpenAI Codex CLI account for over 80% of heavy agentic token throughput, typically operating at 82%–89% prompt cache hit rates.' },
    ],
  },
  {
    slug: 'claude-pro-vs-claude-max-vs-api',
    badge: 'SUBSCRIPTION BREAK-EVEN · CLAUDE',
    titleZh: 'Claude Pro ($20) vs Claude Max ($100 / $200) vs API 按量付费：多少 Token 用量值得升级？',
    titleEn: 'Claude Pro ($20) vs Claude Max ($100 / $200) vs API Pay-As-You-Go: Break-Even Analysis',
    seoTitleZh: 'Claude Pro vs Max ($100/$200) vs API 哪个划算 | T Salon',
    seoTitleEn: 'Claude Pro vs Claude Max ($100/$200) vs API Cost Comparison | T Salon',
    descZh: '基于 Claude 3.5 Sonnet 与 Opus 官方 API 定价（含 85% Prompt Cache 折扣），定量测算每日消耗多少 Token 时买 $20 Pro、$100 Max (5x) 或 $200 Max (20x) 比直接调 API 更省钱。',
    descEn: 'Quantitative break-even comparison between Claude Pro ($20), Claude Max ($100 5x / $200 20x), and direct Anthropic API billing at 85% vs 0% prompt cache hit rates.',
    directVerdictZh: '以 85% Prompt Cache 命中率、每月工作 22 天计算：只要你每天在 Claude Code 中消耗超过 100 万 Token（月均 2,200 万），$20 Pro 就比按量 API（$20.79/月）划算；每天消耗超过 500 万 Token（月等效 API 账单 $103.95）即可回本 $100 Max (5x)；每天消耗达到 2,500 万 Token（主力全职 Agent 编码，月等效 API 账单 $519.75）时，$200 Max (20x) 能帮你省下 60% 以上的等效 API 费用。',
    directVerdictEn: 'At an 85% prompt cache hit rate over 22 active coding days/month: $20 Pro breaks even against API billing at just ~1M raw tokens/day ($20.79/mo API value); $100 Max (5x) breaks even around ~5M raw tokens/day ($103.95/mo API value); and full-time agentic coders burning 25M tokens/day ($519.75/mo on Sonnet or $1,732.50/mo on Opus) save 60%–88% on $200 Max (20x).',
    columnsZh: ['方案档位', '月费', '5 小时窗口与周配额倍率', 'Sonnet 等效回本线（85% 缓存）', '最适合人群'],
    columnsEn: ['Plan Tier', 'Monthly Fee', '5h Window & Weekly Quota', 'Sonnet Break-Even (85% Cache)', 'Best For'],
    rows: [
      {
        dimensionZh: 'Claude Pro',
        dimensionEn: 'Claude Pro',
        valuesZh: ['$20 / 月', '1x 基准 5 小时窗口 + 基础周限额', '日均 ≥ 100 万 Token（月 22M）', '轻中度辅助编程、每天 1–2 小时 Claude Code'],
        valuesEn: ['$20 / mo', '1x baseline 5h window + standard weekly cap', '>= 1M tokens/day (22M/mo)', 'Light-to-moderate coding, 1–2h Claude Code daily'],
      },
      {
        dimensionZh: 'Claude Max (5x)',
        dimensionEn: 'Claude Max (5x)',
        valuesZh: ['$100 / 月', 'Pro 的 5 倍窗口容量与周额度', '日均 ≥ 500 万 Token（月 110M）', '每天高频使用 Claude Code 的一线全职工程师'],
        valuesEn: ['$100 / mo', '5x Pro window capacity & weekly allowance', '>= 5M tokens/day (110M/mo)', 'Full-time engineers using Claude Code daily'],
      },
      {
        dimensionZh: 'Claude Max (20x)',
        dimensionEn: 'Claude Max (20x)',
        valuesZh: ['$200 / 月', 'Pro 的 20 倍容量 + 高频 Opus 权限', '日均 ≥ 1,000 万 Token（月 220M）', '重度多仓库重构、高频调用 Opus 与多终端并行开发者'],
        valuesEn: ['$200 / mo', '20x Pro capacity + heavy Opus access', '>= 10M tokens/day (220M/mo)', 'Heavy multi-repo refactoring & parallel agent workflows'],
      },
      {
        dimensionZh: 'Anthropic API 按量付费',
        dimensionEn: 'Anthropic API (Pay-As-You-Go)',
        valuesZh: ['按实际 Token 计费', '按 Tier 1–4 速率限制（无 5 小时锁死）', '低频使用（日均 < 100 万 Token）或突发应急', 'CI/CD 自动化脚本、团队共享 Key 或限流时的备用通道'],
        valuesEn: ['Pay per token', 'Tier 1–4 RPM/TPM limits (no 5h lockout)', '< 1M tokens/day or burst overflow', 'CI/CD pipelines, low-volume scripts, or lockout fallback'],
      },
    ],
    whenToChooseZh: [
      { option: '留在 $20 Pro', reason: '你主要在网页端问答或偶尔跑短会话，很少在一个工作日内连续触发两次 5 小时上限。' },
      { option: '升级 $100 / $200 Max', reason: '你把 Claude Code 当主力生产力工具，日均吞吐在 1,000 万–5,000 万 Token 以上，走 API 每月要花 $300–$1,500+。' },
      { option: '配置 API Key 备用', reason: '订阅套餐在关键发布日前夕意外触发周限额时，用按量 API Key 顶过最后几个小时。' },
    ],
    whenToChooseEn: [
      { option: 'Stay on $20 Pro', reason: 'You use Claude for targeted tasks and rarely hit the 5-hour limit more than once a week.' },
      { option: 'Upgrade to $100 / $200 Max', reason: 'Claude Code is your primary daily driver (10M–50M+ tokens/day), where API billing would cost $300–$1,500+/mo.' },
      { option: 'Keep an API Key as backup', reason: 'You want an instant overflow valve when a weekly cap hits right before a production deadline.' },
    ],
    toolPathZh: '/calculator/',
    toolPathEn: '/en/calculator/',
    toolLabelZh: '用 AI 成本计算器测算你的精确盈亏平衡点 →',
    toolLabelEn: 'Calculate Your Exact Break-Even Point in the Cost Calculator →',
    faqZh: [
      { q: '为什么我用 API 跑 Claude Code 一天就花了 $30，而买套餐没感觉这么贵？', a: '因为重度重构每轮都会重发数万 Token 上下文。即便有 85% 缓存，每天 2,500 万 Token 在 Sonnet API 上也要约 $23.6/天（月均 $519.75），所以高吞吐用户用 $100/$200 包月套餐具有极高的成本杠杆。' },
    ],
    faqEn: [
      { q: 'Why did one day of Claude Code on an API key cost me $25+?', a: 'Agentic coding replays tens of thousands of context tokens on every turn. Even at an 85% cache hit rate, 25M tokens/day on Sonnet API costs ~$23.62/day ($519.75 over 22 days), which is why heavy users get massive leverage from flat-rate Max plans.' },
    ],
  },
  {
    slug: 'chatgpt-plus-vs-pro-for-codex',
    badge: 'OPENAI CODEX TIERS · $20 VS $200',
    titleZh: 'ChatGPT Plus ($20) vs ChatGPT Pro ($200) 跑 OpenAI Codex：配额、云端沙箱与重置卡对比',
    titleEn: 'ChatGPT Plus ($20) vs ChatGPT Pro ($200) for OpenAI Codex: Quotas, Sandboxes & Reset Cards',
    seoTitleZh: 'ChatGPT Plus vs Pro 跑 Codex 额度与性价比对比 | T Salon',
    seoTitleEn: 'ChatGPT Plus ($20) vs Pro ($200) for OpenAI Codex | T Salon',
    descZh: '对比 $20 ChatGPT Plus 与 $200 ChatGPT Pro 在运行本地 Codex CLI 与云端异步沙箱时的周配额上限、并发容器数、GPT-5.6 Sol 等效 API 价值及 @thsottiaux 重置卡福利。',
    descEn: 'Compare ChatGPT Plus ($20) and ChatGPT Pro ($200) for OpenAI Codex CLI and cloud sandboxes: weekly usage limits, parallel container caps, API-equivalent value, and Reset Cards.',
    directVerdictZh: '如果每天只跑 3–5 个小 PR 或以本地单线程 Codex CLI 辅助为主，$20 ChatGPT Plus 配合官方不定期的全局重置已足够；如果你每天在本地高频跑 GPT-5.6 Sol（日均 1,500 万 Token 以上，月等效 API 账单达 $415–$693）或需要多任务并行派发云端沙箱，$200 ChatGPT Pro 的高配额池与高并发上限能在半个月内回本。',
    directVerdictEn: 'For 3–5 daily tasks or single-threaded local Codex CLI usage, $20 ChatGPT Plus is sufficient; for heavy full-time engineering (>15M tokens/day on GPT-5.6 Sol, worth $415–$693/mo at API rates) or parallel cloud sandbox workflows, $200 ChatGPT Pro pays for itself within two weeks.',
    columnsZh: ['对比项', 'ChatGPT Plus ($20/月)', 'ChatGPT Pro ($200/月)', 'OpenAI API 按量计费'],
    columnsEn: ['Feature', 'ChatGPT Plus ($20/mo)', 'ChatGPT Pro ($200/mo)', 'OpenAI API (Pay-As-You-Go)'],
    rows: [
      {
        dimensionZh: '本地 Codex CLI 周期配额',
        dimensionEn: 'Local Codex CLI Quota',
        valuesZh: ['基础滑动窗口 + 7 天周限额（重度重构约 2–3 天触顶）', '大幅扩展的 Pro 专属配额池（支持全周高强度连续编码）', '仅受 API Tier RPM/TPM 及账户余额限制'],
        valuesEn: ['Baseline window + 7d weekly cap (heavy refactors hit cap in 2–3 days)', 'Expanded Pro quota pool designed for continuous full-week coding', 'Bound only by API Tier RPM/TPM and credit balance'],
      },
      {
        dimensionZh: '云端异步沙箱并发能力',
        dimensionEn: 'Cloud Sandbox Concurrency',
        valuesZh: ['受限并发队列，长构建易排队', '高优并发沙箱队列，支持多仓库同时派发 PR 任务', '不支持官方托管 Codex 网页沙箱'],
        valuesEn: ['Standard concurrency queue', 'Priority parallel sandbox execution across multiple repos', 'N/A (local CLI / custom container only)'],
      },
      {
        dimensionZh: '重置卡（Reset Card）与全局刷新',
        dimensionEn: 'Reset Cards & Global Flushes',
        valuesZh: ['参与全部用户的全局重置与付费用户发卡活动', '享有最高优先级的定向额度扩容与重置卡发放', '无重置卡（按量实时扣费）'],
        valuesEn: ['Eligible for all-user global resets & paid-tier bonus cards', 'Highest priority for Pro-scoped capacity boosts & bonus cards', 'N/A (metered billing)'],
      },
      {
        dimensionZh: '月等效 API 价值回本点（85% 缓存）',
        dimensionEn: 'Monthly API Break-Even (85% Cache)',
        valuesZh: ['日均 ≥ 75 万 Token（月 16M）', '日均 ≥ 750 万 Token（月 160M）', '日均 < 75 万 Token 时最省钱'],
        valuesEn: ['>= 0.75M tokens/day (16M/mo)', '>= 7.5M tokens/day (160M/mo)', 'Cheapest below 0.75M tokens/day'],
      },
    ],
    whenToChooseZh: [
      { option: '选 ChatGPT Plus ($20)', reason: '刚上手 Codex CLI，或者手里同时还订了 Claude Pro / Cursor Pro 做双工具轮换。' },
      { option: '选 ChatGPT Pro ($200)', reason: '以 OpenAI Codex 为唯一主力编程 Agent，且经常使用云端异步容器并行改代码。' },
    ],
    whenToChooseEn: [
      { option: 'Choose ChatGPT Plus ($20)', reason: 'You use Codex CLI moderately or rotate between Codex and Claude Code / Cursor.' },
      { option: 'Choose ChatGPT Pro ($200)', reason: 'OpenAI Codex is your primary engineering workhorse and you run parallel cloud sandbox tasks daily.' },
    ],
    toolPathZh: '/whenreset/codex/',
    toolPathEn: '/en/whenreset/codex/',
    toolLabelZh: '查看 OpenAI Codex 最新重置与发卡记录 →',
    toolLabelEn: 'View Latest OpenAI Codex Reset & Bonus Card Records →',
    faqZh: [
      { q: '官方发的 Codex 重置卡（Reset Card）会自动生效吗？', a: '不会。全局重置是系统自动清零，而重置卡属于手动核销福利（Banked Rollover），建议在额度即将见底且准备开始大任务前手动使用，并注意不要留到常规自动周重置时被覆盖。' },
    ],
    faqEn: [
      { q: 'Do OpenAI Codex Reset Cards apply automatically?', a: 'No. While global resets clear usage automatically, Reset Cards are manual vouchers (banked rollovers) that eligible users must claim or trigger before an automatic weekly rollover overwrites their cycle.' },
    ],
  },
  {
    slug: 'sonnet-vs-codex-vs-deepseek-vs-gemini-coding-cost',
    badge: 'MODEL PRICING BENCHMARK · 550M/MO',
    titleZh: 'Claude Sonnet vs GPT-5.6 Codex vs DeepSeek V3/R1 vs Gemini 2.5 Pro：AI 编程月度成本与缓存省钱率对决',
    titleEn: 'Claude Sonnet vs GPT-5.6 Codex vs DeepSeek V3/R1 vs Gemini 2.5 Pro: AI Coding Cost Benchmark',
    seoTitleZh: 'Claude vs Codex vs DeepSeek vs Gemini 编程成本对比 | T Salon',
    seoTitleEn: 'Claude Sonnet vs Codex vs DeepSeek vs Gemini Coding Cost | T Salon',
    descZh: '基于月吞吐 5.5 亿 Token（日均 2,500 万 × 22 天，输出占比 2%）的真实 Agent 编码负载，对比 Claude Sonnet、Opus、GPT-5.6 Sol、DeepSeek V3/R1 与 Gemini 2.5 Pro 在 85% 与 0% 缓存命中下的精确月账单。',
    descEn: 'Deterministic monthly cost comparison of Claude 3.5 Sonnet, Opus, GPT-5.6 Codex, DeepSeek V3/R1, and Gemini 2.5 Pro on a 550M tokens/month coding workload at 85% vs 0% prompt cache hit rates.',
    directVerdictZh: '在月吞吐 5.5 亿 Token（日均 2,500 万 × 22 天，85% 缓存命中，2% 输出）的标准主力编程负载下：DeepSeek V3/R1 API 月成本仅需 $65.09（极致性价比，适合预算敏感型纯 API 工作流）；Gemini 2.5 Pro 为 $284.63；Claude 3.5 / Sonnet 为 $519.75；OpenAI Codex / GPT-5.6 Sol 为 $693.00；Claude Opus / Fable 5 高达 $1,732.50。因此使用 Sonnet/Opus/Codex 的重度开发者走 $100/$200 包月订阅最划算，而纯 API 大规模批处理首选 DeepSeek 或 GPT-5.6 Luna ($36.85/月)。',
    directVerdictEn: 'On a standardized 550M tokens/month workload (25M/day × 22 days, 85% cache hit, 2% output): DeepSeek V3/R1 costs just $65.09/mo on pure API; Gemini 2.5 Pro costs $284.63/mo; Claude 3.5 Sonnet costs $519.75/mo; OpenAI Codex (GPT-5.6 Sol) costs $693.00/mo; and Claude Opus costs $1,732.50/mo. Flat-rate $100/$200 subscriptions win decisively for flagship Claude/Codex usage, while DeepSeek and GPT-5.6 Luna ($36.85/mo) dominate pay-as-you-go API batch tasks.',
    columnsZh: ['模型', '单价（输入 / 缓存读 / 输出 每百万）', '85% 缓存命中月账单', '0% 缓存失效月账单', '缓存省钱幅度'],
    columnsEn: ['Model', 'Rates (In / Cache / Out per 1M)', '85% Cache Hit (/mo)', '0% Cache Miss (/mo)', 'Cache Savings'],
    rows: [
      {
        dimensionZh: 'Claude 3.5 / Sonnet',
        dimensionEn: 'Claude 3.5 / Sonnet',
        valuesZh: ['$3.00 / $0.30 / $15.00', '$519.75 / 月', '$1,782.00 / 月', '省 70.8%（差 3.43 倍）'],
        valuesEn: ['$3.00 / $0.30 / $15.00', '$519.75 / mo', '$1,782.00 / mo', '-70.8% (3.43x gap)'],
      },
      {
        dimensionZh: 'OpenAI Codex / GPT-5.6 Sol',
        dimensionEn: 'OpenAI Codex / GPT-5.6 Sol',
        valuesZh: ['$4.00 / $0.40 / $20.00', '$693.00 / 月', '$2,376.00 / 月', '省 70.8%（差 3.43 倍）'],
        valuesEn: ['$4.00 / $0.40 / $20.00', '$693.00 / mo', '$2,376.00 / mo', '-70.8% (3.43x gap)'],
      },
      {
        dimensionZh: 'Claude Opus / Fable 5',
        dimensionEn: 'Claude Opus / Fable 5',
        valuesZh: ['$10.00 / $1.00 / $50.00', '$1,732.50 / 月', '$5,940.00 / 月', '省 70.8%（差 3.43 倍）'],
        valuesEn: ['$10.00 / $1.00 / $50.00', '$1,732.50 / mo', '$5,940.00 / mo', '-70.8% (3.43x gap)'],
      },
      {
        dimensionZh: 'Gemini 2.5 Pro',
        dimensionEn: 'Gemini 2.5 Pro',
        valuesZh: ['$1.25 / $0.30 / $5.00', '$284.63 / 月', '$728.75 / 月', '省 60.9%（差 2.56 倍）'],
        valuesEn: ['$1.25 / $0.30 / $5.00', '$284.63 / mo', '$728.75 / mo', '-60.9% (2.56x gap)'],
      },
      {
        dimensionZh: 'DeepSeek V3 / R1 (API)',
        dimensionEn: 'DeepSeek V3 / R1 (API)',
        valuesZh: ['$0.27 / $0.07 / $1.10', '$65.09 / 月', '$156.20 / 月', '省 58.3%（API 极低地板价）'],
        valuesEn: ['$0.27 / $0.07 / $1.10', '$65.09 / mo', '$156.20 / mo', '-58.3% (Ultra-low API floor)'],
      },
      {
        dimensionZh: 'GPT-5.6 Luna (Mini)',
        dimensionEn: 'GPT-5.6 Luna (Mini)',
        valuesZh: ['$0.20 / $0.02 / $1.20', '$36.85 / 月', '$121.00 / 月', '省 69.5%（高频子任务首选）'],
        valuesEn: ['$0.20 / $0.02 / $1.20', '$36.85 / mo', '$121.00 / mo', '-69.5% (Sub-agent workhorse)'],
      },
    ],
    whenToChooseZh: [
      { option: '主力架构与复杂重构用 Sonnet / Codex', reason: '工具调用稳定性与多文件一次通过率最高，配合 $100/$200 订阅可锁定固定月费上限。' },
      { option: '高频单测生成与日志分析分流给 DeepSeek / Luna / Flash', reason: '按量单价仅为旗舰模型的 1/10 到 1/20，不占用宝贵的旗舰 5 小时配额。' },
    ],
    whenToChooseEn: [
      { option: 'Use Sonnet / Codex for core multi-file architecture', reason: 'Highest tool-use reliability and first-pass patch accuracy, best paired with $100/$200 flat-rate plans.' },
      { option: 'Route sub-tasks & test generation to DeepSeek / Luna / Flash', reason: 'Costs 10x–20x less per token and preserves your flagship 5-hour quota window.' },
    ],
    toolPathZh: '/reports/',
    toolPathEn: '/en/reports/',
    toolLabelZh: '查看完整《2026 AI 编程消耗与缓存效率基准报告》→',
    toolLabelEn: 'Read the Full 2026 AI Coding Token & Cache Benchmark Report →',
    faqZh: [
      { q: '为什么所有模型的 0% 缓存账单都比 85% 缓存贵 2.5 到 3.4 倍？', a: '因为 Agent 编程中 85% 的吞吐量是在重复读取仓库代码和系统提示词。只要前缀不发生动态漂移，这部分 Token 都按 10%–25% 的缓存读取价计费。' },
    ],
    faqEn: [
      { q: 'Why does a 0% cache hit rate multiply every model’s monthly bill by 2.5x–3.4x?', a: 'Because roughly 85% of tokens in agentic coding come from re-reading system rules and repository context on each turn. Healthy prefix caching discounts those reads by 75%–90%.' },
    ],
  },
  {
    slug: 'cursor-500-fast-requests-vs-claude-5-hour-window',
    badge: 'QUOTA MECHANICS · REQUESTS VS WINDOWS',
    titleZh: 'Cursor Pro 500 次 Fast Requests vs Claude 5 小时滑动窗口：哪种计费更抗限流？',
    titleEn: 'Cursor Pro 500 Fast Requests vs Claude 5-Hour Rolling Window: Which Quota Lasts Longer?',
    seoTitleZh: 'Cursor 500次快速请求 vs Claude 5小时窗口对比 | T Salon',
    seoTitleEn: 'Cursor 500 Fast Requests vs Claude 5-Hour Window | T Salon',
    descZh: '对比 Cursor Pro 的「按月 500 次请求包干」与 Claude Pro/Max 的「5 小时滑动窗口 + 7 天周限额」两种限流模型：哪种工作流容易在月中旬耗尽 Cursor，哪种容易在下午锁死 Claude？',
    descEn: 'Compare Cursor Pro’s 500 monthly Fast Requests against Claude’s 5-hour rolling window and 7-day weekly cap: understand how each quota meters multi-file refactors and how to pace both.',
    directVerdictZh: 'Cursor Pro（月度 500 次 Fast Requests，折合每天约 16–22 次）适合「短平快、每次只改 1–2 个文件」的日常开发，但如果开启 Composer / Max Mode 跑跨仓库大循环，往往 10 天就会烧光整月 500 次配额；Claude 的「5 小时滑动窗口」每 5 小时就能满血复活一次，月总吞吐上限远高于 500 次请求，但要求单次会话不超过 60K–80K Token，否则会在单一下午被锁死 2–3 小时。',
    directVerdictEn: 'Cursor Pro’s 500 monthly Fast Requests (~16–22 requests/day) excel at bursts of targeted 1–2 file edits, but multi-file Composer / Max Mode loops can drain all 500 requests in 10 days. Claude’s 5-hour rolling window refreshes up to several times a day—offering far higher monthly token throughput—provided you compact sessions so you do not lock yourself out mid-afternoon.',
    columnsZh: ['维度', 'Cursor Pro（月度 500 次 Fast Requests）', 'Claude Pro / Max（5 小时窗口 + 7 天周限额）'],
    columnsEn: ['Dimension', 'Cursor Pro (500 Monthly Fast Requests)', 'Claude Pro / Max (5h Window + 7d Weekly Cap)'],
    rows: [
      {
        dimensionZh: '计量单位',
        dimensionEn: 'Metering Unit',
        valuesZh: ['按请求次数（Request Count）扣减；Max Mode 按倍率或 Token 扣减', '按实际输入/输出/缓存权重 Token 总量（Token Weight）动态扣减'],
        valuesEn: ['Per request count (Max Mode consumes multiple requests/tokens)', 'Dynamic token-weighted capacity across input, output, and cache'],
      },
      {
        dimensionZh: '刷新周期',
        dimensionEn: 'Refresh Cycle',
        valuesZh: ['每 30 天（按个人账单日）一次性重置 500 次', '每 5 小时（自窗口首条消息起）滚动刷新 + 每 7 天刷新周限额'],
        valuesEn: ['Resets all 500 requests once every 30-day billing cycle', 'Refreshes 5 hours after your first message + 7-day weekly reset'],
      },
      {
        dimensionZh: '最怕的耗尽陷阱',
        dimensionEn: 'Biggest Depletion Trap',
        valuesZh: ['月初密集用 Composer / Agent 自动跑测试循环，月中提前归零', '单会话不 `/clear` 累积到 150K+ Token，1 小时内把当前 5 小时窗口吃空'],
        valuesEn: ['Heavy Composer / Max Mode loops early in the month draining all 500 requests', 'Letting a single session snowball past 150K tokens and locking out for 3–4 hours'],
      },
      {
        dimensionZh: '安全配速基准线',
        dimensionEn: 'Safe Daily Pacing Benchmark',
        valuesZh: ['每月 22 个工作日：每天控制在 20–22 次 Fast Requests 以内', '每周 7 天周期：每天控制在周总额度的 14.2% 以内，每 3–5 个文件执行 `/compact`'],
        valuesEn: ['~20–22 Fast Requests per working day (over 22 days/mo)', '~14.2% of weekly quota per day; run `/compact` every 3–5 files'],
      },
    ],
    whenToChooseZh: [
      { option: '用 Cursor 500 次估算器控速', reason: '每月过半时输入已用次数，立刻算出剩余每天还能用几次 Fast Requests。' },
      { option: '用 Claude 5 小时窗口计算器排期', reason: '早上 09:00 发首条消息开启窗口，14:00 准时迎来下午场满血重置。' },
    ],
    whenToChooseEn: [
      { option: 'Pace Cursor with the 500 Fast Requests Calculator', reason: 'Check your daily request allowance mid-month before turning on Max Mode.' },
      { option: 'Anchor Claude with the 5-Hour Window Calculator', reason: 'Send your first morning prompt at 09:00 so your afternoon window refreshes right at 14:00.' },
    ],
    toolPathZh: '/whenreset/cursor-fast-requests/',
    toolPathEn: '/en/whenreset/cursor-fast-requests/',
    toolLabelZh: '打开 Cursor 500 次请求估算器与 5 小时计算器 →',
    toolLabelEn: 'Open the Cursor 500 Fast Requests & 5-Hour Calculators →',
    faqZh: [
      { q: 'Cursor 500 次 Fast Requests 用完后会彻底不能用吗？', a: '不会彻底断网，账号会转入无限次的慢速队列（Slow Requests），但在高峰期可能需要排队数秒至数十秒；也可以按需开启 Usage-Based Pricing 按量付费。' },
    ],
    faqEn: [
      { q: 'Does Cursor stop working completely after 500 Fast Requests?', a: 'No. Your account falls back to unlimited Slow Requests (which queue during peak traffic), or you can opt into usage-based billing per request.' },
    ],
  },
];
