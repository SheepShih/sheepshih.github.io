/* Works の回転ダイヤル電話でパスワードを入力する。
   番号はここにもHTMLにも持たない。assets/works.enc.json を入力された番号で
   復号できたときだけ中身(AES-GCM)を表示する。暗号化は tools/encrypt-works.py */
(function () {
  var frame = document.getElementById("worksFrame");
  var hit = document.getElementById("dialHit");
  var wheel = document.getElementById("dialWheel");
  var dots = document.getElementById("dialDots");
  var status = document.getElementById("dialStatus");
  var secret = document.getElementById("worksSecret");

  // 穴の角度(度。時計の3時が0で時計回りが正、楕円を円に戻した座標)。並びは 1,2,…,9,0
  var HOLES = [-46, -76, -106, -136, -166, -196, -226, -256, -286, -316];
  var DIGITS = "1234567890";
  var FIRST_TRAVEL = 60; // 「1」を指止めまで回す角度。数字が1つ増えるごとに30度増える
  var SQUASH = 0.669;    // ダイヤルの楕円の縦横比(CSSの scaleY と同じ値)
  var RETURN_SPEED = 420; // 戻る速さ(度/秒)

  var digitsNeeded = 8;
  var entered = "";
  var locked = false; // 戻っている間・照合中・解錠後は入力できない
  var drag = null;
  var rotation = 0;

  var enc = null;
  fetch("assets/works.enc.json?v=2").then(function (r) { return r.json(); }).then(function (d) {
    enc = d;
    digitsNeeded = d.digits;
    renderDots();
  })["catch"](function () {});

  function renderDots() {
    var html = "";
    for (var i = 0; i < digitsNeeded; i++) html += "<i" + (i < entered.length ? ' class="on"' : "") + "></i>";
    dots.innerHTML = html;
    dots.style.gridTemplateColumns = "repeat(" + Math.ceil(digitsNeeded / 2) + ", 3px)"; // 2行に並べる
  }
  renderDots();

  function setRotation(deg) {
    rotation = deg;
    wheel.style.setProperty("--dial-rot", deg + "deg");
  }

  // ---------- 音(WebAudioで合成。最初の操作で鳴らせるようになる) ----------
  var ctx = null;
  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function click(volume, freq) {
    var ac = audio();
    if (!ac) return;
    var len = Math.floor(ac.sampleRate * 0.012);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ac.createBufferSource();
    src.buffer = buf;
    var band = ac.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = freq;
    band.Q.value = 2;
    var gain = ac.createGain();
    gain.gain.value = volume;
    src.connect(band);
    band.connect(gain);
    gain.connect(ac.destination);
    src.start();
  }
  function busyTone() { // 話し中の音(日本の電話と同じ 400Hz・0.5秒おき)
    var ac = audio();
    if (!ac) return;
    var t = ac.currentTime + 0.05;
    var osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 400;
    var gain = ac.createGain();
    gain.gain.setValueAtTime(0, t);
    for (var i = 0; i < 3; i++) {
      gain.gain.setValueAtTime(0.14, t + i);
      gain.gain.setValueAtTime(0, t + i + 0.5);
    }
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 2.6);
  }

  // ---------- ダイヤルを戻す ----------
  function spinBack(done) {
    var last = null, nextTick = Math.floor(rotation / 30) * 30;
    function step(now) {
      if (last === null) last = now;
      var next = Math.max(0, rotation - RETURN_SPEED * Math.min(now - last, 50) / 1000);
      last = now;
      while (next <= nextTick && nextTick > 0) { click(0.5, 2200); nextTick -= 30; }
      setRotation(next);
      if (next > 0) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
  }

  function dialed(digit) {
    entered += digit;
    renderDots();
    status.textContent = entered.length + "桁入力";
    if (enc && entered.length >= digitsNeeded) verify();
  }

  // ---------- 番号の照合(復号できたら正解) ----------
  function b64(s) {
    return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); });
  }
  function verify() {
    locked = true;
    var te = new TextEncoder();
    crypto.subtle.importKey("raw", te.encode(entered), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: b64(enc.salt), iterations: enc.iter, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    }).then(function (key) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(enc.iv) }, key, b64(enc.ct));
    }).then(function (plain) {
      secret.innerHTML = new TextDecoder().decode(plain);
      frame.classList.add("unlocked");
      hit.style.display = "none";
      click(0.8, 900);
      status.textContent = "つながりました";
    })["catch"](function () {
      busyTone();
      status.textContent = "番号が違います";
      frame.classList.add("dial-wrong");
      setTimeout(function () {
        frame.classList.remove("dial-wrong");
        entered = "";
        renderDots();
        locked = false;
      }, 2600);
    });
  }

  // ---------- 指で回す ----------
  function polar(e) {
    var r = wheel.parentNode.getBoundingClientRect();
    var nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    var ny = (e.clientY - (r.top + r.height / 2)) / (r.width / 2 * SQUASH);
    return { r: Math.sqrt(nx * nx + ny * ny), a: Math.atan2(ny, nx) * 180 / Math.PI };
  }
  function delta(a, b) { // a から b への最短の角度差(時計回りが正)
    var d = (b - a) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  hit.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    audio();
    if (locked || rotation > 0) return;
    var p = polar(e);
    if (p.r < 0.4 || p.r > 1.25) return;
    var best = -1, bestGap = 16; // 穴から16度以内を掴んだときだけ回せる
    HOLES.forEach(function (h, i) {
      var g = Math.abs(delta(h, p.a));
      if (g < bestGap) { bestGap = g; best = i; }
    });
    if (best < 0) return;
    drag = { index: best, max: FIRST_TRAVEL + best * 30, angle: p.a, ticks: 0 };
    frame.classList.add("dial-grabbing");
    hit.setPointerCapture(e.pointerId);
  });

  hit.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var p = polar(e);
    var next = Math.max(0, Math.min(drag.max, rotation + delta(drag.angle, p.a)));
    drag.angle = p.a;
    setRotation(next);
    var ticks = Math.floor(next / 30);
    if (ticks > drag.ticks) click(0.25, 3200);
    drag.ticks = ticks;
  });

  function release() {
    if (!drag) return;
    var d = drag;
    drag = null;
    frame.classList.remove("dial-grabbing");
    var reached = rotation >= d.max - 14; // 指止めまで回したら1桁入力
    locked = true;
    spinBack(function () {
      locked = false;
      if (reached) dialed(DIGITS.charAt(d.index));
    });
  }
  hit.addEventListener("pointerup", release);
  hit.addEventListener("pointercancel", release);

  // キーボードの数字でも回せる
  window.addEventListener("keydown", function (e) {
    var i = DIGITS.indexOf(e.key);
    if (i < 0 || e.key.length !== 1 || locked || drag || frame.classList.contains("melting")) return;
    locked = true;
    audio();
    var max = FIRST_TRAVEL + i * 30, last = null;
    function step(now) {
      if (last === null) last = now;
      var next = Math.min(max, rotation + 700 * Math.min(now - last, 50) / 1000);
      last = now;
      setRotation(next);
      if (next < max) { requestAnimationFrame(step); return; }
      spinBack(function () {
        locked = false;
        dialed(e.key);
      });
    }
    requestAnimationFrame(step);
  });
})();
