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

  // 閉じるときは開くときの逆: ハンバーガーが閉じるのと同時に、
  // 各項目が下の項目から順にハンバーガーの中心へ吸い込まれてから消える
  const CLOSE_MS = 450 + 3 * 50; // 吸い込み0.45s + 時間差(css と合わせる)
  let closeTimer = null;
  function closeMenu(instant) {
    if (!overlay || !overlay.classList.contains("open") || overlay.classList.contains("closing")) return;
    stage.classList.remove("menu-open"); // ハンバーガーはすぐ閉じる
    overlay.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "メニューを開く");
    const finish = () => {
      overlay.classList.remove("open", "closing");
      closeTimer = null;
    };
    if (instant === true || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setBurstOrigins();
    overlay.classList.add("closing");
    closeTimer = setTimeout(finish, CLOSE_MS);
  }

  // 各メニュー項目からハンバーガー中心までの距離を測り、飛び出す起点にする
  function setBurstOrigins() {
    const b = burger.getBoundingClientRect();
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    overlay.querySelectorAll(".menu-list li").forEach((li, i) => {
      const r = li.getBoundingClientRect();
      li.style.setProperty("--from-x", (bx - (r.left + r.width / 2)) + "px");
      li.style.setProperty("--from-y", (by - (r.top + r.height / 2)) + "px");
      li.style.setProperty("--i", i);
    });
  }

  if (burger && overlay) {
    burger.addEventListener("click", () => {
      if (overlay.classList.contains("open") && !overlay.classList.contains("closing")) {
        closeMenu();
        return;
      }
      // 閉じる途中で押されたら、その場で開き直す
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      overlay.classList.remove("open", "closing");
      setBurstOrigins();
      void overlay.offsetWidth; // アニメーションを最初から再生させる
      overlay.classList.add("open");
      stage.classList.add("menu-open");
      overlay.setAttribute("aria-hidden", "false");
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "メニューを閉じる");
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
