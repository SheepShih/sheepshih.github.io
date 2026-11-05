/* サイト全体のBGM。外枠(index.html)だけが読み込むので、中のページを移っても止まらない。
   ボタンは置かず自動で流す。ブラウザはページを開いただけでは音を出させないので、
   流せなかったときは最初のタップ・クリック・キー入力(中のページでのものも含む)で流し始める。 */
(function () {
  var SRC = "assets/bgm/old-chicago.m4a?v=1";
  var KEY = "bgmState";

  var audio = new Audio(SRC);
  audio.loop = true;
  audio.preload = "auto";

  // 再読み込みしたときは続きから
  var saved = null;
  try { saved = JSON.parse(window.sessionStorage.getItem(KEY)); } catch (e) {}
  audio.addEventListener("loadedmetadata", function () {
    if (saved && saved.t && audio.duration) {
      try { audio.currentTime = saved.t % audio.duration; } catch (e) {}
    }
  });
  function save() {
    if (!audio.duration) return;
    try { window.sessionStorage.setItem(KEY, JSON.stringify({ t: audio.currentTime })); } catch (e) {}
  }
  setInterval(function () { if (!audio.paused) save(); }, 1000);
  window.addEventListener("pagehide", save);

  var EVENTS = ["pointerdown", "touchend", "click", "keydown"];
  var waiting = false;
  function play() {
    if (!audio.paused) return;
    var p = audio.play();
    if (p && p.then) p.then(function () { waiting = false; }, function () { waiting = true; });
  }
  function unlock() { if (waiting || audio.paused) play(); }
  function listenOn(w) {
    EVENTS.forEach(function (ev) { w.addEventListener(ev, unlock, true); });
  }

  listenOn(window);
  var frame = document.getElementById("page");
  // 中のページは移るたびに作り直されるので、新しいページを見つけたら聞き直す
  // (読み込み途中のタップも拾えるよう、load を待たずに見に行く)
  var lastDoc = null;
  function watchFrame() {
    var d = null;
    try { d = frame.contentDocument; } catch (e) {}
    if (d && d !== lastDoc) {
      lastDoc = d;
      EVENTS.forEach(function (ev) { d.addEventListener(ev, unlock, true); });
    }
  }
  if (frame) setInterval(watchFrame, 200);
  // 「戻る」で表示し直されたとき(bfcache)も流す
  window.addEventListener("pageshow", function (e) { if (e.persisted) play(); });

  play();
})();
