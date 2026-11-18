export interface ErrorGuideEntry {
  slug: string;
  code: string;
  product: string;
  widgetType?: 'five-hour' | 'cache-diff';
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
  relatedArticleZh?: { title: string; path: string };
  relatedArticleEn?: { title: string; path: string };
  faqZh: { q: string; a: string }[];
  faqEn: { q: string; a: string }[];
}

export const ERROR_GUIDES: ErrorGuideEntry[] = [
  {
    slug: 'claude-5-hour-limit-reached',
    code: 'You’ve reached your 5-hour usage limit',
    product: 'Claude Code / Claude Pro / Max',
    widgetType: 'five-hour',
    titleZh: 'Claude Code 提示 5 小时使用上限（5-hour limit reached）何时恢复与排查',
    titleEn: 'Claude Code "5-Hour Usage Limit Reached": Recovery Time & Fixes',
    seoTitleZh: 'Claude Code 5小时限制恢复时间计算与报错排查 | T Salon',
    seoTitleEn: 'Claude Code 5-Hour Limit Reached: When Does It Reset? | T Salon',
    descZh: '遇到 Claude Code 或 Claude Pro 报错 "You’ve reached your limit"？解析 5 小时滑动窗口起点规则，直接在本页推算准确恢复时刻并减少上下文重复消耗。',
    descEn: 'Hit "You’ve reached your limit" in Claude Code or Claude Pro? Learn why the 5-hour rolling window starts from your first message and calculate your recovery time right here.',
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
      { step: '1. 查清窗口第一条请求时间并推算恢复点', detail: '去本地日志或控制台翻出本轮密集编码的第一条请求时间，直接在下方 5 小时计算器填入起点，即可算出北京时间解封时刻。' },
      { step: '2. 确认是否触发了全网异常重置', detail: '前往 T Salon Claude 重置雷达确认官方近期是否刚发布全网全局重置或补偿通知。' },
      { step: '3. 用 /compact 或新建会话截断无效上下文', detail: '恢复后养成习惯：每完成一个独立子任务就运行 /compact 或重开干净会话，可延长单轮 5 小时窗口的可用次数 2–3 倍。' },
    ],
    stepsEn: [
      { step: '1. Find your window start and compute recovery', detail: 'Check your client logs for the timestamp of the first prompt in the active burst and enter it into the embedded 5-hour calculator below.' },
      { step: '2. Check for global reset events', detail: 'Verify on the WhenReset Claude Radar whether Anthropic recently issued an all-user global reset or incident recovery.' },
      { step: '3. Compact or reset context between tasks', detail: 'Run /compact or start a fresh session after each completed subtask to stop re-sending stale context on every turn.' },
    ],
    toolPathZh: '/whenreset/claude/',
    toolPathEn: '/en/whenreset/claude/',
    toolLabelZh: '查看 Claude 实时重置记录与周规划器 →',
    toolLabelEn: 'View Claude Live Reset Radar & Planner →',
    relatedArticleZh: { title: 'AI 配额重置雷达实操指南：搞懂 Codex、Claude 与 Grok 额度规则', path: '/articles/ai-quota-reset-radar-guide/' },
    relatedArticleEn: { title: 'AI Quota Reset Radar Guide: Codex, Claude & Grok Rules', path: '/en/articles/ai-quota-reset-radar-guide/' },
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
    relatedArticleZh: { title: 'AI 编程成本与订阅盈亏计算器 ($20/$100/$200 对比)', path: '/calculator/' },
    relatedArticleEn: { title: 'AI Coding Cost & Subscription Break-Even Calculator', path: '/en/calculator/' },
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
    widgetType: 'five-hour',
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
      { step: '2. 推算窗口恢复时间与本地用量基准', detail: '用下方计算器按已知起点加 5 小时推算短窗口结束时间，并可在 TokenRank 对比同行使用 Codex 的常见日均用量。' },
    ],
    stepsEn: [
      { step: '1. Verify the latest Codex event scope', detail: 'Check the WhenReset Codex Radar to see whether the latest record is a global reset or a card, and click the source post link to confirm eligibility.' },
      { step: '2. Estimate window end & benchmark usage', detail: 'Use the 5-hour window calculator below if tracking a short session cap, and compare typical Codex token consumption on TokenRank.' },
    ],
    toolPathZh: '/whenreset/codex/',
    toolPathEn: '/en/whenreset/codex/',
    toolLabelZh: '查看 OpenAI Codex 实时重置与发卡雷达 →',
    toolLabelEn: 'Check OpenAI Codex Reset Radar →',
    relatedArticleZh: { title: 'GitHub 超四成 PR 由 Agent 起稿，多模型代码评审成本治理', path: '/articles/github-octoverse-agent-pr-code-review/' },
    relatedArticleEn: { title: 'TokenRank Live AI Coding Consumption Leaderboard', path: '/en/tokenrank/' },
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
    widgetType: 'cache-diff',
    titleZh: 'Prompt Caching 缓存未命中导致 AI 编程费用暴涨排查指南',
    titleEn: 'Prompt Cache Misses & Sudden AI Coding Cost Spikes: How to Fix',
    seoTitleZh: 'Prompt Caching 缓存未命中原因与费用暴涨排查 | T Salon',
    seoTitleEn: 'Fixing Prompt Cache Misses & AI Coding Cost Spikes | T Salon',
    descZh: '为什么同样的代码量账单突然翻了 5 倍？解析 Prompt Caching 前缀破坏常见原因（动态时间戳、频繁切模型/工具列表），附成本差异对比试算。',
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
      { step: '1. 用成本计算器量化 0% vs 85% 缓存的账单差额', detail: '查看下方实时缓存差价对比条，或打开完整 AI 编程成本计算器模拟不同缓存命中率下的月度支出。' },
      { step: '2. 固定前缀并对齐 TokenRank 健康基准', detail: '将动态变量移到对话末尾或 User Message，稳定 Tool Schema 顺序，并对照 TokenRank 社区实测工具缓存率检查是否达标。' },
    ],
    stepsEn: [
      { step: '1. Quantify the cost impact of cache misses', detail: 'Review the live cache-miss cost comparison below or open the full AI Cost Calculator to test different hit rates.' },
      { step: '2. Stabilize your prompt prefix', detail: 'Move dynamic timestamps to the end of the user turn, keep tool schemas static, and benchmark your hit rate against TokenRank.' },
    ],
    toolPathZh: '/calculator/',
    toolPathEn: '/en/calculator/',
    toolLabelZh: '在完整成本计算器中自定义测算 →',
    toolLabelEn: 'Open Full AI Cost Calculator →',
    relatedArticleZh: { title: '模型降价，Agent 成本还看什么？端到端任务账本拆解', path: '/articles/model-price-cut-agent-cost-evaluation/' },
    relatedArticleEn: { title: 'Cheaper Memory Can Still Make an Agent More Expensive', path: '/en/articles/cheaper-memory-can-still-make-an-agent-more-expensive/' },
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
    relatedArticleZh: { title: 'AI 编程成本与订阅盈亏计算器', path: '/calculator/' },
    relatedArticleEn: { title: 'AI Coding Cost & Subscription Break-Even Calculator', path: '/en/calculator/' },
    faqZh: [
      { q: '为什么有时候一次对话扣了不止 1 次 Fast Request？', a: '在较新的计费策略下，部分高成本模型或超长上下文 Agent 调用会按倍率折算消耗，具体以 Cursor 控制台当月用量明细为准。' },
    ],
    faqEn: [
      { q: 'Why does a single prompt sometimes consume more than 1 fast request?', a: 'Depending on the selected model and long-context mode, certain frontier models or multi-step agent calls carry higher request multipliers.' },
    ],
  },
  {
    slug: 'grok-supergrok-rate-limit',
    code: 'Grok / SuperGrok rate limit reached',
    product: 'xAI Grok / SuperGrok',
    widgetType: 'five-hour',
    titleZh: 'xAI Grok / SuperGrok 推理额度触顶限流与恢复时间排查',
    titleEn: 'xAI Grok & SuperGrok Rate Limit Reached: Recovery & Tracking',
    seoTitleZh: 'xAI Grok / SuperGrok 限流恢复时间与重置记录查询 | T Salon',
    seoTitleEn: 'xAI Grok & SuperGrok Rate Limit Recovery Tracker | T Salon',
    descZh: '使用 xAI Grok 或 SuperGrok 连续运行深度推理、代码检索时提示限流？查看实时全局重置记录并推算窗口恢复时间。',
    descEn: 'Hit a rate limit on xAI Grok or SuperGrok during heavy reasoning or coding sessions? Track live reset events and calculate window recovery times.',
    directAnswerZh: 'Grok 对常规对话、DeepSearch 与高算力推理模式采用分档滑动配额；遇到限流后请按已知窗口起点向后加 5 小时估算，或在 WhenReset Grok 雷达查看近期官方重置动态。',
    directAnswerEn: 'Grok enforces tiered rolling limits across standard chat, DeepSearch, and reasoning modes. Check the WhenReset Grok Radar for incident resets or calculate your 5-hour window end.',
    causesZh: [
      '连续触发高消耗的推理或 DeepSearch 长上下文检索任务；',
      '同一账号在 Web 与移动端多端高频并发调用。',
    ],
    causesEn: [
      'Triggering consecutive high-compute reasoning or DeepSearch queries with large context payloads.',
      'Concurrent high-frequency requests across web and mobile clients on the same account.',
    ],
    stepsZh: [
      { step: '1. 查询 xAI Grok 官方重置与补偿记录', detail: '前往 WhenReset Grok 专属页面核实近期是否存在服务恢复全局重置或发卡公告。' },
      { step: '2. 按已知起点推算短窗口解封时间', detail: '利用下方 5 小时窗口计算器输入本轮第一条调用时间，得出北京时间恢复参考。' },
    ],
    stepsEn: [
      { step: '1. Check live xAI Grok reset records', detail: 'Visit the WhenReset Grok Radar to verify whether xAI recently announced a service recovery or global reset.' },
      { step: '2. Estimate rolling window recovery', detail: 'Use the 5-hour window calculator below with your known burst start time.' },
    ],
    toolPathZh: '/whenreset/grok/',
    toolPathEn: '/en/whenreset/grok/',
    toolLabelZh: '查看 xAI Grok 实时重置雷达 →',
    toolLabelEn: 'View xAI Grok Reset Radar →',
    faqZh: [
      { q: 'Grok 限流时可以切到其它模型继续工作吗？', a: '不同推理模式（如普通对话与重度推理）往往有独立子配额，日常简单代码补全可先降级模式或切至备用工具。' },
    ],
    faqEn: [
      { q: 'Can I switch modes when Grok reasoning hits a rate limit?', a: 'Standard chat and heavy reasoning modes often carry separate sub-quotas, allowing lighter tasks to continue.' },
    ],
  },
  {
    slug: 'claude-code-context-window-full',
    code: 'Context length exceeded / Auto-compact triggered',
    product: 'Claude Code CLI',
    widgetType: 'cache-diff',
    titleZh: 'Claude Code 上下文窗口满载（Context Full）与 Token 消耗暴增优化',
    titleEn: 'Claude Code Context Window Full: Preventing Token Bloat & Slowdowns',
    seoTitleZh: 'Claude Code 上下文满载与 /compact 省 Token 实战指南 | T Salon',
    seoTitleEn: 'Claude Code Context Full: Using /compact & Subtasks to Save Tokens | T Salon',
    descZh: 'Claude Code 频繁触发 Auto-compact、响应变慢且 5 小时额度迅速见底？解析上下文膨胀根因与任务拆分、CLAUDE.md 精简技巧。',
    descEn: 'Claude Code triggering auto-compact too often and burning through your 5-hour limit? Learn how to trim CLAUDE.md, split tasks, and keep prompt caches warm.',
    directAnswerZh: '上下文越长，每轮重发的历史 Token 越庞大（单轮可达 15 万+ Token），既拖慢推理又极快耗尽 5 小时与周限额；通过主动 /compact 与按任务拆会话可立省 60% 以上用量。',
    directAnswerEn: 'Large contexts resend 150K+ tokens on every single turn, rapidly draining 5-hour and weekly limits. Proactive /compact calls and task-scoped sessions cut token burn by over 60%.',
    causesZh: [
      '在同一个终端会话里连续做 5 个以上不相关的功能或排障，导致海量旧日志和 diff 残留；',
      '读取了未经筛选的大型编译产物、lockfile 或完整测试日志进入对话历史。',
    ],
    causesEn: [
      'Chaining 5+ unrelated features or debugging loops inside a single terminal session.',
      'Reading large lockfiles, build artifacts, or verbose test logs directly into the context window.',
    ],
    stepsZh: [
      { step: '1. 善用 /compact [保留重点] 与 /clear', detail: '完成当前模块修改并跑通测试后，执行 /clear 开启新任务；若需保留关键架构约定，使用 /compact keep API contract。' },
      { step: '2. 在 .claudeignore 中屏蔽构建与依赖目录', detail: '排除 dist/、node_modules/ 和巨型日志目录，避免 Agent 误读无用文件瞬间撑爆上下文。' },
    ],
    stepsEn: [
      { step: '1. Run /compact with focus instructions or /clear', detail: 'Use /clear after finishing a module; when preserving decisions, pass explicit focus hints like /compact keep API schema.' },
      { step: '2. Exclude noisy directories in .claudeignore', detail: 'Block dist/, build/, and verbose log dumps so the agent never pulls megabytes of noise into context.' },
    ],
    toolPathZh: '/calculator/',
    toolPathEn: '/en/calculator/',
    toolLabelZh: '测算上下文膨胀对月度成本的影响 →',
    toolLabelEn: 'Calculate Context Bloat Cost Impact →',
    relatedArticleZh: { title: 'Agent 记忆与上下文过期治理：为什么需要淘汰旧信息', path: '/articles/openai-agents-api-long-task-memory/' },
    relatedArticleEn: { title: 'Why AI Agents Need to Know When a Memory Is Out of Date', path: '/en/articles/agent-memory-out-of-date/' },
    faqZh: [
      { q: '触发 Auto-compact 会导致 Prompt Cache 失效吗？', a: '会的。上下文被重新摘要压缩后，前缀发生变化，紧接着的第一轮请求需要重新写入缓存，因此主动按任务边界 /clear 往往更省额度。' },
    ],
    faqEn: [
      { q: 'Does Auto-compact invalidate the prompt cache?', a: 'Yes. Re-summarizing earlier turns alters the prompt prefix, causing a cache write on the next turn—making clean task boundaries even more cost-effective.' },
    ],
  },
  {
    slug: 'openai-codex-sandbox-limit',
    code: 'Codex cloud task limit / Sandbox timeout',
    product: 'OpenAI Codex Cloud & CLI',
    titleZh: 'OpenAI Codex 云端沙箱任务超限或长任务超时排查指南',
    titleEn: 'OpenAI Codex Cloud Task Limits & Sandbox Timeout Troubleshooting',
    seoTitleZh: 'OpenAI Codex 云端沙箱任务限制与长任务成本优化 | T Salon',
    seoTitleEn: 'OpenAI Codex Cloud Task Limits & Sandbox Timeouts | T Salon',
    descZh: 'Codex 云端环境并发任务受限或执行超时？解析云端沙箱与本地 Codex CLI 分工策略，以及长任务等待期的沙箱挂起成本评估。',
    descEn: 'Hitting OpenAI Codex cloud task caps or sandbox timeouts? Learn when to split tasks, offload to local Codex CLI, and manage long-running sandbox costs.',
    directAnswerZh: 'Codex 云端沙箱并发数与单任务时长受订阅档位与容器生命周期限制；建议将大重构拆分为小范围 PR 任务，并在等待人工确认或环境依赖安装耗时过长时切回本地 Codex CLI。',
    directAnswerEn: 'Codex cloud containers enforce per-tier concurrency and execution timeouts. Break large refactors into focused PR slices or switch to local Codex CLI for heavy local builds.',
    causesZh: [
      '单次任务要求构建全量依赖或跑超长端到端测试套件，触发沙箱单步执行超时；',
      '同时派发过多并行云端任务，撞上订阅等级的并发队列上限。',
    ],
    causesEn: [
      'Running full dependency installs or heavy E2E test suites inside a single cloud sandbox step.',
      'Dispatching too many parallel cloud tasks simultaneously beyond the plan’s concurrency cap.',
    ],
    stepsZh: [
      { step: '1. 预先固定环境镜像或缩小单次任务验收范围', detail: '只要求 Codex 验证受影响模块的单元测试，避免每次沙箱冷启动都重跑全仓库构建。' },
      { step: '2. 重型构建与本地联调切回本地 Codex CLI', detail: '利用本地硬件缓存跑构建，仅把独立、可并行的代码审阅与小模块生成交给云端沙箱。' },
    ],
    stepsEn: [
      { step: '1. Scope test commands to affected modules', detail: 'Instruct Codex to run targeted unit tests rather than full-repo builds inside ephemeral cloud containers.' },
      { step: '2. Offload heavy builds to local Codex CLI', detail: 'Keep local incremental build caches warm on your machine and reserve cloud sandboxes for parallelizable PRs.' },
    ],
    toolPathZh: '/whenreset/codex/',
    toolPathEn: '/en/whenreset/codex/',
    toolLabelZh: '查看 Codex 配额状态与重置记录 →',
    toolLabelEn: 'Check Codex Quota & Reset Records →',
    relatedArticleZh: { title: 'Render 让沙箱按需休眠，长任务怎样算成本？', path: '/articles/render-sandbox-sleep-long-task-cost/' },
    relatedArticleEn: { title: 'How to Choose a Production AI Memory System in 2026', path: '/en/articles/how-to-choose-a-production-ai-memory-system-in-2026/' },
    faqZh: [
      { q: '云端沙箱失败重试会重复扣额度吗？', a: '是的，每次重新生成与工具循环都会消耗新的推理 Token。拆小任务、明确验收测试命令能大幅降低重试浪费。' },
    ],
    faqEn: [
      { q: 'Do failed cloud sandbox retries consume extra quota?', a: 'Yes. Every retry loop incurs new inference tokens, so scoping tasks tightly and providing exact test commands reduces wasted spend.' },
    ],
  },
  {
    slug: 'gemini-cli-quota-exceeded-429',
    code: '429 Resource has been exhausted (e.g. check quota)',
    product: 'Google Gemini CLI / Antigravity / AI Studio',
    widgetType: 'five-hour',
    titleZh: 'Google Gemini CLI / Antigravity 报错 429 Resource has been exhausted 恢复时间与排查',
    titleEn: 'Google Gemini CLI & Antigravity "429 Resource Has Been Exhausted": Reset Time & Fixes',
    seoTitleZh: 'Gemini CLI 与 Antigravity 429 配额耗尽几点重置 | T Salon',
    seoTitleEn: 'Google Gemini CLI & Antigravity 429 Quota Exhausted Reset Time | T Salon',
    descZh: '遇到 Google Gemini API、Gemini CLI 或 Antigravity 报错 429 Resource has been exhausted？分清每分钟限制（RPM）、5 小时滑动窗口与太平洋午夜（北京时间 15:00/16:00）每日清零机制。',
    descEn: 'Hit "429 Resource has been exhausted" in Gemini CLI, Google AI Studio, or Antigravity? Distinguish 60s RPM bursts, 5-hour rolling windows, and Midnight PT (15:00/16:00 UTC+8) daily RPD resets.',
    directAnswerZh: 'Google Gemini 存在三层独立限制：每分钟并发（RPM/TPM，60 秒自动恢复）、Antigravity/Pro 按模型独立的 5 小时滑动窗口，以及 AI Studio / Gemini CLI 每日请求上限（RPD，固定在太平洋时间午夜 00:00 即北京时间 15:00 夏令时 / 16:00 冬令时准时清零）。',
    directAnswerEn: 'Google enforces three separate quota layers: per-minute bursts (RPM/TPM, recovering within 60 seconds), per-model rolling 5-hour windows in Antigravity/Pro, and daily RPD caps that reset at Midnight Pacific Time (15:00 PDT / 16:00 PST in Beijing Time).',
    causesZh: [
      '短时间内连续发送大文件检索或并发请求，触发每分钟 Token 上限（TPM）或请求数上限（RPM）；',
      '在 Antigravity 中长时间使用单一高阶推理模型跑大循环，耗尽了该模型的独立配额池；',
      '达到 Google AI Studio / Gemini CLI 免费层级的每日请求总上限（RPD），需等待太平洋午夜清零。',
    ],
    causesEn: [
      'Bursting large repository reads or parallel requests within 60 seconds, tripping RPM or TPM caps.',
      'Running extended agentic loops on a single flagship reasoning model in Antigravity, exhausting that model’s isolated quota bucket.',
      'Reaching the daily Requests Per Day (RPD) ceiling on Google AI Studio or Gemini CLI free tiers before Midnight PT.',
    ],
    stepsZh: [
      { step: '1. 先等 60 秒区分 RPM 瞬时限流与日度/窗口限额', detail: '若等待 1 分钟后重试即可恢复，说明只是触发了每分钟突发限制（RPM/TPM），适当降低并发即可。' },
      { step: '2. 在 Antigravity 中切换至 Flash / Flash-Lite 模型继续工作', detail: 'Antigravity 按模型独立计量配额（Per-Model Quota），高阶推理模型限流时，Flash 模型通常仍有充足余量。' },
      { step: '3. 查看每日太平洋午夜清零倒计时（北京时间 15:00 / 16:00）', detail: '若确认触发每日 RPD 上限，打开 T Salon Google 重置雷达查看今日距离 15:00（夏令时）或 16:00（冬令时）清零的剩余时间。' },
    ],
    stepsEn: [
      { step: '1. Wait 60 seconds to rule out RPM/TPM burst throttling', detail: 'If a retry succeeds after one minute, you only hit a per-minute rate limit rather than a daily or 5-hour lockout.' },
      { step: '2. Switch to Flash or Flash-Lite in Antigravity', detail: 'Because Antigravity isolates quota pools per model tier, switching from a flagship reasoning model to Flash lets you finish your task immediately.' },
      { step: '3. Check the Midnight PT daily reset countdown (15:00 / 16:00 UTC+8)', detail: 'If you exhausted your daily RPD cap, check the Google Reset Radar for the exact countdown to Midnight Pacific Time.' },
    ],
    toolPathZh: '/whenreset/google/',
    toolPathEn: '/en/whenreset/google/',
    toolLabelZh: '打开 Google Gemini / Antigravity 重置雷达 →',
    toolLabelEn: 'Open Google Gemini & Antigravity Reset Radar →',
    relatedArticleZh: { title: 'AI 编程 Prompt Caching 成本结构与配额规划实战', path: '/articles/prompt-caching-cost-and-quota-guide/' },
    relatedArticleEn: { title: 'Prompt Caching Cost & Quota Planning in AI Coding', path: '/en/articles/prompt-caching-cost-and-quota-guide/' },
    faqZh: [
      { q: '为什么过了北京时间 15:00，Gemini CLI 还没恢复？', a: '每年 11 月初至次年 3 月中旬北美实行冬令时（PST），太平洋午夜 00:00 对应的是北京时间下午 16:00 而非 15:00。' },
    ],
    faqEn: [
      { q: 'Why did my Gemini quota reset at 16:00 UTC+8 instead of 15:00 UTC+8?', a: 'From early November to mid-March, US Pacific Time is on Standard Time (PST, UTC-8), shifting Midnight PT from 15:00 to 16:00 Beijing Time.' },
    ],
  },
];
