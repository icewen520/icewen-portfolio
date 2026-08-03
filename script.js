/* ==========================================================================
   ICEWEN 个人作品集
   ========================================================================== */

/* --- 导航高亮 -------------------------------------------------------------
   顶栏导航 + 左侧进度点共用一套高亮状态。
   用 rootMargin 把判定收成视口中线的一条横线：哪个 section 压住中线就高亮谁。
   比之前的 threshold:[0.45,0.6,0.75] 稳得多 —— 那种写法在屏幕高度小于
   section 高度时永远够不到 0.75，高亮会漏触发或闪烁。
   -------------------------------------------------------------------------- */
const sections = [...document.querySelectorAll(".hero, .work, .about-screen")];
const navLinks = [...document.querySelectorAll(".site-header nav a, .rail-nav a")];

const setActive = (sectionId) => {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${sectionId}`);
  });
};

if (sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible) setActive(visible.target.id);
    },
    { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));
  setActive(sections[0].id);
}

/* --- 带 hash 进入时瞬时定位 ------------------------------------------------
   从案例页点「返回作品」回来是 index.html#work。html 上有 scroll-behavior:smooth，
   会让浏览器从第一屏一路滑到第二屏才停 —— 这里先临时关掉动画直接落位。
   页内导航点击仍然保持平滑，一屏一屏的切换感不受影响。
   -------------------------------------------------------------------------- */
if (location.hash) {
  const landing = document.querySelector(location.hash);
  if (landing) {
    const root = document.documentElement;
    root.style.scrollBehavior = "auto";
    landing.scrollIntoView();
    requestAnimationFrame(() => {
      root.style.scrollBehavior = "";
    });
  }
}

/* --- 作品区横向抽屉 -------------------------------------------------------
   默认展开第一格；鼠标移到哪格哪格展开，移出整条恢复第一格。
   触屏没有 hover，所以第一次点是展开、第二次点才进二级页 —— 否则用户
   点一下收起的窄条就直接跳走了，根本没看清点的是什么。
   -------------------------------------------------------------------------- */
const rail = document.querySelector("[data-rail]");
const panels = [...document.querySelectorAll(".panel")];
const noHover = window.matchMedia("(hover: none)");

const openPanel = (target) => {
  panels.forEach((panel) => panel.classList.toggle("is-open", panel === target));
};

if (rail && panels.length) {
  openPanel(panels[0]);

  panels.forEach((panel) => {
    panel.addEventListener("mouseenter", () => openPanel(panel));
    panel.addEventListener("focus", () => openPanel(panel));

    panel.addEventListener("click", (event) => {
      if (noHover.matches && !panel.classList.contains("is-open")) {
        event.preventDefault();
        openPanel(panel);
      }
    });
  });

  rail.addEventListener("mouseleave", () => openPanel(panels[0]));
}

/* --- 滚动时收起顶栏 ------------------------------------------------------- */
let switchTimer;
window.addEventListener(
  "scroll",
  () => {
    document.body.classList.add("is-switching");
    window.clearTimeout(switchTimer);
    switchTimer = window.setTimeout(() => {
      document.body.classList.remove("is-switching");
    }, 180);
  },
  { passive: true },
);

/* --- 移动端菜单：点菜单项、点外部、按 Esc 都能关 -------------------------- */
const menu = document.querySelector(".menu");

if (menu) {
  const closeMenu = () => menu.removeAttribute("open");

  menu.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (menu.hasAttribute("open") && !menu.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.hasAttribute("open")) {
      closeMenu();
      menu.querySelector("summary")?.focus();
    }
  });
}

/* --- 点击复制 -------------------------------------------------------------
   显示的手机号是打码的，复制出去的是 data-copy 里的完整号码。
   复制结果同时写进 role="status" 区域，读屏用户也能听到反馈。
   -------------------------------------------------------------------------- */
const copyLive = document.querySelector("[data-copy-live]");

const fallbackCopy = (text) => {
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
};

document.querySelectorAll("[data-copy]").forEach((button) => {
  const status = button.querySelector("[data-copy-status]");
  let resetTimer;

  button.addEventListener("click", async () => {
    const text = button.dataset.copy;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      fallbackCopy(text);
    }

    button.classList.add("copied");
    if (status) status.textContent = "已复制";
    if (copyLive) copyLive.textContent = `${text} 已复制到剪贴板`;

    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      button.classList.remove("copied");
      if (status) status.textContent = "点击复制";
      if (copyLive) copyLive.textContent = "";
    }, 1600);
  });
});

/* --- 简历按钮：文件存在才显示，避免留死链 --------------------------------- */
const resumeLink = document.querySelector("[data-resume]");

if (resumeLink) {
  fetch(resumeLink.getAttribute("href"), { method: "HEAD" })
    .then((response) => {
      if (response.ok) resumeLink.hidden = false;
    })
    .catch(() => {
      /* file:// 打开或文件不存在时保持隐藏 */
    });
}

/* --- 背景音乐 ------------------------------------------------------------- */
const musicButton = document.querySelector(".music-toggle");
const musicHint = document.querySelector(".music-hint");
const backgroundMusic = document.querySelector("#background-music");

const updateMusicButton = (isPlaying) => {
  if (!musicButton) return;
  musicButton.classList.toggle("is-playing", isPlaying);
  musicButton.setAttribute("aria-pressed", String(isPlaying));
  musicButton.setAttribute("aria-label", isPlaying ? "关闭背景音乐" : "播放背景音乐");
};

if (backgroundMusic) backgroundMusic.volume = 0.25;

musicButton?.addEventListener("click", async () => {
  if (!backgroundMusic) return;

  if (backgroundMusic.paused) {
    try {
      await backgroundMusic.play();
    } catch {
      updateMusicButton(false);
    }
  } else {
    backgroundMusic.pause();
  }
});

backgroundMusic?.addEventListener("play", () => updateMusicButton(true));
backgroundMusic?.addEventListener("pause", () => updateMusicButton(false));

/* 首次进入提示一次「这里能放音乐」，4 秒后消失，同一会话不再打扰 */
if (musicHint && !sessionStorage.getItem("music-hint-seen")) {
  const hideHint = () => {
    musicHint.classList.remove("is-visible");
    sessionStorage.setItem("music-hint-seen", "1");
  };

  window.setTimeout(() => musicHint.classList.add("is-visible"), 900);
  window.setTimeout(hideHint, 4900);
  musicButton?.addEventListener("click", hideHint, { once: true });
}
