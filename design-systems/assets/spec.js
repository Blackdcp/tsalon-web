const systems = {
  protocol: {
    code: "01 / PROTOCOL",
    title: "把社区做成一种协议",
    english: "A community, expressed as a protocol.",
    intro: "从开发者最熟悉的秩序出发：明确、开放、可组合。黑白是基础设施，蓝色只负责状态与链接；Logo 像一个接口，而不是装饰。",
    lineage: "EXPO × VERCEL",
    decision: "适合把 T Salon 定义为可靠、开放、长期维护的技术公共设施。",
    principles: ["结构先于修饰", "信息密度可控", "每个状态都有语义"],
    colors: [
      ["Ink", "#151515", "var(--ink)"], ["Canvas", "#FFFFFF", "var(--canvas)"],
      ["Soft", "#F6F6F3", "var(--soft)"], ["Line", "#E4E4E0", "var(--line)"],
      ["Signal", "#146EF5", "var(--accent)"], ["Body", "#5B5B59", "var(--muted)"]
    ],
    typeTitle: "现代无衬线承担判断，等宽字承担证据。",
    displaySample: "技术因交流而生长",
    typeNote: "中文采用 Noto Sans SC；英文与正文保持中性。IBM Plex Mono 仅用于日期、分类、代码与系统状态。",
    photoNote: "纪实照片保持自然色。裁切遵循人物关系，不加品牌色滤镜；文字从不压在人物面部。",
    eventTag: "REGISTRATION OPEN",
    eventTitle: "从端侧智能到空间计算",
    articleTitle: "一场技术活动，如何留下可检索的公共知识？",
    articleMeta: "FIELD NOTE  ·  08 MIN",
    heroEyebrow: "T SALON · SINCE 2016",
    heroTitle: "技术因交流，\n而持续生长。",
    heroBody: "连接开发者、研究者与创造者。把一次真实讨论，沉淀为所有人都能继续使用的知识。",
    primary: "查看近期活动",
    secondary: "认识 T Salon"
  },
  night: {
    code: "02 / NIGHT BUILD",
    title: "把构建中的思想带到光下",
    english: "Ideas under construction, brought to light.",
    intro: "不是赛博朋克，也不是霓虹装饰。真正的夜间构建感来自黑色工作台、编辑性的标题，以及只在关键信息附近出现的微光。",
    lineage: "RESEND × xAI",
    decision: "适合强调 T Salon 的前沿性、实验性，以及开发者在未知中共同构建的气质。",
    principles: ["黑色是工作环境", "微光只标记前沿", "长文本保留编辑感"],
    colors: [
      ["Void", "#000000", "var(--canvas)"], ["Paper", "#F5F6F2", "var(--ink)"],
      ["Panel", "#0B0B0D", "var(--soft)"], ["Line", "#27272A", "var(--line)"],
      ["Electric", "#6E8BFF", "var(--accent)"], ["Ember", "#FF7A45", "var(--accent-2)"]
    ],
    typeTitle: "衬线标题提出问题，无衬线正文完成解释。",
    displaySample: "技术的边界，\n在对话里移动",
    typeNote: "中文展示使用 Noto Serif SC，形成刊物般的思辨感；界面正文保持无衬线，系统信息继续使用等宽体。",
    photoNote: "照片降低饱和度并提升黑位。蓝与橙只以环境光出现，不覆盖整张照片，不把真实社区变成科技素材库。",
    eventTag: "BUILD / 026",
    eventTitle: "当机器开始理解物理世界",
    articleTitle: "我们如何讨论一个还没有标准答案的问题",
    articleMeta: "DISPATCH  ·  12 MIN",
    heroEyebrow: "T SALON / BUILDING IN PUBLIC",
    heroTitle: "把构建中的思想，\n带到光下。",
    heroBody: "一个由开发者发起的技术共同体。我们讨论正在发生的变化，也公开构建理解它们的方法。",
    primary: "进入下一场讨论",
    secondary: "阅读现场记录"
  },
  commons: {
    code: "03 / COMMONS",
    title: "为技术留一张共同的桌子",
    english: "A common table for people who build technology.",
    intro: "技术社区不必冷，也不必像创业公司。以纸张、日光和现场关系为线索，让开发者的严谨与非营利组织的人情味同时成立。",
    lineage: "MISTRAL AI × EXPO",
    decision: "适合把 T Salon 表达为有技术判断力、同时开放友善的长期共同体。",
    principles: ["先看见人，再看见规模", "温暖来自材料感", "开放不等于松散"],
    colors: [
      ["Ink", "#20201E", "var(--ink)"], ["Paper", "#FFFCF5", "var(--canvas)"],
      ["Cream", "#FFF3D1", "var(--soft)"], ["Rule", "#E5D8B9", "var(--line)"],
      ["Signal", "#F4511E", "var(--accent)"], ["Sun", "#FFC857", "var(--accent-2)"]
    ],
    typeTitle: "编辑性的温度，配合工程化的信息秩序。",
    displaySample: "从一次相遇，\n到共同创造",
    typeNote: "中文展示使用 Noto Serif SC，正文用 Noto Sans SC，技术元信息用 IBM Plex Mono。字体各司其职，不制造复古腔。",
    photoNote: "照片保留肤色与现场光，允许较大比例出现。暖色用于纸面与标记，不给照片套统一橙色滤镜。",
    eventTag: "T SALON · SHANGHAI",
    eventTitle: "人与机器，共处的下一种界面",
    articleTitle: "十年之后，我们为什么还需要线下技术社区？",
    articleMeta: "COMMUNITY LETTER  ·  06 MIN",
    heroEyebrow: "A DEVELOPER COMMUNITY SINCE 2016",
    heroTitle: "为技术，留一张\n共同的桌子。",
    heroBody: "从 iOS 开发者出发，走向 AI 与下一代计算。我们让不同阶段的创造者，在真实交流中彼此照亮。",
    primary: "来参加一场活动",
    secondary: "读我们的故事"
  }
};

const key = document.body.dataset.system;
const s = systems[key];
const asset = "../assets/";

const colorSwatches = s.colors.map(([name, hex, color]) => `
  <div class="swatch">
    <div class="swatch-color" style="background:${color}"></div>
    <div class="swatch-copy"><b>${name}</b><code>${hex}</code></div>
  </div>`).join("");

const principleList = s.principles.map((item, i) => `
  <li><span>0${i + 1}</span>${item}</li>`).join("");

document.body.innerHTML = `
  <header class="topbar">
    <a class="brand" href="../index.html" aria-label="T Salon design directions">
      <img class="brand-dark" src="${asset}logo-dark.png" alt="T Salon">
      <img class="brand-light" src="${asset}logo-white.png" alt="T Salon">
    </a>
    <nav><a href="#foundation">基础</a><a href="#components">组件</a><a href="#application">应用</a></nav>
    <span class="system-code">${s.code}</span>
  </header>

  <main>
    <section class="opening section-grid">
      <div class="opening-index mono">DIRECTION ${s.code.slice(0,2)}</div>
      <div class="opening-title">
        <p class="kicker">${s.lineage}</p>
        <h1>${s.title}</h1>
        <p class="english">${s.english}</p>
      </div>
      <div class="opening-note">
        <p>${s.intro}</p>
        <ol>${principleList}</ol>
      </div>
      <div class="motif" aria-hidden="true"><span>&lt;</span><i></i><span>&gt;</span></div>
    </section>

    <section id="foundation" class="foundation">
      <div class="section-head">
        <span class="mono">01 / FOUNDATION</span>
        <h2>不是重新画 Logo，<br>而是定义它如何存在。</h2>
      </div>
      <div class="logo-spec">
        <div class="logo-stage light-stage"><img src="${asset}logo-dark.png" alt="T Salon logo dark"></div>
        <div class="logo-stage dark-stage"><img src="${asset}logo-white.png" alt="T Salon logo white"></div>
        <div class="logo-rules">
          <div><span class="mono">CLEAR SPACE</span><b>以符号单线宽度 1× 为最小净空</b></div>
          <div><span class="mono">MINIMUM</span><b>完整标志最小宽度 112 px</b></div>
          <div><span class="mono">BEHAVIOR</span><b>保持单色，不描边、不发光、不渐变</b></div>
        </div>
      </div>

      <div class="palette-block">
        <div class="subhead"><span class="mono">COLOR</span><h3>颜色必须有职责。</h3></div>
        <div class="swatches">${colorSwatches}</div>
      </div>

      <div class="type-block">
        <div class="type-intro"><span class="mono">TYPOGRAPHY</span><h3>${s.typeTitle}</h3><p>${s.typeNote}</p></div>
        <div class="display-sample">${s.displaySample.replace("\n", "<br>")}</div>
        <div class="type-scale">
          <div><span class="mono">DISPLAY / 72</span><b>T Salon</b></div>
          <div><span class="mono">HEADING / 32</span><b>开发者共同体</b></div>
          <div><span class="mono">BODY / 18</span><p>我们相信，真正有价值的技术交流，发生在人与人的理解之间。</p></div>
          <div><span class="mono">META / 12</span><code>2026-08-16  ·  SHANGHAI  ·  026</code></div>
        </div>
      </div>

      <div class="token-block">
        <div class="subhead"><span class="mono">LAYOUT & RHYTHM</span><h3>四的倍数，十二列，内容优先。</h3></div>
        <div class="ruler"><i style="--w:4"></i><i style="--w:8"></i><i style="--w:12"></i><i style="--w:16"></i><i style="--w:24"></i><i style="--w:32"></i><i style="--w:48"></i><i style="--w:64"></i></div>
        <div class="token-meta mono"><span>SPACE 04—64</span><span>GRID 12 COL</span><span>MAX 1440</span><span>GUTTER 24/40</span></div>
      </div>
    </section>

    <section id="components" class="components">
      <div class="section-head inverse-head">
        <span class="mono">02 / COMPONENTS</span>
        <h2>内容系统，必须能承载<br>一次活动的完整生命。</h2>
      </div>
      <div class="component-strip">
        <div class="component-cell button-cell">
          <span class="mono component-label">ACTIONS</span>
          <button class="btn primary">${s.primary}<span>↗</span></button>
          <button class="btn secondary">${s.secondary}</button>
          <a class="text-link" href="#">浏览全部内容 <span>→</span></a>
        </div>
        <div class="component-cell tag-cell">
          <span class="mono component-label">TAXONOMY</span>
          <div class="tags"><span>AI</span><span>APPLE</span><span>ROBOTICS</span><span>COMMUNITY</span></div>
          <div class="status"><i></i>${s.eventTag}</div>
        </div>
        <div class="component-cell nav-cell">
          <span class="mono component-label">NAVIGATION</span>
          <div class="mini-nav"><b>T SALON</b><span>活动</span><span>内容</span><span>关于</span><button>加入</button></div>
        </div>
      </div>

      <div class="content-specimens">
        <article class="event-card">
          <div class="card-photo"><img src="${asset}salon-speaker.png" alt="T Salon event speaker"><span class="mono">EVENT / 026</span></div>
          <div class="card-copy"><p class="mono">2026.08.16  14:00 · SHANGHAI</p><h3>${s.eventTitle}</h3><div class="speaker-line"><span>主题分享 · 圆桌 · 自由交流</span><b>报名 ↗</b></div></div>
        </article>
        <article class="article-card">
          <p class="mono">${s.articleMeta}</p>
          <h3>${s.articleTitle}</h3>
          <p>把现场问题、讲者观点、关键论据与延伸资料组织成可被搜索、引用和继续讨论的内容。</p>
          <div class="author"><span>TS</span><b>T Salon 编辑部</b><i>→</i></div>
        </article>
      </div>

      <div class="photo-policy">
        <div class="policy-copy"><span class="mono">PHOTOGRAPHY</span><h3>现场不是背景素材。</h3><p>${s.photoNote}</p></div>
        <figure class="photo-wide"><img src="${asset}swift-2018-group.png" alt="T Salon Swift conference community group"><figcaption class="mono">SWIFT CONFERENCE · 2018 · SHANGHAI</figcaption></figure>
        <figure class="photo-small"><img src="${asset}community-dinner.jpeg" alt="T Salon community dinner"><figcaption class="mono">COMMUNITY DINNER</figcaption></figure>
      </div>
    </section>

    <section id="application" class="application">
      <div class="section-head">
        <span class="mono">03 / APPLICATION</span>
        <h2>放回首页，它应该<br>自然地成为一个系统。</h2>
      </div>
      <div class="browser">
        <div class="browser-bar"><i></i><i></i><i></i><span class="mono">tsalon.tech</span></div>
        <div class="site-preview">
          <div class="preview-nav"><img class="preview-logo-dark" src="${asset}logo-dark.png" alt=""><img class="preview-logo-light" src="${asset}logo-white.png" alt=""><div><span>活动</span><span>内容</span><span>关于</span><button>加入社区</button></div></div>
          <div class="preview-hero">
            <div class="preview-copy"><p class="mono">${s.heroEyebrow}</p><h3>${s.heroTitle.replace("\n", "<br>")}</h3><p>${s.heroBody}</p><div><button class="btn primary">${s.primary}<span>↗</span></button><button class="btn secondary">${s.secondary}</button></div></div>
            <div class="preview-visual"><img src="${asset}swift-2018-group.png" alt="T Salon community"><span class="visual-mark">&lt;<i></i>&gt;</span></div>
          </div>
          <div class="preview-ticker mono"><span>NEXT / 2026.08.16</span><b>${s.eventTitle}</b><span>SHANGHAI · REGISTRATION OPEN →</span></div>
        </div>
      </div>
      <div class="verdict"><span class="mono">DIRECTION SUMMARY</span><p>${s.decision}</p><a href="../index.html">比较另外两套方向 →</a></div>
    </section>
  </main>

  <footer><img class="brand-dark" src="${asset}logo-dark.png" alt="T Salon"><img class="brand-light" src="${asset}logo-white.png" alt="T Salon"><span class="mono">DESIGN SYSTEM STUDY · 2026</span></footer>
`;

if (new URLSearchParams(window.location.search).get("view") === "application") {
  const application = document.querySelector(".application");
  document.body.innerHTML = application.outerHTML;
  document.body.classList.add("application-only");
} else if (window.location.hash) {
  const target = document.querySelector(window.location.hash);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
}
