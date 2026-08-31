const body = document.body;
const languageMenus = document.querySelectorAll("[data-language-menu]");
const languageToggles = document.querySelectorAll("[data-language-toggle]");
const languageOptions = document.querySelectorAll("[data-language-option]");
const reveals = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-tabs a");

const savedLanguage = window.localStorage?.getItem("coolab-language");
body.dataset.language = savedLanguage || body.dataset.language || "en";
document.documentElement.lang = body.dataset.language === "zh" ? "zh-CN" : "en";

const updateLanguageLabels = () => {
  document.querySelectorAll("[data-lang-label]").forEach((label) => {
    label.textContent = body.dataset.language === "en" ? "English" : "中文";
  });
  languageOptions.forEach((option) => {
    const isActive = option.getAttribute("data-language-option") === body.dataset.language;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-selected", isActive ? "true" : "false");
  });
};

const closeLanguageMenus = () => {
  languageMenus.forEach((menu) => {
    menu.classList.remove("open");
    menu.querySelector("[data-language-toggle]")?.setAttribute("aria-expanded", "false");
  });
};

const setLanguage = (next) => {
  body.dataset.language = next;
  document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  window.localStorage?.setItem("coolab-language", next);
  updateLanguageLabels();
};

languageToggles.forEach((languageToggle) => {
  languageToggle.addEventListener("click", (event) => {
    const menu = languageToggle.closest("[data-language-menu]");
    if (!menu) {
      setLanguage(body.dataset.language === "en" ? "zh" : "en");
      return;
    }
    event.stopPropagation();
    const willOpen = !menu.classList.contains("open");
    closeLanguageMenus();
    menu.classList.toggle("open", willOpen);
    languageToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
});

languageOptions.forEach((option) => {
  option.addEventListener("click", (event) => {
    event.stopPropagation();
    const next = option.getAttribute("data-language-option");
    if (next === "en" || next === "zh") setLanguage(next);
    closeLanguageMenus();
  });
});

document.addEventListener("click", closeLanguageMenus);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLanguageMenus();
});

updateLanguageLabels();

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
);

reveals.forEach((element) => revealObserver.observe(element));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const id = visible.target.id;
    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("active", href.startsWith("#") && href === `#${id}`);
    });
  },
  { threshold: [0.35, 0.5, 0.65], rootMargin: "-18% 0px -36% 0px" },
);

sections.forEach((section) => sectionObserver.observe(section));

document.querySelectorAll("[data-video-tabs]").forEach((tabGroup) => {
  const video = tabGroup.querySelector("[data-tab-video]");
  const source = video?.querySelector("source");
  const tabs = Array.from(tabGroup.querySelectorAll("[data-video-tab]"));

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const nextSource = tab.getAttribute("data-video-src");
      if (!video || !source || !nextSource || source.getAttribute("src") === nextSource) return;
      tabs.forEach((item) => item.classList.toggle("active", item === tab));
      source.setAttribute("src", nextSource);
      video.load();
      video.play().catch(() => {});
    });
  });
});

document.querySelectorAll("[data-feature-book]").forEach((book) => {
  const pages = Array.from(book.querySelectorAll("[data-book-page]"));
  const prevButton = book.querySelector("[data-book-prev]");
  const nextButton = book.querySelector("[data-book-next]");
  const dotsContainer = book.querySelector("[data-book-dots]");
  const intervalMs = Number(book.getAttribute("data-auto-flip")) || 5200;
  let activeIndex = Math.max(0, pages.findIndex((page) => page.classList.contains("active")));
  let timerId;

  if (pages.length <= 1) return;

  const dots = pages.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to page ${index + 1}`);
    dot.addEventListener("click", () => {
      showPage(index, index < activeIndex ? "back" : "forward");
      restartTimer();
    });
    dotsContainer?.appendChild(dot);
    return dot;
  });

  const syncDots = () => {
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === activeIndex);
      dot.setAttribute("aria-current", index === activeIndex ? "page" : "false");
    });
  };

  function showPage(nextIndex, direction = "forward") {
    if (nextIndex === activeIndex) return;
    const currentPage = pages[activeIndex];
    const nextPage = pages[nextIndex];
    currentPage.classList.remove("active", "turning-forward", "turning-back");
    nextPage.classList.remove("turning-forward", "turning-back");
    nextPage.classList.add("active", direction === "back" ? "turning-back" : "turning-forward");
    activeIndex = nextIndex;
    syncDots();

    window.setTimeout(() => {
      nextPage.classList.remove("turning-forward", "turning-back");
    }, 700);
  }

  const goNext = () => showPage((activeIndex + 1) % pages.length, "forward");
  const goPrev = () => showPage((activeIndex - 1 + pages.length) % pages.length, "back");

  function restartTimer() {
    window.clearInterval(timerId);
    timerId = window.setInterval(goNext, intervalMs);
  }

  prevButton?.addEventListener("click", () => {
    goPrev();
    restartTimer();
  });

  nextButton?.addEventListener("click", () => {
    goNext();
    restartTimer();
  });

  syncDots();
  restartTimer();
});
