/* 站点数据：页面显示的所有内容都来自这个文件。 */

var SITE = {
  /* 个人资料（左上角个人卡） */
  owner: {
    name: "mrm",
    status: "(生病中)",
    avatar: "assets/images/avatar.svg",
    sectionLabel: "内容"
  },

  /* 左侧导航；key 要和下面 pages 的键名对应，页面才知道该高亮哪一项 */
  nav: [
    { key: "blog",      label: "个人介绍",           href: "blog.html",     icon: "📄" },
    { key: "projects",  label: "我的项目（待更新）",  href: "projects.html", icon: "🌱" },
    { key: "about",     label: "关于网站",           href: "about.html",    icon: "🐾" },
    { key: "share",     label: "推荐网址",           href: "share.html",    icon: "⭐" },
    { key: "bloggers",  label: "优质资源",           href: "bloggers.html", icon: "🌐" }
  ],

  /* 各子页面的标题和副标题 */
  pages: {
    blog:     { title: "个人介绍", desc: "关于我的一些基本信息。" },
    projects: { title: "我的项目", desc: "做过的一些东西。" },
    about:    { title: "关于网站", desc: "关于我，以及这个网站是怎么搭起来的。" },
    share:    { title: "推荐网址", desc: "一些我觉得值得分享的网址。" },
    bloggers: { title: "优质资源", desc: "我常看的博客和资源站。" }
  },

  /* 问候卡；mascot 也可以写成 "img:图片路径" 换成一张图 */
  greeting: {
    name: "mrm",
    mascot: "🐱",
    morning: "早安，",
    afternoon: "午安，",
    evening: "晚安，",
    suffix: "，是高性能的！"
  },

  /* 社交按钮；style 可选 github / csdn / bilibili / xhs / mail */
  social: [
    { label: "GitHub", href: "https://github.com/miao-0622",  style: "github" },
    { label: "CSDN",   href: "https://blog.csdn.net/ATRIovo", style: "csdn" }
  ],

  /* 关于页正文 */
  about: {
    introTitle: "关于我",
    intro: [
      "苗润铭，男，智能制造工程专业，大二（目前），共青团员。",
      "这里是我的个人主页：放一些基本信息、做过的项目，还有我推荐的网址资源。"
    ],

    contestTitle: "比赛经历",
    contest: [
      "大英赛（未获奖）。",
      "其余暂无——会有的。"
    ],

    planTitle: "未来规划",
    plan: [
      "本学期：自学 PCB 设计等相关知识，尝试参与项目，报名数学、物理竞赛；也想和建筑学的同学合作一个风景园林机器人项目（可能性较小）。",
      "下学期：备战大英竞赛和六级二战；如果还有余力，再报名一些个人赛事，并争取在这一学年拿到软著。",
      "另外，我借助 AI 和北建大官方发布的文件，整理了适合本专业的竞赛项目与时间安排，我打算参加的竞赛都汇总在那份文档里。"
    ],

    skillsTitle: "技能标签",
    skills: ["HTML", "CSS", "JavaScript", "Markdown", "Git"],

    siteTitle: "这个网站是怎么做的",
    siteBody: [
      "整个网站是手写的静态页面：HTML 管结构、CSS 管外观、JavaScript 管交互。不需要安装任何东西，也不需要联网构建，双击 index.html 就能看。"
    ],

    contactTitle: "联系我"
  },

  /* 个人介绍列表；cover 留空显示 emoji 占位块，填路径则显示图片 */
  posts: [
    {
      title: "基本信息",
      date: "",
      cover: "",
      emoji: "🎓",
      excerpt: "苗润铭，男，智能制造工程专业，大二（目前），共青团员",
      url: "#",
      tags: []
    },
    {
      title: "自我介绍",
      date: "",
      cover: "",
      emoji: "🖼️",
      excerpt: "较为社恐，熟悉后可以打成一片，热爱运动，乒乓球业余约1600曾任社长，有小号基础，喜欢二次元，曾搬运外网有关视频，在看过精创寰宇社宣传后当下对pcb设计产生强烈兴趣并自学",
      url: "",
      tags: []
    },
    {
      title: "优势",
      date: "",
      cover: "",
      emoji: "⚡",
      excerpt: "老资历，已适应学习节奏，可以更好的分配精力完成项目。自学能力强，正自学嘉立创eda与ad，可使用solidworks，cad等软件进行建模。四级528且六级目标550+，可以进行英文文献查找（英语项目书。\n创新创业实践89（建模＋论文），c语言83，对代码理解薄弱，但自学vscode并运用ai辅助完成此篇简历，乐于接受新鲜事物并拥有团队精神，并不熟练掌握PS（？",
      url: "",
      tags: []
    },
    {
      title: "加入原因",
      date: "",
      cover: "",
      emoji: "✨",
      excerpt: "了解精创寰宇社后对pcb设计以及电赛产生兴趣，并希望通过这个平台参与进其中并找到志同道合的队友。",
      url: "",
      tags: []
    }
  ],

  /* 我的项目；url 指向站内的小工具，在别人电脑上也能点开用 */
  projects: [
    {
      title: "个人网站",
      date: "2026/10",
      cover: "",
      emoji: "🏠",
      excerpt: "你现在看到的这个站点：卡片式首页 + 子页面，纯手写 HTML / CSS / JavaScript。",
      url: "#",
      tags: ["HTML", "CSS", "JavaScript"]
    },
    {
      title: "尺寸公差与配合计算器",
      date: "2026/10",
      cover: "",
      emoji: "📐",
      excerpt: "输入公称尺寸和 IT 等级，算出上下偏差，直接给出 φ50H7(+0.025/0) 这样的标注；还能判断孔轴配合是间隙、过渡还是过盈。",
      url: "tools/tolerance.html",
      tags: ["机械制图", "公差"]
    },
    {
      title: "齿轮传动参数计算器",
      date: "2026/10",
      cover: "",
      emoji: "⚙️",
      excerpt: "给定模数、齿数、压力角，算出分度圆/齿顶圆/齿根圆直径、中心距、传动比和圆周速度。",
      url: "tools/gear.html",
      tags: ["机械设计", "齿轮"]
    },
    {
      title: "材料理论重量计算器",
      date: "2026/10",
      cover: "",
      emoji: "🧱",
      excerpt: "圆钢、方钢、钢板、圆管按常用材料密度算每米/每件重量，密度也可以自己填。",
      url: "tools/material.html",
      tags: ["材料", "计算"]
    }
  ],

  /* 推荐网址 */
  shares: [
    {
      title: "示例推荐：一个好用的网站",
      date: "2026/09",
      cover: "",
      emoji: "🔖",
      excerpt: "推荐语写在这里。",
      url: "#",
      views: "0",
      marks: "0",
      tags: ["推荐"]
    }
  ],

  /* 优质资源 */
  bloggers: [
    {
      title: "示例资源站",
      date: "",
      cover: "",
      emoji: "🌐",
      excerpt: "一句话介绍这个资源站。",
      url: "#",
      tags: ["资源"]
    }
  ],

  /* 点赞计数（起始数字） */
  like: {
    baseCount: 17,
    baseVisits: 11
  }
};
