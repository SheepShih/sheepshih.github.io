/* PC幅のみの装飾マークアップ(index / about / works 共通・1箇所で管理)
   並び順 = 重なり順(先に書いたものが背面)。Figmaのレイヤー順に合わせる */
(function () {
  var html =
    '<div class="pc-deco">' +
    '  <div class="deco-border"></div>' +
    '  <img class="deco-poster-news" src="assets/img/poster-news.webp?v=4" alt="">' +
    '  <img class="deco-poster-rocky" src="assets/img/poster-rocky.webp?v=1" alt="">' +
    '  <img class="deco-disco" src="assets/img/disco-ball.gif?v=2" alt="">' +
    '  <img class="deco-people" src="assets/img/people.webp" alt="">' +
    '  <img class="deco-hello" src="assets/img/hello-text.webp?v=2" alt="HELLO! WHERE ARE YOU? BRAIN">' +
    '  <img class="deco-tvphone" src="assets/img/tv-phone.gif?v=4" alt="">' +
    '  <img class="deco-teddy" src="assets/img/deco-teddy.webp" alt="">' +
    '  <img class="deco-star deco-star1" src="assets/img/star-left.svg" alt="">' +
    '  <img class="deco-star deco-star4" src="assets/img/star-right.svg" alt="">' +
    '  <img class="deco-star deco-star6" src="assets/img/star-6.svg" alt="">' +
    '  <img class="deco-cover" src="assets/img/record-cover.webp?v=1" alt="">' +
    '  <img class="deco-star deco-star3" src="assets/img/star-3.svg" alt="">' +
    '  <img class="deco-sign" src="assets/img/sign.webp" alt="DINER">' +
    '  <img class="deco-poster-disco" src="assets/img/poster-disco.webp?v=1" alt="">' +
    '  <img class="deco-record" src="assets/img/record-player.gif?v=2" alt="">' +
    '  <img class="deco-poster-clip" src="assets/img/poster-clip.webp?v=2" alt="">' +
    '  <img class="deco-signature" src="assets/img/deco-signature.svg?v=3" alt="Shih Ting Fang">' +
    '  <img class="deco-dream" src="assets/img/dream-sign.webp?v=5" alt="DON\'T DREAM IT, BE IT.">' +
    '  <img class="deco-car" src="assets/img/deco-car.webp?v=2" alt="">' +
    '  <img class="deco-star deco-star-bear" src="assets/img/star-record.svg?v=1" alt="">' +
    '  <img class="deco-camera" src="assets/img/deco-camera.webp?v=2" alt="">' +
    '</div>';
  document.body.insertAdjacentHTML("beforeend", html);

  var deco = document.querySelector(".pc-deco");
  if (!deco) return;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var imgs = deco.querySelectorAll("img");
  var introItems = deco.querySelectorAll("img, .deco-border");

  // ページをまたいで装飾をリフレッシュさせないための状態(タブを閉じるまで保持)
  // ・登場演出は最初のページだけ ・ドラッグで動かした位置は次のページでも維持
  function sget(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  function keyOf(el) {
    var cls = el.className.split(/\s+/).filter(function (c) {
      return c.indexOf("deco-") === 0 && c !== "deco-star";
    });
    return cls[cls.length - 1] || "";
  }
  function savePositions() {
    var pos = {};
    for (var k = 0; k < imgs.length; k++) {
      var dx = parseFloat(imgs[k].dataset.dx) || 0, dy = parseFloat(imgs[k].dataset.dy) || 0;
      if (dx || dy) pos[keyOf(imgs[k])] = [dx, dy];
    }
    sset("pcDecoPos", JSON.stringify(pos));
  }
  // ページの再読み込み(リロード)のときは装飾をリセット: 演出を最初から、位置も元に戻す
  // (リンクでのページ移動はリフレッシュしない)
  var navType = "";
  try {
    var nav = performance.getEntriesByType("navigation")[0];
    navType = nav ? nav.type : (performance.navigation && performance.navigation.type === 1 ? "reload" : "");
  } catch (e) {}
  if (navType === "reload") {
    try {
      window.sessionStorage.removeItem("pcDecoIntro");
      window.sessionStorage.removeItem("pcDecoPos");
    } catch (e) {}
  }
  var introSeen = sget("pcDecoIntro") === "1";
  sset("pcDecoIntro", "1");

  if (introSeen) {
    // 2ページ目以降: 演出なしで即表示し、前のページでの位置を復元
    var saved = {};
    try { saved = JSON.parse(sget("pcDecoPos") || "{}") || {}; } catch (e) {}
    for (var s = 0; s < introItems.length; s++) introItems[s].style.animation = "none";
    for (var p = 0; p < imgs.length; p++) {
      var xy = saved[keyOf(imgs[p])];
      if (xy) {
        imgs[p].dataset.dx = xy[0];
        imgs[p].dataset.dy = xy[1];
        imgs[p].style.transform = "translate(" + xy[0] + "px," + xy[1] + "px)";
      }
    }
  }

  // 登場演出: 各パーツを背面→前面の順に少しずつ遅らせてポップインさせる
  var introDelay = 0;
  if (!reduceMotion && !introSeen) {
    for (var i = 0; i < introItems.length; i++) {
      introItems[i].style.animationDelay = (i * 0.045).toFixed(3) + "s";
    }
    introDelay = (introItems.length - 1) * 0.045 + 0.72; // 最後のパーツが着地するまで
  }

  // 登場演出のあと、来訪者が各パーツを自由にドラッグできるようにする
  function enableDrag() {
    deco.classList.add("interactive");
    var topZ = 100;
    for (var j = 0; j < imgs.length; j++) {
      // アニメの保持状態を解除してインラインtransform(移動量)を効かせる
      imgs[j].style.animation = "none";
      if (imgs[j].dataset.dx === undefined) { imgs[j].dataset.dx = "0"; imgs[j].dataset.dy = "0"; }
      imgs[j].setAttribute("draggable", "false"); // 画像のネイティブドラッグを無効化
    }

    var active = null, startX = 0, startY = 0, baseX = 0, baseY = 0, moved = false;

    deco.addEventListener("pointerdown", function (e) {
      var el = e.target.closest(".pc-deco img");
      if (!el) return;
      active = el;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      baseX = parseFloat(el.dataset.dx) || 0;
      baseY = parseFloat(el.dataset.dy) || 0;
      el.style.zIndex = ++topZ;      // 掴んだものを最前面へ
      el.classList.add("dragging");
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    deco.addEventListener("pointermove", function (e) {
      if (!active) return;
      var dx = baseX + (e.clientX - startX);
      var dy = baseY + (e.clientY - startY);
      if (Math.abs(e.clientX - startX) > 2 || Math.abs(e.clientY - startY) > 2) moved = true;
      active.dataset.dx = dx;
      active.dataset.dy = dy;
      active.style.transform = "translate(" + dx + "px," + dy + "px)";
    });

    function endDrag(e) {
      if (!active) return;
      var el = active;
      active.classList.remove("dragging");
      try { active.releasePointerCapture(e.pointerId); } catch (err) {}
      active = null;
      if (moved) savePositions(); // 次のページでも同じ位置に
      // 動かさずにカメラを離した=タップ → 画面を撮る
      if (!moved && el.classList.contains("deco-camera")) { fireCamera(); }
    }
    deco.addEventListener("pointerup", endDrag);
    deco.addEventListener("pointercancel", endDrag);

    // ダブルクリックでそのパーツを元の位置に戻す
    deco.addEventListener("dblclick", function (e) {
      var el = e.target.closest(".pc-deco img");
      if (!el) return;
      el.dataset.dx = "0";
      el.dataset.dy = "0";
      el.style.transform = "";
      savePositions();
    });
  }

  if (reduceMotion || introSeen) {
    enableDrag();
  } else {
    setTimeout(enableDrag, introDelay * 1000 + 100);
  }

  // ---------- カメラをタップして画面をパシャッと撮る ----------
  // html2canvasはタップ時に初めて読み込む(初期表示を軽く保つ)
  function loadH2C(cb) {
    if (window.html2canvas) { cb(); return; }
    var s = document.createElement("script");
    s.src = "assets/vendor/html2canvas.min.js";
    s.onload = function () { cb(); };
    s.onerror = function () { cb(new Error("html2canvas load failed")); };
    document.head.appendChild(s);
  }

  var flashEl = null, capturing = false;
  function ensureFlash() {
    if (flashEl) return flashEl;
    flashEl = document.createElement("div");
    flashEl.className = "cam-flash";
    flashEl.setAttribute("data-html2canvas-ignore", "true"); // 撮影画像には写さない
    document.body.appendChild(flashEl);
    return flashEl;
  }

  function stamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" +
           p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function fireCamera() {
    if (capturing) return;
    capturing = true;

    // シャッターの白フラッシュ
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      var f = ensureFlash();
      f.classList.remove("fire");
      void f.offsetWidth; // リフローで再生をリセット
      f.classList.add("fire");
    }

    // 画面を画像化してダウンロード
    loadH2C(function (err) {
      if (err || !window.html2canvas) { capturing = false; return; }
      window.html2canvas(document.body, {
        backgroundColor: null,
        useCORS: true,
        logging: false,
        scale: Math.min(2, window.devicePixelRatio || 1),
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight
      }).then(function (canvas) {
        canvas.toBlob(function (blob) {
          if (blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = "shihtingfang-diner-" + stamp() + ".png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
          }
          capturing = false;
        }, "image/png");
      })["catch"](function () { capturing = false; });
    });
  }
})();
