export interface ErrorGuideEntry {
  slug: string;
  code: string;
  product: string;
  titleZh: string;
  titleEn: string;
  seoTitleZh: string;
  seoTitleEn: string;
  descZh: string;
  descEn: string;
  directAnswerZh: string;
  directAnswerEn: string;
  causesZh: string[];
  causesEn: string[];
  stepsZh: { step: string; detail: string }[];
  stepsEn: { step: string; detail: string }[];
  toolPathZh: string;
  toolPathEn: string;
  toolLabelZh: string;
  toolLabelEn: string;
  faqZh: { q: string; a: string }[];
  faqEn: { q: string; a: string }[];
}

export const ERROR_GUIDES: ErrorGuideEntry[] = [
  {
    slug: 'claude-5-hour-limit-reached',
    code: 'You’ve reached your 5-hour usage limit',
    product: 'Claude Code / Claude Pro / Max',
    titleZh: 'Claude Code 提示 5 小时使用上限（5-hour limit reached）何时恢复与排查',
    titleEn: 'Claude Code "5-Hour Usage Limit Reached": Recovery Time & Fixes',
    seoTitleZh: 'Claude Code 5小时限制恢复时间计算与报错排查 | T Salon',
    seoTitleEn: 'Claude Code 5-Hour Limit Reached: When Does It Reset? | T Salon',
    descZh: '遇到 Claude Code 或 Claude Pro 报错 "You’ve reached your limit"？解析 5 小时滑动窗口起点规则，教你推算准确恢复时刻并减少上下文重复消耗。',
    descEn: 'Hit "You’ve reached your limit" in Claude Code or Claude Pro? Learn why the 5-hour rolling window starts from your first message and how to calculate recovery.',
    directAnswerZh: 'Claude 的 5 小时限额采用「滑动窗口」而非报错时刻起算：恢复时间 = 本轮窗口内第一条有效请求时间 + 5 小时，而不是触发报错的时间加 5 小时。',
    directAnswerEn: 'Claude enforces a 5-hour rolling session window starting from the first message of the active cycle—not 5 hours after the rate-limit error appeared.',
    causesZh: [
      '长会话不断累积历史上下文（每轮都在重发几万 Token），导致单次对话迅速吃满 5 小时窗口额度；',
      '误把“触顶报错时刻”当成窗口起点，导致错误估算恢复时间；',
      '同时在多个终端标签页并行运行 Claude Code 子任务，叠加占用同一账号的 5 小时配额。',
    ],
    causesEn: [
      'Long uncompacted sessions resend tens of thousands of context tokens on every turn, draining the 5-hour cap rapidly.',
      'Assuming the 5-hour timer begins when you hit the error rather than when the first request in that window was sent.',
      'Running parallel Claude Code sessions across multiple terminals sharing the same account quota.',
    ],
    stepsZh: [
      { step: '1. 查清窗口第一条请求时间并推算恢复点', detail: '去本地日志或控制台翻出本轮密集编码的第一条请求时间，打开 WhenReset Claude 计算器填入该起点，直接得出北京时间解封时刻。' },
      { step: '2. 确认是否触发了全网异常重置', detail: '前往 T Salon Claude 重置雷达确认官方近期是否刚发布全网全局重置或补偿通知。' },
      { step: '3. 用 /compact 或新建会话截断无效上下文', detail: '恢复后养成习惯：每完成一个独立子任务就运行 /compact 或重开干净会话，可延长单轮 5 小时窗口的可用次数 2–3 倍。' },
    ],
    stepsEn: [
      { step: '1. Find your window start and compute recovery', detail: 'Check your client logs for the timestamp of the first prompt in the active burst and enter it into the WhenReset Claude 5-hour calculator.' },
      { step: '2. Check for global reset events', detail: 'Verify on the WhenReset Claude Radar whether Anthropic recently issued an all-user global reset or incident recovery.' },
      { step: '3. Compact or reset context between tasks', detail: 'Run /compact or start a fresh session after each completed subtask to stop re-sending stale context on every turn.' },
    ],
    toolPathZh: '/whenreset/claude/',
    toolPathEn: '/en/whenreset/claude/',
    toolLabelZh: '打开 Claude 5 小时恢复时间计算器 →',
    toolLabelEn: 'Open Claude 5-Hour Recovery Calculator →',
    faqZh: [
      { q: '为什么我等了 2 小时突然又可以用了？', a: '因为你这轮 5 小时窗口早在 3 小时前发第一条消息时就已经开始计时了，所以报错后只需再等剩下的 2 小时即可恢复。' },
      { q: '换模型（比如从 Opus 切到 Sonnet）能绕过 5 小时限制吗？', a: '部分套餐在特定时期对不同模型有差异化的消耗权重，但共享同一个账号的 5 小时总配额池；在非复杂架构阶段优先用 Sonnet/Haiku 可显著延迟触顶。' },
    ],
    faqEn: [
      { q: 'Why did my Claude quota recover only 2 hours after hitting the limit?', a: 'Because your first request in that cycle occurred 3 hours before you hit the cap, leaving only 2 hours until the 5-hour rolling window elapsed.' },
      { q: 'Does switching from Opus to Sonnet bypass the 5-hour limit?', a: 'They share the same account session pool, though lighter models consume quota much more slowly per turn during routine edits.' },
    ],
  },
  {
    slug: 'claude-weekly-limit-exhausted',
    code: 'Weekly usage limit reached',
    product: 'Claude Pro / Max (7-Day Rolling)',
    titleZh: 'Claude Pro / Max 周度限额（Weekly Limit）提前耗尽怎么办',
    titleEn: 'Claude Pro / Max "Weekly Usage Limit Reached": Pacing & Alternatives',
    seoTitleZh: 'Claude 周限额用完怎么办？7天周期节奏规划与 API 成本对比 | T Salon',
    seoTitleEn: 'Claude Weekly Limit Reached: Pacing Planner & API Cost Check | T Salon',
    descZh: '周二就把 Claude Pro / Max 每周额度烧光？解析 7 天滚动周期的每日安全预算算法，并对比临时切换按量 API 的成本差距。',
    descEn: 'Burned through your Claude Pro or Max weekly limit by Tuesday? Use our weekly quota planner to pace daily usage and check API vs subscription break-even.',
    directAnswerZh: 'Claude 周度限额按 7 天周期独立计算，即使 5 小时窗口已恢复，周限额未刷新前仍会被拦截；建议将每日消耗控制在剩余天数的均摊上限内，或对比按量 API 临时兜底。',
    directAnswerEn: 'Claude’s 7-day weekly limit is enforced independently of the 5-hour session cap; once exhausted, you must wait for your personal weekly reset or fall back to pay-as-you-go API.',
    causesZh: [
      '周一、周二集中跑全仓库重构或自动化测试修复，两天内吃掉 80%+ 周配额；',
      '持续使用高权重推理模型处理本可用轻量模型完成的日常检索和单测生成。',
    ],
    causesEn: [
      'Running heavy repository-wide refactors or automated test loops on Monday and Tuesday, consuming 80%+ of the 7-day budget early.',
      'Using heavyweight reasoning tiers for routine file lookups and boilerplate edits.',
    ],
    stepsZh: [
      { step: '1. 计算剩余天数的安全日预算', detail: '打开 WhenReset 周额度规划器，输入当前已用百分比和下次重置时间，算出每天最多还能消耗多少百分比。' },
      { step: '2. 测算临时切 API 的等效成本', detail: '如果本周必须赶工交付，打开 AI 编程成本计算器评估切换 API 按量付费（开启 85% Prompt Caching）需要补多少钱，避免盲目升级更高档订阅。' },
    ],
    stepsEn: [
      { step: '1. Calculate your safe daily percentage budget', detail: 'Enter your current percentage used and personal reset time in the WhenReset Weekly Quota Planner to see your daily burn ceiling.' },
      { step: '2. Compare emergency API fallback cost', detail: 'If you have a deadline, check the AI Cost Calculator with your expected cache hit rate before upgrading tiers.' },
    ],
    toolPathZh: '/whenreset/claude/#weekly-calculator-app',
    toolPathEn: '/en/whenreset/claude/#weekly-calculator-app',
    toolLabelZh: '使用每周额度规划计算器 →',
    toolLabelEn: 'Open Weekly Quota Planner →',
    faqZh: [
      { q: '全网重置记录会让我的个人周限额立刻清零吗？', a: '只有当官方明确执行「面向全部用户的全局重置」时才会影响所有账号；常规发卡或局部修复通常仅覆盖原帖说明的受影响范围。' },
    ],
    faqEn: [
      { q: 'Does a public reset record clear my personal weekly limit?', a: 'Only confirmed all-user global resets clear every account; targeted resets and bonus cards apply strictly to the scope stated in the source announcement.' },
    ],
  },
  {
    slug: 'codex-usage-limit-and-reset-card',
    code: 'Codex usage limit exceeded',
    product: 'OpenAI Codex (ChatGPT Plus / Pro)',
    titleZh: 'OpenAI Codex 额度耗尽报错与 Reset Card（重置卡）使用排查',
    titleEn: 'OpenAI Codex Usage Limit Exceeded & Reset Card Troubleshooting',
    seoTitleZh: 'OpenAI Codex 额度耗尽与重置卡 (Reset Card) 区别排查 | T Salon',
    seoTitleEn: 'OpenAI Codex Usage Limit & Reset Card Explained | T Salon',
    descZh: '遇到 OpenAI Codex 限流提示？分清全局重置、局部补偿与 Reset Card 重置卡的区别，实时查询历史间隔参考与恢复时间。',
    descEn: 'Hit an OpenAI Codex usage limit? Understand the difference between global resets, scoped resets, and bonus reset cards with live event records.',
    directAnswerZh: 'Codex 触顶后请先区分「官方全局重置」与「Reset Card（重置卡）」：重置卡是针对特定订阅层级或活动发放的补偿资格，通常需按原帖说明领取或核销，不会自动刷新全部账号。',
    directAnswerEn: 'When Codex hits a usage cap, check whether the latest announcement is an all-user global reset or a bonus Reset Card, as cards often target specific plans or require manual redemption.',
    causesZh: [
      '并发启动多个 Codex 云端沙箱或跨仓库 PR 审查任务，短时间内消耗完当前周/窗口额度；',
      '将社区转发的“发卡公告”误判为全网自动清零。',
    ],
    causesEn: [
      'Spawning parallel Codex cloud sandboxes or automated PR review tasks that rapidly deplete the active window.',
      'Mistaking a targeted bonus reset card post for an automatic all-user quota wipe.',
    ],
    stepsZh: [
      { step: '1. 核对最新 Codex 事件类型与原帖说明', detail: '进入 WhenReset Codex 专属雷达，查看最近事件是「全局重置」还是「重置卡」，并点击表格中的「推文 ↗」核实适用订阅范围。' },
      { step: '2. 估算历史全局重置间隔与本地消耗', detail: '查看近 30 天全局重置间隔中位数作为节奏参考，并可在 TokenRank 对比同行使用 Codex 的常见日均用量。' },
    ],
    stepsEn: [
      { step: '1. Verify the latest Codex event scope', detail: 'Check the WhenReset Codex Radar to see whether the latest record is a global reset or a card, and click the source post link to confirm eligibility.' },
      { step: '2. Check historical cadence & usage benchmarks', detail: 'Review the median global reset gap as a pacing reference and compare typical Codex token consumption on TokenRank.' },
    ],
    toolPathZh: '/whenreset/codex/',
    toolPathEn: '/en/whenreset/codex/',
    toolLabelZh: '查看 OpenAI Codex 实时重置与发卡雷达 →',
    toolLabelEn: 'Check OpenAI Codex Reset Radar →',
    faqZh: [
      { q: 'Codex 的历史间隔参考点准吗？', a: '它是基于过往已收录全局重置时间戳中位数做的算术参考，并非 OpenAI 官方排期，个人实际恢复请以 ChatGPT / Codex 客户端显示为准。' },
    ],
    faqEn: [
      { q: 'Is the Codex historical cadence reference an official schedule?', a: 'No. It is an arithmetic reference derived from past global reset intervals; always rely on your Codex client for your personal schedule.' },
    ],
  },
  {
    slug: 'prompt-cache-miss-high-cost',
    code: 'Low Prompt Cache Hit Rate / Cost Spike',
    product: 'Claude / OpenAI API & Coding Agents',
    titleZh: 'Prompt Caching 缓存未命中导致 AI 编程费用暴涨排查指南',
    titleEn: 'Prompt Cache Misses & Sudden AI Coding Cost Spikes: How to Fix',
    seoTitleZh: 'Prompt Caching 缓存未命中原因与费用暴涨排查 | T Salon',
    seoTitleEn: 'Fixing Prompt Cache Misses & AI Coding Cost Spikes | T Salon',
    descZh: '为什么同样的代码量账单突然翻了 5 倍？解析 Prompt Caching 前缀破坏常见原因（动态时间戳、频繁切模型/工具列表），附成本差异对比表。',
    descEn: 'Why did your AI coding bill jump 5x for the same workload? Identify common prompt cache-busting mistakes like dynamic timestamps or model switching.',
    directAnswerZh: '在长上下文 AI 编程中，正常缓存读占比应达到 80%–95%；一旦因为动态系统提示词、频繁切换模型或超出缓存 TTL 导致命中率跌破 30%，单次任务费用会立即暴涨 5–8 倍。',
    directAnswerEn: 'Healthy agentic coding sessions hit 80%–95% prompt cache reads. When dynamic system prompts, mid-session model switching, or expired cache TTLs break prefix matching, costs surge 5x–8x.',
    causesZh: [
      'System Prompt 头部拼接了实时时间戳、随机数或动态变化的当前时间，导致每轮前缀 Hash 全部失效；',
      '在同一长会话中途频繁切换不同模型或增删 MCP 工具定义列表，破坏了前缀稳定性；',
      '单轮思考暂停时间超过了服务商的缓存保留窗口（如 5 分钟或 12 小时 TTL），恢复后触发全量重新写入。',
    ],
    causesEn: [
      'Injecting volatile timestamps or random IDs near the top of the system prompt, invalidating the prefix hash on every turn.',
      'Switching models or mutating MCP tool definitions mid-session, breaking prefix continuity.',
      'Pausing longer than the provider cache TTL, forcing a full uncached context write when resuming.',
    ],
    stepsZh: [
      { step: '1. 用成本计算器量化 0% vs 85% 缓存的账单差额', detail: '打开 AI 编程成本计算器，分别点击「主力编码 (85% 缓存)」与「缓存全失效对照 (0% 缓存)」预设，直观查看月度差价。' },
      { step: '2. 固定前缀并对齐 TokenRank 健康基准', detail: '将动态变量移到对话末尾或 User Message，稳定 Tool Schema 顺序，并对照 TokenRank 社区实测工具缓存率检查是否达标。' },
    ],
    stepsEn: [
      { step: '1. Quantify the cost impact of cache misses', detail: 'Open the AI Cost Calculator and toggle between the 85% Cache and 0% Cache-Miss presets to see the exact monthly dollar impact.' },
      { step: '2. Stabilize your prompt prefix', detail: 'Move dynamic timestamps to the end of the user turn, keep tool schemas static, and benchmark your hit rate against TokenRank.' },
    ],
    toolPathZh: '/calculator/',
    toolPathEn: '/en/calculator/',
    toolLabelZh: '在成本计算器中对比 0% vs 85% 缓存费用 →',
    toolLabelEn: 'Compare 0% vs 85% Cache Costs →',
    faqZh: [
      { q: '为什么我在不同工具里的缓存命中率不一样？', a: '不同客户端（如 Claude Code 与 Codex）的上下文压缩策略和缓存 TTL 机制不同，可以在 TokenRank 首页底部「工具实测分布表」查看各工具的社区真实均值。' },
    ],
    faqEn: [
      { q: 'Why do cache hit rates differ across coding tools?', a: 'Each client implements different context compaction and cache TTL strategies. You can view live community averages by tool in the benchmark table on TokenRank.' },
    ],
  },
  {
    slug: 'cursor-fast-requests-exhausted',
    code: 'Fast requests limit reached',
    product: 'Cursor Pro (500 Fast Requests / 30d)',
    titleZh: 'Cursor 500 次 Fast Requests 耗尽后如何规划节奏与评估替代方案',
    titleEn: 'Cursor 500 Fast Requests Exhausted: Monthly Pacing & API Math',
    seoTitleZh: 'Cursor 500 次快速请求用完怎么办？30天配额规划与成本对比 | T Salon',
    seoTitleEn: 'Cursor 500 Fast Requests Exhausted: Pacing & Cost Math | T Salon',
    descZh: 'Cursor Pro 每月 500 次 Fast Requests 不到半个月就用完了？使用 30 天月度配额规划器稳住每日调用上限，并测算溢价按量或搭配 Claude Code 的成本。',
    descEn: 'Running out of Cursor Pro’s 500 monthly fast requests mid-month? Pace your 30-day cycle with our quota planner and evaluate pay-as-you-go alternatives.',
    directAnswerZh: 'Cursor Pro 30 天周期平均每天约 16 次快速请求；若前半月高强度用 Composer/Agent 模式极易提前耗尽。建议开启 30 天规划器控速，并用成本计算器评估超出后买按量或切工具的账单差异。',
    directAnswerEn: 'Cursor Pro’s 500 fast requests average ~16 per day over a 30-day cycle. Heavy multi-file Agent mode early in the month quickly burns through them; use our 30-day planner to pace daily calls.',
    causesZh: [
      '把简单的单行补全和文档问答也放在高倍消耗的旗舰推理模型上执行；',
      '没有按 30 天账单周期分配每日请求预算，前半月耗尽后陷入慢速排队或额外按量扣费。',
    ],
    causesEn: [
      'Routing routine single-file edits and simple questions through high-multiplier reasoning models.',
      'Burning through the 500-request pool in the first 10 days without tracking daily pacing.',
    ],
    stepsZh: [
      { step: '1. 使用 Cursor 30 天预设算出每日安全请求数', detail: '进入 WhenReset 周/月度配额规划器，选择「Cursor (月度 500 次)」预设并输入当前已用比例，立即获得剩余天数的每日预算建议。' },
      { step: '2. 对比溢出付费 vs 搭配其它订阅', detail: '用 AI 编程成本计算器评估每月实际原始 Token 量，判断是直接在 Cursor 内买超额包，还是分流部分重型重构到独立订阅/高性价比 API。' },
    ],
    stepsEn: [
      { step: '1. Calculate your safe daily budget with the Cursor 30d preset', detail: 'Open the Quota Planner, select the Cursor (Monthly 500) preset, and enter your current percentage used to get a daily allowance.' },
      { step: '2. Compare overage pricing vs multi-tool splitting', detail: 'Use the AI Cost Calculator to check whether paying Cursor overages or offloading heavy tasks to an API/secondary plan is cheaper.' },
    ],
    toolPathZh: '/whenreset/#weekly-calculator-app',
    toolPathEn: '/en/whenreset/#weekly-calculator-app',
    toolLabelZh: '打开 Cursor 30 天配额规划器 →',
    toolLabelEn: 'Open Cursor 30-Day Quota Planner →',
    faqZh: [
      { q: '为什么有时候一次对话扣了不止 1 次 Fast Request？', a: '在较新的计费策略下，部分高成本模型或超长上下文 Agent 调用会按倍率折算消耗，具体以 Cursor 控制台当月用量明细为准。' },
    ],
    faqEn: [
      { q: 'Why does a single prompt sometimes consume more than 1 fast request?', a: 'Depending on the selected model and long-context mode, certain frontier models or multi-step agent calls carry higher request multipliers.' },
    ],
  },
];
