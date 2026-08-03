/* ==========================================================================
   案例页 —— 进度、AI 视频、放大查看器
   ========================================================================== */

const frames = [...document.querySelectorAll(".frame")];
const current = document.querySelector("[data-frame-current]");
const total = document.querySelector("[data-frame-total]");
const progress = document.querySelector(".case-count i");

const pad = (n) => String(n).padStart(2, "0");

/* --- 进度 -----------------------------------------------------------------
   序号和总数都由 DOM 顺序算出，增删帧不用手动改编号。
   判定用视口中线（rootMargin -50%），和主站同一套逻辑。
   -------------------------------------------------------------------------- */
if (total) total.textContent = pad(frames.length);

const setCurrent = (index) => {
  if (current) current.textContent = pad(index + 1);
  if (progress) {
    progress.style.setProperty("--progress", `${((index + 1) / frames.length) * 100}%`);
  }
};

if (frames.length) {
  const sections = [...document.querySelectorAll(".frame, .case-end")];

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      const index = frames.indexOf(visible.target);
      setCurrent(index === -1 ? frames.length - 1 : index);
    },
    { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));
  setCurrent(0);
}

/* --- AI 视频轮播 ------------------------------------------------------------
   单条播放，播完自动切下一条并循环回第一条；也可以点左右箭头，
   或者直接横向拖拽/滚轮滑动 .carousel-viewport 手动切换。
   三种切换方式共用同一套判定：用 IntersectionObserver 盯着谁在视口正中，
   谁就是「当前项」——不用自己维护一个 index 变量去对齐三种输入方式，
   浏览器的滚动状态本身就是唯一真相源。
   -------------------------------------------------------------------------- */
const carousel = document.querySelector("[data-carousel]");
const carouselViewport = document.querySelector(".carousel-viewport");
const carouselSlides = [...document.querySelectorAll(".clip-carousel .clip")];
const carouselStatus = document.querySelector("[data-carousel-status]");

if (carousel && carouselViewport && carouselSlides.length) {
  let activeSlide = null;
  let sectionVisible = false;

  const stopSlide = (slide) => {
    const video = slide.querySelector("video");
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.muted = true;
    }
    slide.classList.remove("is-active");
    const button = slide.querySelector(".clip-sound");
    button?.classList.remove("is-on");
    button?.setAttribute("aria-pressed", "false");
  };

  /* 左右相邻卡片只保留平视的预览层级；再远的卡片由 viewport 裁掉。 */
  const updateNeighbors = (index) => {
    carouselSlides.forEach((slide, i) => {
      slide.classList.toggle("is-prev", i === index - 1);
      slide.classList.toggle("is-next", i === index + 1);
    });
  };

  const setActive = (slide) => {
    if (slide === activeSlide) return;
    if (activeSlide) stopSlide(activeSlide);
    activeSlide = slide;
    slide.classList.add("is-active");

    const index = carouselSlides.indexOf(slide);
    updateNeighbors(index);

    if (sectionVisible) {
      slide.querySelector("video")?.play().catch(() => {
        /* 浏览器拒绝自动播放时保持封面帧即可 */
      });
    }

    if (carouselStatus) {
      carouselStatus.textContent = `第 ${index + 1} / ${carouselSlides.length} 条 · 右上角图标开声音`;
    }
  };

  const goTo = (slide) => {
    slide.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  /* 谁在 .carousel-viewport 里露出最多，谁就是当前项 —— 覆盖点击箭头、
     拖拽、滚轮三种切换方式，不用分别处理 */
  const activeObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target);
    },
    { root: carouselViewport, threshold: [0.6, 0.75, 0.9] },
  );
  carouselSlides.forEach((slide) => activeObserver.observe(slide));

  /* 播完自动切下一条，最后一条播完回到第一条 */
  carouselSlides.forEach((slide, index) => {
    slide.querySelector("video")?.addEventListener("ended", () => {
      const next = carouselSlides[(index + 1) % carouselSlides.length];
      goTo(next);
    });
  });

  document.querySelector("[data-carousel-prev]")?.addEventListener("click", () => {
    if (!activeSlide) return;
    const index = carouselSlides.indexOf(activeSlide);
    goTo(carouselSlides[(index - 1 + carouselSlides.length) % carouselSlides.length]);
  });

  document.querySelector("[data-carousel-next]")?.addEventListener("click", () => {
    if (!activeSlide) return;
    const index = carouselSlides.indexOf(activeSlide);
    goTo(carouselSlides[(index + 1) % carouselSlides.length]);
  });

  document.querySelectorAll(".clip-sound").forEach((button) => {
    button.addEventListener("click", () => {
      const video = button.closest(".clip")?.querySelector("video");
      if (!video) return;
      const turnOn = video.muted;

      /* 先把所有的静音，保证同一时间只有一条出声 */
      carouselSlides.forEach((slide) => {
        const other = slide.querySelector("video");
        if (other) other.muted = true;
      });
      document.querySelectorAll(".clip-sound").forEach((other) => {
        other.classList.remove("is-on");
        other.setAttribute("aria-pressed", "false");
      });

      if (turnOn) {
        video.muted = false;
        video.play().catch(() => {});
        button.classList.add("is-on");
        button.setAttribute("aria-pressed", "true");
      }
    });
  });

  /* 翻页离开这一屏时暂停，回来再继续播——不用「谁在视口正中」那套判定，
     只关心整个轮播区块本身是否还在可视范围内 */
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      sectionVisible = !!entries[0]?.isIntersecting;
      const video = activeSlide?.querySelector("video");
      if (!video) return;
      if (sectionVisible) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    },
    { threshold: 0.3 },
  );
  sectionObserver.observe(carousel);
}

/* --- AI 视频作品墙 ---------------------------------------------------------
   六条视频同时循环；离开这一屏时统一暂停，回来后继续。声音仍一次只允许一条，
   避免多个视频混音。旧轮播选择器不再命中，因此上面的轮播逻辑不会运行。
   -------------------------------------------------------------------------- */
const videoWall = document.querySelector("[data-video-wall]");

if (videoWall) {
  const wallVideos = [...videoWall.querySelectorAll("video")];
  const playWall = () => wallVideos.forEach((video) => video.play().catch(() => {}));
  const pauseWall = () => wallVideos.forEach((video) => video.pause());

  videoWall.querySelectorAll(".clip-sound").forEach((button) => {
    button.addEventListener("click", () => {
      const video = button.closest(".clip")?.querySelector("video");
      if (!video) return;
      const turnOn = video.muted;

      videoWall.querySelectorAll("video").forEach((other) => { other.muted = true; });
      videoWall.querySelectorAll(".clip-sound").forEach((other) => {
        other.classList.remove("is-on");
        other.setAttribute("aria-pressed", "false");
      });

      if (turnOn) {
        video.muted = false;
        video.play().catch(() => {});
        button.classList.add("is-on");
        button.setAttribute("aria-pressed", "true");
      }
    });
  });

  new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? playWall() : pauseWall()),
    { threshold: 0.2 },
  ).observe(videoWall);
}

/* --- 影刀 RPA 证书 --------------------------------------------------------
   一张案例图居中展示；点击左右按键切换，首尾循环。 */
const rpaShowcase = document.querySelector("[data-rpa-showcase]");

if (rpaShowcase) {
  const rpaSlides = [
    { src: "assets/work/rpa/01.jpg", alt: "影刀 RPA 自动化作品 01", level: "影刀 RPA 自动化作品 01" },
    { src: "assets/work/rpa/02.jpg", alt: "影刀 RPA 自动化作品 02", level: "影刀 RPA 自动化作品 02" },
    { src: "assets/work/rpa/03.jpg", alt: "影刀 RPA 自动化作品 03", level: "影刀 RPA 自动化作品 03" },
    { src: "assets/work/rpa/04.jpg", alt: "影刀 RPA 自动化作品 04", level: "影刀 RPA 自动化作品 04" },
    { src: "assets/work/rpa/05.jpg", alt: "影刀 RPA 自动化作品 05", level: "影刀 RPA 自动化作品 05" },
    { src: "assets/work/rpa/06.png", alt: "影刀 RPA 自动化作品 06", level: "影刀 RPA 自动化作品 06" },
  ];
  const rpaImage = rpaShowcase.querySelector("[data-rpa-image]");
  const rpaLevel = rpaShowcase.querySelector("[data-rpa-level]");
  const rpaStatus = document.querySelector("[data-rpa-status]");
  let rpaIndex = 0;

  const showRpa = (index) => {
    rpaIndex = (index + rpaSlides.length) % rpaSlides.length;
    const slide = rpaSlides[rpaIndex];
    if (rpaImage) {
      rpaImage.classList.add("is-changing");
      window.setTimeout(() => {
        rpaImage.src = slide.src;
        rpaImage.alt = slide.alt;
        rpaImage.classList.remove("is-changing");
      }, 120);
    }
    if (rpaLevel) rpaLevel.textContent = slide.level;
    if (rpaStatus) rpaStatus.textContent = `${String(rpaIndex + 1).padStart(2, "0")} / ${String(rpaSlides.length).padStart(2, "0")} · 点击左右按键切换`;
  };

  rpaShowcase.querySelector("[data-rpa-prev]")?.addEventListener("click", () => showRpa(rpaIndex - 1));
  rpaShowcase.querySelector("[data-rpa-next]")?.addEventListener("click", () => showRpa(rpaIndex + 1));
}

/* --- AI 生成工作台 --------------------------------------------------------
   与 RPA 案例保持相同的单图居中展示，按素材编号顺序切换。 */
const workbenchShowcase = document.querySelector("[data-workbench-showcase]");

if (workbenchShowcase) {
  const workbenchSlides = [
    "assets/work/ai-workbench/01.jpg",
    "assets/work/ai-workbench/02.jpg",
    "assets/work/ai-workbench/03.jpg",
    "assets/work/ai-workbench/04.jpg",
  ];
  const workbenchImage = workbenchShowcase.querySelector("[data-workbench-image]");
  const workbenchLevel = workbenchShowcase.querySelector("[data-workbench-level]");
  const workbenchStatus = document.querySelector("[data-workbench-status]");
  let workbenchIndex = 0;

  const showWorkbench = (index) => {
    workbenchIndex = (index + workbenchSlides.length) % workbenchSlides.length;
    if (workbenchImage) {
      workbenchImage.classList.add("is-changing");
      window.setTimeout(() => {
        const number = String(workbenchIndex + 1).padStart(2, "0");
        workbenchImage.src = workbenchSlides[workbenchIndex];
        workbenchImage.alt = `AI 生成工作台界面 ${number}`;
        workbenchImage.classList.remove("is-changing");
      }, 120);
    }
    const number = String(workbenchIndex + 1).padStart(2, "0");
    if (workbenchLevel) workbenchLevel.textContent = `AI 生成工作台界面 ${number}`;
    if (workbenchStatus) workbenchStatus.textContent = `${number} / ${String(workbenchSlides.length).padStart(2, "0")} · 点击左右按键切换`;
  };

  workbenchShowcase.querySelector("[data-workbench-prev]")?.addEventListener("click", () => showWorkbench(workbenchIndex - 1));
  workbenchShowcase.querySelector("[data-workbench-next]")?.addEventListener("click", () => showWorkbench(workbenchIndex + 1));
}

/* --- 放大查看器 ----------------------------------------------------------
   1280×720 的稿子铺进一屏后正文很小，点开按原始尺寸看细节。
   手机上尤其必要 —— 一帧在 375px 屏上只有 190px 高。
   -------------------------------------------------------------------------- */
const viewer = document.querySelector("[data-viewer]");
const viewerImage = viewer?.querySelector("img");
let lastTrigger = null;

const openViewer = (source) => {
  if (!viewer || !viewerImage) return;
  viewerImage.src = source.src;
  viewerImage.alt = source.alt;
  /* 竖图按高度适配，横向的整页稿按 1280 宽显示原始尺寸 */
  viewer.classList.toggle("is-portrait", source.naturalHeight > source.naturalWidth);
  viewer.classList.add("is-open");
  document.body.classList.add("viewer-open");
  viewer.scrollTop = 0;
  viewer.querySelector("[data-viewer-close]")?.focus();
};

const closeViewer = () => {
  if (!viewer) return;
  viewer.classList.remove("is-open");
  document.body.classList.remove("viewer-open");
  lastTrigger?.focus();
  lastTrigger = null;
};

document.querySelectorAll(".frame-shot").forEach((shot) => {
  /* 放大角标用 JS 插入，省得在每个 .frame 里重复同一段标记 */
  shot.insertAdjacentHTML(
    "beforeend",
    '<span class="shot-zoom" aria-hidden="true"><svg class="icon"><use href="#i-expand" /></svg></span>',
  );

  shot.addEventListener("click", () => {
    const image = shot.querySelector("img");
    if (!image) return;
    lastTrigger = shot;
    openViewer(image);
  });
});

/* AI 页的图不在 .frame-shot 里（那是 16:9 整页稿的容器），单独挂一遍 */
document.querySelectorAll(".combo-set img, .tile-grid img").forEach((image) => {
  image.classList.add("is-zoomable");
  image.addEventListener("click", () => {
    lastTrigger = image;
    openViewer(image);
  });
});

viewer?.addEventListener("click", (event) => {
  /* 点图片本身不关闭，点空白或关闭按钮才关 */
  if (event.target === viewerImage) return;
  closeViewer();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (viewer?.classList.contains("is-open")) closeViewer();
});
