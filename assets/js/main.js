/* =========================================================
   个人网站 · 主脚本
   数据在 assets/js/data.js，这里负责把数据渲染成页面，
   以及主题切换、时钟、日历、音乐播放器、点赞这些交互。
   ========================================================= */


/* =========================================================
   第 1 部分：立即执行（防止主题闪烁）
   ========================================================= */
(function () {
  try {
    var savedTheme = localStorage.getItem("site-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  } catch (error) {
    /* 隐私模式下 localStorage 不可用，忽略 */
  }
})();

// 头像加载失败时的兜底图。
// 被 HTML 的 onerror="handleAvatarError(this)" 调用，所以必须写成全局函数。
function handleAvatarError(img) {
  img.onerror = null;
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
    '<rect width="200" height="200" fill="#dff5ec"/>' +
    '<circle cx="100" cy="78" r="34" fill="#2fbfa8"/>' +
    '<path d="M28 192c0-40 32-64 72-64s72 24 72 64z" fill="#2fbfa8"/>' +
    "</svg>";
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}


/* 页面里的 #siteBackground 是一层空的全屏图层，留给以后做背景图轮换用。 */


var SiteCore = (function () {
  "use strict";

  /* =======================================================
     第 3 部分：数据层
     ======================================================= */
  var DATA_KEY = "site-data";
  var DEFAULT_DATA = typeof SITE !== "undefined" && SITE ? SITE : {};
  var DATA = {};

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  // 深度合并：对象递归合并，数组和普通值直接用"覆盖"的那份。
  // 数组整体替换，所以删掉一条记录能记住。
  function deepMerge(base, override) {
    if (override === undefined) return base;
    if (!isPlainObject(base) || !isPlainObject(override)) return override;
    var out = {};
    Object.keys(base).forEach(function (key) {
      out[key] = base[key];
    });
    Object.keys(override).forEach(function (key) {
      out[key] = deepMerge(base[key], override[key]);
    });
    return out;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getByPath(obj, path) {
    if (!path) return undefined;
    var parts = String(path).split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function setByPath(obj, path, value) {
    var parts = String(path).split(".");
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var key = parts[i];
      if (cur[key] == null) {
        cur[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      }
      cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function load() {
    var saved = null;
    
    DATA = deepMerge(DEFAULT_DATA, saved || {});
    cleanLegacyJunk();
  }

  // 早期版本有个 bug：编辑缩略图 emoji 时会往条目里写进 posts.0.0 这种多余的键。
  // 这里把列表条目里那些"纯数字的键"删掉，免得它们一直跟着数据跑。
  function cleanLegacyJunk() {
    var lists = ["posts", "projects", "shares", "bloggers"];
    lists.forEach(function (name) {
      var list = DATA[name];
      if (!Array.isArray(list)) return;
      list.forEach(function (item) {
        if (!item || typeof item !== "object") return;
        Object.keys(item).forEach(function (key) {
          if (/^\d+$/.test(key)) delete item[key];
        });
      });
    });
  }

  function save() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(DATA));
      return true;
    } catch (error) {
      return false;
    }
  }

  function clearSaved() {
    try {
      localStorage.removeItem(DATA_KEY);
    } catch (error) {
      /* 忽略 */
    }
  }

  function hasSaved() {
    try {
      return !!localStorage.getItem(DATA_KEY);
    } catch (error) {
      return false;
    }
  }

  // 是不是"本地打开"：双击 html 文件（file://）或 localhost。
  // 编辑按钮只在本地出现，发布到网上后访客看不到。
  function isLocal() {
    try {
      if (location.protocol === "file:") return true;
      var host = location.hostname;
      return host === "localhost" || host === "127.0.0.1" || host === "::1";
    } catch (error) {
      return false;
    }
  }

  /* =======================================================
     第 4 部分：渲染层
     ======================================================= */

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // 生成 data-path 标记（记录这段文字对应数据里的哪一项）
  function pathAttr(path) {
    return path ? ' data-path="' + path + '"' : "";
  }

  // 判断 cover 是不是一个"真的图片路径"。像 "。" 这种当成没填。
  function isRealCover(cover) {
    if (!cover) return false;
    return /^(https?:|data:|assets\/|\.\/|\/|[A-Za-z]:)/.test(String(cover).trim());
  }

  function thumbHTML(item, base) {
    if (isRealCover(item.cover)) {
      return (
        '<div class="thumb"><img src="' +
        esc(item.cover) +
        '" alt="" onerror="this.remove()"></div>'
      );
    }
    return (
      '<div class="thumb"' +
      pathAttr(base + ".emoji") +
      ">" +
      esc(item.emoji || "📄") +
      "</div>"
    );
  }

  // 一张"带缩略图的条目卡"
  // asCard = true 时外面套一层可点击的 <a class="card card-list-item">
  function itemCardHTML(listKey, index, item, asCard) {
    var base = listKey + "." + index;

    var metaParts = [];
    if (item.date) {
      metaParts.push(
        '<span' + pathAttr(base + ".date") + ">" + esc(item.date) + "</span>"
      );
    }
    if (item.views) metaParts.push("<span>浏览量：" + esc(item.views) + "</span>");
    if (item.marks) metaParts.push("<span>标记：" + esc(item.marks) + "</span>");

    // 标签只做展示，内容来自 data.js 里的 tags
    var tagsHTML = "";
    if (item.tags && item.tags.length) {
      tagsHTML =
        '<div class="tags">' +
        item.tags
          .map(function (tag) {
            return '<span class="tag">' + esc(tag) + "</span>";
          })
          .join("") +
        "</div>";
    }

    var body =
      '<div class="thumb-row">' +
      thumbHTML(item, base) +
      "<div>" +
      '<p class="thumb-title"' +
      pathAttr(base + ".title") +
      ">" +
      esc(item.title) +
      "</p>" +
      '<p class="thumb-desc"' +
      pathAttr(base + ".excerpt") +
      ">" +
      esc(item.excerpt || "") +
      "</p>" +
      (metaParts.length
        ? '<div class="thumb-meta">' + metaParts.join(" · ") + "</div>"
        : "") +
      "</div>" +
      "</div>" +
      tagsHTML;

    if (asCard) {
      return (
        '<a class="card card-list-item" href="' +
        esc(item.url || "#") +
        '" data-item="' +
        esc(base) +
        '">' +
        body +
        "</a>"
      );
    }
    return body;
  }

  /* ---------- 4.1 个人卡 ---------- */
  function renderProfile() {
    // 单文件版会把多个页面拼在一起，所以按属性找、逐个填充
    var cards = document.querySelectorAll("[data-profile-card]");
    if (!cards.length) return;

    var owner = DATA.owner || {};
    var nav = DATA.nav || [];
    var pageKey = (document.body.getAttribute("data-page") || "").trim();
    var hasMatch = nav.some(function (item) {
      return item.key === pageKey;
    });
    var activeKey = hasMatch ? pageKey : nav.length ? nav[0].key : "";

    var navHTML = nav
      .map(function (item, i) {
        return (
          '<a class="nav-item' +
          (item.key === activeKey ? " is-active" : "") +
          '" href="' +
          esc(item.href) +
          '">' +
          '<span class="nav-icon" aria-hidden="true"' +
          pathAttr("nav." + i + ".icon") +
          ">" +
          esc(item.icon || "•") +
          "</span>" +
          "<span" +
          pathAttr("nav." + i + ".label") +
          ">" +
          esc(item.label) +
          "</span>" +
          "</a>"
        );
      })
      .join("");

    var html =
      // 点头像 / 名字可以回到首页
      '<a class="profile-head" href="index.html" title="回到首页">' +
      '<img class="profile-avatar" src="' +
      esc(owner.avatar || "") +
      '" alt="' +
      esc(owner.name || "头像") +
      '" onerror="handleAvatarError(this)">' +
      "<div>" +
      '<h2 class="profile-name">' +
      '<span' +
      pathAttr("owner.name") +
      ">" +
      esc(owner.name || "你的名字") +
      "</span>" +
      (owner.status
        ? ' <span class="profile-status"' +
          pathAttr("owner.status") +
          ">" +
          esc(owner.status) +
          "</span>"
        : "") +
      "</h2>" +
      "</div>" +
      "</a>" +
      "</div>" +
      (owner.sectionLabel
        ? '<p class="profile-sub"' +
          pathAttr("owner.sectionLabel") +
          ">" +
          esc(owner.sectionLabel) +
          "</p>"
        : "") +
      '<nav class="nav-list" aria-label="站点导航">' +
      navHTML +
      "</nav>";

    Array.prototype.forEach.call(cards, function (el) {
      el.innerHTML = html;
    });
  }

  /* ---------- 4.2 问候卡 ---------- */
  var TIME_SLOT = null; // 当前是 morning / afternoon / evening

  function renderGreeting() {
    var card = document.getElementById("greetingCard");
    if (!card) return;

    var g = DATA.greeting || {};
    var hour = new Date().getHours();
    TIME_SLOT = hour < 11 ? "morning" : hour < 18 ? "afternoon" : "evening";

    var mascotHTML =
      g.mascot && String(g.mascot).indexOf("img:") === 0
        ? '<img class="mascot" src="' +
          esc(String(g.mascot).slice(4)) +
          '" alt="吉祥物" onerror="handleAvatarError(this)">'
        : '<div class="mascot" aria-hidden="true"' +
          pathAttr("greeting.mascot") +
          ">" +
          esc(g.mascot || "🐱") +
          "</div>";

    card.innerHTML =
      mascotHTML +
      '<p class="greeting-text">' +
      '<span class="hi"' +
      pathAttr("greeting." + TIME_SLOT) +
      ">" +
      esc(g[TIME_SLOT] || "你好，") +
      "</span><br>" +
      "我是" +
      '<span class="hi"' +
      pathAttr("greeting.name") +
      ">" +
      esc(g.name || "我") +
      "</span>" +
      '<span' +
      pathAttr("greeting.suffix") +
      ">" +
      esc(g.suffix || "，很高兴见到你！") +
      "</span>" +
      "</p>";
  }

  /* ---------- 4.3 社交按钮排 ---------- */
  var GITHUB_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"/></svg>';

  function socialClass(style) {
    var s = String(style || "");
    var known = ["github", "csdn", "bilibili", "xhs", "mail"];
    return "social-btn" + (known.indexOf(s) >= 0 ? " is-" + s : "");
  }

  function renderSocial() {
    var rows = document.querySelectorAll(".social-row");
    if (!rows.length) return;

    var html = (DATA.social || [])
      .map(function (link) {
        return (
          '<a class="' +
          socialClass(link.style) +
          '" href="' +
          esc(link.href) +
          '" target="_blank" rel="noopener">' +
          (link.style === "github" ? GITHUB_ICON : "") +
          "<span>" +
          esc(link.label) +
          "</span>" +
          "</a>"
        );
      })
      .join("");

    Array.prototype.forEach.call(rows, function (row) {
      row.innerHTML = html;
    });
  }

  /* ---------- 4.4 音乐播放器 ---------- */
  function renderMusic() {
    var card = document.getElementById("musicCard");
    if (!card) return;

    var m = DATA.music || {};
    card.innerHTML =
      '<span class="music-note" aria-hidden="true">♪</span>' +
      '<div class="music-body">' +
      '<div class="music-title"' +
      pathAttr("music.title") +
      ">" +
      esc(m.title || "未命名") +
      "</div>" +
      '<div class="music-bar"><span id="musicProgress"></span></div>' +
      '<div class="music-hint" id="musicHint" hidden></div>' +
      "</div>" +
      '<button class="music-play" id="musicPlay" type="button" aria-label="播放">▶</button>' +
      '<audio id="musicAudio" src="' +
      esc(m.src || "") +
      '"' +
      (m.loop ? " loop" : "") +
      ' preload="none"></audio>';

    var audio = document.getElementById("musicAudio");
    var playBtn = document.getElementById("musicPlay");
    var progress = document.getElementById("musicProgress");
    var hint = document.getElementById("musicHint");

    function showHint(text) {
      if (!hint) return;
      hint.textContent = text;
      hint.hidden = false;
    }

    audio.addEventListener("error", function () {
      showHint("还没有音乐文件：把 mp3 放进 assets/audio/ 再改一下音乐地址");
    });

    playBtn.addEventListener("click", function () {
      if (audio.paused) {
        var playing = audio.play();
        if (playing && playing.catch) {
          playing.catch(function () {
            showHint("浏览器没找到这个音频文件，检查一下地址");
          });
        }
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", function () {
      playBtn.textContent = "❚❚";
      playBtn.setAttribute("aria-label", "暂停");
      if (hint) hint.hidden = true;
    });
    audio.addEventListener("pause", function () {
      playBtn.textContent = "▶";
      playBtn.setAttribute("aria-label", "播放");
    });
    audio.addEventListener("timeupdate", function () {
      if (!audio.duration) return;
      progress.style.width = (audio.currentTime / audio.duration) * 100 + "%";
    });
  }

  /* ---------- 4.5 点赞 ---------- */
  var likeState = { liked: false, extraVisits: 0, ready: false };

  function renderLike() {
    var btn = document.getElementById("likeCard");
    if (!btn) return;

    var cfg = DATA.like || { baseCount: 0, baseVisits: 0 };
    var likes = Number(cfg.baseCount || 0) + (likeState.liked ? 1 : 0);
    var visits = Number(cfg.baseVisits || 0) + likeState.extraVisits;

    btn.classList.toggle("is-liked", likeState.liked);
    btn.innerHTML =
      '<span class="like-heart" aria-hidden="true">' +
      (likeState.liked ? "❤️" : "🤍") +
      "</span><span>" +
      likes +
      " / " +
      visits +
      "</span>";
    btn.setAttribute("aria-label", likeState.liked ? "取消点赞" : "点赞这篇帖子");
  }

  function initLike() {
    var btn = document.getElementById("likeCard");
    if (!btn || likeState.ready) return;

    try {
      likeState.liked = localStorage.getItem("site-liked") === "1";
      likeState.extraVisits = Number(localStorage.getItem("site-visits") || 0);
      if (!sessionStorage.getItem("site-visit-counted")) {
        likeState.extraVisits += 1;
        localStorage.setItem("site-visits", String(likeState.extraVisits));
        sessionStorage.setItem("site-visit-counted", "1");
      }
    } catch (error) {
      /* 忽略 */
    }
    likeState.ready = true;

    btn.addEventListener("click", function () {
      likeState.liked = !likeState.liked;
      try {
        localStorage.setItem("site-liked", likeState.liked ? "1" : "0");
      } catch (error) {
        /* 忽略 */
      }
      renderLike();
    });
  }

  /* ---------- 4.6 首页的"最新文章" ---------- */
  function renderHomeCards() {
    var latest = document.getElementById("latestCard");
    var posts = DATA.posts || [];
    if (!latest || !posts.length) return;

    latest.innerHTML =
      '<p class="card-label">最新文章</p>' +
      itemCardHTML("posts", 0, posts[0], false);
  }

  /* ---------- 4.7 子页面标题 ---------- */
  function renderPages() {
    var key = (document.body.getAttribute("data-page") || "").trim();
    var pages = DATA.pages || {};
    var page = pages[key];
    if (!page) return;

    // 每个视图里都可能有一份标题，统一按当前页面的数据填
    var titles = document.querySelectorAll(".page-head .page-title");
    var descs = document.querySelectorAll(".page-head .page-desc");
    Array.prototype.forEach.call(titles, function (el) {
      el.innerHTML =
        "<span" + pathAttr("pages." + key + ".title") + ">" + esc(page.title || "") + "</span>";
    });
    Array.prototype.forEach.call(descs, function (el) {
      el.innerHTML =
        "<span" + pathAttr("pages." + key + ".desc") + ">" + esc(page.desc || "") + "</span>";
    });
  }

  /* ---------- 4.8 列表（文章 / 项目 / 推荐网址 / 优质资源） ---------- */
  function renderList(listKey) {
    var containers = document.querySelectorAll('[data-list="' + listKey + '"]');
    var items = DATA[listKey] || [];
    Array.prototype.forEach.call(containers, function (container) {
      if (!items.length) {
        container.innerHTML =
          '<p class="page-desc">这个列表还是空的，内容加在 data.js 里。</p>';
        return;
      }
      container.innerHTML = items
        .map(function (item, index) {
          return itemCardHTML(listKey, index, item, true);
        })
        .join("");
    });
  }

  function renderLists() {
    renderList("posts");
    renderList("projects");
    renderList("shares");
    renderList("bloggers");
  }

  /* ---------- 4.9 关于页面 ---------- */
  function renderAbout() {
    var a = DATA.about || {};

    function heading(title, path) {
      return "<h2" + pathAttr(path) + ">" + esc(title) + "</h2>";
    }

    // 段落列表：自我介绍 / 比赛经历 / 未来规划
    function paragraphs(list, basePath) {
      return (list || [])
        .map(function (text, i) {
          return "<p" + pathAttr(basePath + "." + i) + ">" + esc(text) + "</p>";
        })
        .join("");
    }

    var intro = document.getElementById("aboutIntro");
    if (intro) {
      intro.innerHTML =
        heading(a.introTitle || "关于我", "about.introTitle") +
        paragraphs(a.intro, "about.intro") +
        (a.contest && a.contest.length
          ? heading(a.contestTitle || "比赛经历", "about.contestTitle") +
            paragraphs(a.contest, "about.contest")
          : "") +
        (a.plan && a.plan.length
          ? heading(a.planTitle || "未来规划", "about.planTitle") +
            paragraphs(a.plan, "about.plan")
          : "") +
        heading(a.skillsTitle || "技能", "about.skillsTitle") +
        '<div class="tags" id="skillTags">' +
        (a.skills || [])
          .map(function (skill, i) {
            return '<span class="tag"' + pathAttr("about.skills." + i) + ">" + esc(skill) + "</span>";
          })
          .join("") +
        "</div>";
    }

    var site = document.getElementById("aboutSite");
    if (site) {
      site.innerHTML =
        heading(a.siteTitle || "这个网站是怎么做的", "about.siteTitle") +
        paragraphs(a.siteBody, "about.siteBody");
    }

    var contactLabel = document.getElementById("contactLabel");
    if (contactLabel) {
      contactLabel.innerHTML =
        "<span" + pathAttr("about.contactTitle") + ">" +
        esc(a.contactTitle || "联系我") +
        "</span>";
    }
  }

  /* ---------- 4.10 页脚 ---------- */
  function renderFooter() {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    var nameEl = document.getElementById("footerName");
    if (nameEl) nameEl.textContent = (DATA.owner && DATA.owner.name) || "我";
  }

  function renderAll() {
    renderProfile();
    renderGreeting();
    renderSocial();
    renderMusic();
    renderLike();
    renderHomeCards();
    renderPages();
    renderLists();
    renderAbout();
    renderFooter();
  }

  /* =======================================================
     第 5 部分：交互层
     ======================================================= */

  /* ---------- 5.1 主题切换 ---------- */
  function initTheme() {
    var btn = document.getElementById("themeToggle");
    var root = document.documentElement;
    if (!btn) return;

    function current() {
      return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    function paint() {
      var isDark = current() === "dark";
      btn.textContent = isDark ? "☀️" : "🌙";
      var label = isDark ? "切换到浅色主题" : "切换到暗色主题";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }

    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("site-theme", next);
      } catch (error) {
        /* 忽略 */
      }
      paint();
    });

    paint();
  }

  /* ---------- 5.2 数字时钟 ---------- */
  function initClock() {
    var timeEl = document.getElementById("clockTime");
    var dateEl = document.getElementById("clockDate");
    if (!timeEl) return;

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function tick() {
      var d = new Date();
      timeEl.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
      if (dateEl) {
        dateEl.textContent = d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
      }
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 5.3 日历 ---------- */
  function initCalendar() {
    var calendar = document.getElementById("calendar");
    if (!calendar) return;

    var WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
    var today = new Date();
    var viewYear = today.getFullYear();
    var viewMonth = today.getMonth();

    function paint() {
      var first = new Date(viewYear, viewMonth, 1);
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      var leading = (first.getDay() + 6) % 7; // 让周一排第一列

      var cells = "";
      for (var i = 0; i < leading; i++) cells += '<div class="cal-day is-empty"></div>';
      for (var day = 1; day <= daysInMonth; day++) {
        var isToday =
          viewYear === today.getFullYear() &&
          viewMonth === today.getMonth() &&
          day === today.getDate();
        cells += '<div class="cal-day' + (isToday ? " is-today" : "") + '">' + day + "</div>";
      }

      var head =
        '<div class="cal-head">' +
        '<div class="cal-today">' +
        viewYear + "/" + (viewMonth + 1) + "/" + today.getDate() +
        " 周" + WEEKDAYS[(today.getDay() + 6) % 7] +
        "</div>" +
        '<div class="cal-nav">' +
        '<button class="cal-btn" type="button" data-cal="-1" aria-label="上个月">‹</button>' +
        '<button class="cal-btn" type="button" data-cal="1" aria-label="下个月">›</button>' +
        "</div>" +
        "</div>";

      var weekRow = WEEKDAYS.map(function (w) {
        return '<div class="cal-weekday">' + w + "</div>";
      }).join("");

      calendar.innerHTML = head + '<div class="cal-grid">' + weekRow + cells + "</div>";
    }

    calendar.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-cal]");
      if (!btn) return;
      viewMonth += Number(btn.getAttribute("data-cal"));
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      } else if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      paint();
    });

    paint();
  }

  /* ---------- 5.4 页面右下角的小提示条 ---------- */
  var toastTimer = null;

  function toast(message) {
    var el = document.getElementById("siteToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "siteToast";
      el.className = "site-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-show");
    }, 3200);
  }

  /* =======================================================
     第 6 部分：启动
     ======================================================= */
  function boot() {
    load();
    renderAll();
    initTheme();
    initClock();
    initCalendar();
    initLike();
    renderLike();

    // data.js 一个键都没读到：说明文件没加载成功（多半是语法被改坏了）。
    // 这种情况页面会是空的，得明确提示一下，别让人对着空白页发呆。
    if (Object.keys(DEFAULT_DATA).length === 0) {
      toast("⚠️ data.js 没有正常加载，页面内容可能不完整。");
    }

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  return {
    getData: function () {
      return DATA;
    },
    clone: clone,
    load: load,
    save: save,
    clearSaved: clearSaved,
    hasSaved: hasSaved,
    getByPath: getByPath,
    setByPath: setByPath,
    isLocal: isLocal,
    renderAll: renderAll,
    renderList: renderList,
    renderProfile: renderProfile,
    renderGreeting: renderGreeting,
    renderSocial: renderSocial,
    renderMusic: renderMusic,
    renderAbout: renderAbout,
    renderPages: renderPages,
    renderHomeCards: renderHomeCards,
    replaceAll: function (data) {
      DATA = data;
    },
    esc: esc,
    toast: toast
  };
})();
