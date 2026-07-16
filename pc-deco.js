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

  // 登場演出: 各パーツを背面→前面の順に少しずつ遅らせてポップインさせる
  var deco = document.querySelector(".pc-deco");
  if (!deco) return;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var imgs = deco.querySelectorAll("img");
  var introItems = deco.querySelectorAll("img, .deco-border");
  var introDelay = 0;
  if (!reduceMotion) {
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
      active.classList.remove("dragging");
      try { active.releasePointerCapture(e.pointerId); } catch (err) {}
      active = null;
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
    });
  }

  if (reduceMotion) {
    enableDrag();
  } else {
    setTimeout(enableDrag, introDelay * 1000 + 100);
  }
})();
