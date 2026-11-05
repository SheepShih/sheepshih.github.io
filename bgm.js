/* サイト全体のBGM。ボタンは置かず自動で流す。
   ブラウザはページを開いただけでは音を出させないので、流せなかったときは
   最初のタップ・クリック・キー入力で流し始める。
   ページを移るときに再生位置を覚えておき、次のページで続きから流す。 */
(function () {
  var SRC = "assets/bgm/old-chicago.m4a?v=1";
  var KEY = "bgmState";

  var audio = new Audio(SRC);
  audio.loop = true;
  audio.preload = "auto";

  function load() {
    try { return JSON.parse(window.sessionStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function save() {
    if (!audio.duration) return;
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify({ t: audio.currentTime, at: Date.now() }));
    } catch (e) {}
  }

  // 前のページで流れていた位置 + ページを移るのにかかった時間 から続ける
  var saved = load();
  var startAt = saved ? saved.t + Math.min(Date.now() - saved.at, 10000) / 1000 : 0;
  audio.addEventListener("loadedmetadata", function () {
    if (startAt && audio.duration) {
      try { audio.currentTime = startAt % audio.duration; } catch (e) {}
    }
  });

  var EVENTS = ["pointerdown", "touchend", "click", "keydown"];
  function unlock() {
    play();
  }
  function listen(on) {
    EVENTS.forEach(function (ev) {
      if (on) window.addEventListener(ev, unlock, true);
      else window.removeEventListener(ev, unlock, true);
    });
  }
  function play() {
    if (!audio.paused) return;
    var p = audio.play();
    if (p && p.then) {
      p.then(function () { listen(false); }, function () { listen(true); });
    } else {
      listen(false);
    }
  }

  setInterval(function () { if (!audio.paused) save(); }, 1000);
  window.addEventListener("pagehide", save);
  // 「戻る」で表示し直されたページ(bfcache)でも続きを流す
  window.addEventListener("pageshow", function (e) { if (e.persisted) play(); });

  listen(true);
  play();
})();
