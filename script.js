// ---------- ドア開閉スクロールアニメーション ----------
(function () {
  const stage = document.getElementById("doorStage");
  const frames = Array.from(document.querySelectorAll(".door-frame"));
  if (!stage || frames.length === 0) return;

  let ticking = false;
  let currentIndex = 0;

  function updateFrame() {
    ticking = false;
    const rect = stage.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const scrollable = rect.height - viewportH;
    const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
    const progress = scrollable > 0 ? scrolled / scrollable : 0;

    const index = Math.min(
      frames.length - 1,
      Math.floor(progress * frames.length)
    );

    // スクロールが始まったらscrollテキストを非表示
    stage.classList.toggle("is-scrolled", scrolled > 10);

    if (index !== currentIndex) {
      frames[currentIndex].classList.remove("active");
      frames[index].classList.add("active");
      currentIndex = index;

      const isInterior = index === frames.length - 1;
      stage.classList.toggle("door-open", isInterior);
      if (!isInterior) closeMenu();
    }
  }

  // ---------- ハンバーガーメニュー ----------
  const burger = document.getElementById("hamburgerMenu");
  const overlay = document.getElementById("menuOverlay");

  function closeMenu() {
    if (!overlay || !overlay.classList.contains("open")) return;
    overlay.classList.remove("open");
    stage.classList.remove("menu-open");
    overlay.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "メニューを開く");
  }

  if (burger && overlay) {
    burger.addEventListener("click", () => {
      const open = overlay.classList.toggle("open");
      stage.classList.toggle("menu-open", open);
      overlay.setAttribute("aria-hidden", String(!open));
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
  }

  // ---------- ページ切替エフェクト ----------
  // Aboutへの遷移時のみフェードアウトしてから移動する(Worksはエフェクトなし)
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll('a[href="about.html"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      if (reduceMotion) return;
      e.preventDefault();
      document.body.classList.add("page-leave");
      setTimeout(() => { window.location.href = link.getAttribute("href"); }, 380);
    });
  });

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateFrame);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("orientationchange", onScroll, { passive: true });
  updateFrame();
})();
