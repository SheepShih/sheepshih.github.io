# works.html「溶ける」登場エフェクト 実装仕様

`works.html`（Works 2022〜 の「準備中（CLOSED）」ページ）で、店内画像が
**歪んだ状態からドロッと溶けて固まっていく**登場演出の実装仕様。

- 対象要素: `.works-frame`（トップのドア画像と同サイズ・同位置の枠）
- 仕組み: **SVGフィルター（turbulence + displacement）** を CSS で適用し、
  フィルターのパラメータを **SMILアニメーション**で時間変化させる
- トリガー: 画像ロード完了時に一度だけ再生
- 実体は `works.html` 内にインライン（`<style>` / `<svg>` / `<script>`）で完結

---

## 1. 全体の流れ

```
ページ表示
  └─ works-img の読み込み完了
       └─ startMelt()
            ├─ .works-frame に .melting を付与
            │    → CSS: filter: url(#meltFilter) + melt-fade アニメ(opacity)
            ├─ SVGの beginElement() を2本同時に開始
            │    → baseFrequency と scale を時間変化（歪み量が0に収束）
            └─ animationend（CSSアニメ終了）で .melting を除去
                 → フィルターが外れ、くっきりした最終状態で静止
```

歪みは **SVGの `feDisplacementMap` の `scale`** が支配する。`scale` が大きいほど
大きく歪み、`0` で無歪み（元画像）。これを `190 → 0` に落とすことで「溶けて固まる」。
同時に `feTurbulence` の縦方向 `baseFrequency` を高→低に変化させ、
「細かく波打つ → なめらかに落ち着く」質感を出す。

---

## 2. HTML 構造

```html
<!-- 「溶ける」用のSVGフィルター(タービュランス+ディスプレイスメント) -->
<svg class="melt-defs" width="0" height="0" aria-hidden="true" focusable="false">
  <defs>
    <filter id="meltFilter" x="-15%" y="-15%" width="130%" height="150%"
            color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.009 0.006"
                    numOctaves="2" seed="6" result="turb">
        <animate id="meltFreq" attributeName="baseFrequency" dur="1.4s"
                 keyTimes="0;1" values="0.009 0.03; 0.009 0.006"
                 fill="freeze" begin="indefinite"
                 calcMode="spline" keySplines="0.16 1 0.3 1"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="turb" scale="0"
                         xChannelSelector="R" yChannelSelector="G">
        <animate id="meltScale" attributeName="scale" dur="1.4s"
                 keyTimes="0;1" values="190;0"
                 fill="freeze" begin="indefinite"
                 calcMode="spline" keySplines="0.16 1 0.3 1"/>
      </feDisplacementMap>
    </filter>
  </defs>
</svg>

<div class="works-frame" id="worksFrame" role="link" tabindex="0" aria-label="トップへ戻る">
  <img class="works-img" src="assets/img/works-closed.webp?v=3"
       alt="Shih Ting Fang Diner — Works (2022~) は準備中です">
</div>
```

### フィルターの各パラメータ

| 要素 / 属性 | 値 | 意味 |
|---|---|---|
| `filter` `x/y/width/height` | `-15% / -15% / 130% / 150%` | 歪みが枠外にはみ出しても切れないようフィルター領域を拡張 |
| `filter` `color-interpolation-filters` | `sRGB` | 色ずれを防ぐ（linearRGB だと色がくすむ） |
| `feTurbulence type` | `fractalNoise` | 雲状のなめらかなノイズ（`turbulence` より柔らかい） |
| `feTurbulence baseFrequency` | 初期 `0.009 0.006` | ノイズの細かさ（X, Y）。小さいほど大きな波 |
| `feTurbulence numOctaves` | `2` | ノイズの重ね合わせ回数（質感の複雑さ） |
| `feTurbulence seed` | `6` | ノイズパターンの固定シード（毎回同じ形にする） |
| `feDisplacementMap in` | `SourceGraphic` | 歪ませる対象＝元の画像 |
| `feDisplacementMap in2` | `turb`（turbulenceの出力） | 歪みの元になるノイズ |
| `feDisplacementMap scale` | 初期 `0`（アニメで `190→0`） | 歪みの強さ（px相当） |
| `xChannelSelector / yChannelSelector` | `R / G` | ノイズのR成分で横、G成分で縦にずらす |

> `<svg class="melt-defs">` は `width/height=0` かつ `aria-hidden` で、
> 画面には表示されない「フィルター定義の入れ物」。

---

## 3. CSS

```css
/* topページのドア画像と同じサイズ・位置の枠(中に「準備中」の店内) */
.works-frame {
  position: relative;
  width: min(100vw, 430px);
  aspect-ratio: 768 / 1376;
  max-height: 100dvh;
  overflow: hidden;
  cursor: pointer; /* シーン全体をタップでトップへ戻れる(ボタンは非表示) */
}

.works-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 切替時の「溶ける」登場エフェクト: 歪ませたシーンがドロッと固まっていく */
.works-frame.melting {
  filter: url(#meltFilter);
  animation: melt-fade 1.4s ease both;
}
@keyframes melt-fade {
  0%   { opacity: 0.15; }
  35%  { opacity: 1; }
  100% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .works-frame.melting { filter: none; animation: none; }
}
```

### ポイント
- `.melting` が付いている間だけ `filter: url(#meltFilter)` が有効。
  演出終了後に JS で外すことで、平常時はフィルター計算のコストをかけない。
- `melt-fade`（opacity 0.15→1）は、歪みが激しい序盤を薄く見せて
  「にじみ出てくる」印象を足すための **CSS側の補助アニメ**。
  歪みそのものは SVG 側が担当（役割分担）。
- CSSアニメと SVGアニメは **どちらも `1.4s`** で尺を揃えている。

---

## 4. JavaScript（トリガーと後始末）

```js
(function () {
  var frame = document.getElementById("worksFrame");

  // 登場時に「溶ける」エフェクトを再生。画像が用意できてから、CSSアニメと
  // SVGアニメ(ディスプレイスメント)を同時に開始する。終わったらフィルターを外す。
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var img = frame.querySelector(".works-img");

  function startMelt() {
    frame.classList.add("melting");
    var freq  = document.getElementById("meltFreq");
    var scale = document.getElementById("meltScale");
    if (freq  && freq.beginElement)  { freq.beginElement(); }   // SMIL開始
    if (scale && scale.beginElement) { scale.beginElement(); }
    frame.addEventListener("animationend", function () {
      frame.classList.remove("melting");   // 演出後フィルターを外す
    }, { once: true });
  }

  if (!reduceMotion) {
    if (img.complete && img.naturalWidth > 0) { startMelt(); }   // 既にロード済み
    else { img.addEventListener("load", startMelt, { once: true }); } // まだなら load 待ち
  }

  // (以降はページ全体をタップ/Enterでトップへ戻す処理。溶け演出とは独立)
})();
```

### 設計上の要点
- **画像ロードを待ってから再生**：デコード前に歪ませても効果が乗らないため、
  `img.complete && naturalWidth > 0`（キャッシュ済み）か `load` イベントで発火。
- **`begin="indefinite"` + `beginElement()`**：SVGの `<animate>` を自動再生させず、
  JS から明示的に開始。CSSクラス付与と同時にスタートさせて尺を一致させる。
- **`fill="freeze"`**：アニメ終了後も最終値（`scale=0`）を保持 → 歪みゼロで静止。
- **`animationend` で `.melting` 除去**：フィルターを外して通常描画に戻す
  （常時フィルターが乗り続けるのを防ぎ、テキスト等をくっきり保つ）。

---

## 5. タイミング設計

| パラメータ | 値 | 備考 |
|---|---|---|
| 全体尺 | `1.4s` | CSS `melt-fade` と SVG `<animate>` 2本すべて共通 |
| イージング（SVG） | `keySplines="0.16 1 0.3 1"` | 終盤で急速に収束する ease-out 系 |
| イージング（CSS opacity） | `ease` | 補助的なフェード |
| 歪み `scale` | `190 → 0` | 開始時の最大歪み量 → 無歪み |
| ノイズ縦 `baseFrequency` Y | `0.03 → 0.006` | 細かい波 → ゆったりした波 |
| opacity | `0.15 →(35%)→ 1` | 序盤だけ薄く、以降は不透明 |

---

## 6. アクセシビリティ / フォールバック

- `prefers-reduced-motion: reduce` の環境では、CSSで `filter`/`animation` を
  無効化し、JS も `startMelt()` を呼ばない（歪みなしで即表示）。
- フィルター定義の SVG は `aria-hidden="true"` / `focusable="false"` で
  支援技術から隠す。
- `.works-frame` は `role="link"` / `tabindex="0"` / `aria-label="トップへ戻る"` を持ち、
  クリックまたは Enter/Space でトップ（`index.html`）へ戻る（演出とは独立した機能）。

---

## 7. 調整ガイド（どこをいじると何が変わるか）

| やりたいこと | 変更箇所 |
|---|---|
| 溶けを強く／弱く | `#meltScale` の `values="190;0"` の開始値（大きいほど激しい歪み） |
| 溶けを速く／遅く | 4箇所の `dur="1.4s"`（CSS `melt-fade` と SVG2本）を同じ値で変更 |
| 波を細かく／粗く | `feTurbulence` の `baseFrequency` と `#meltFreq` の `values` |
| ノイズ形状を変える | `feTurbulence` の `seed`（別の固定パターンになる） |
| 収束カーブを変える | 両 `<animate>` の `keySplines` |
| 序盤の透け具合 | `@keyframes melt-fade` の `opacity` キーフレーム |
| 歪みが枠で切れる | `#meltFilter` の `x/y/width/height`（領域を広げる） |

---

## 8. 既知の注意点

- **iOS Safari / 一部ブラウザ**では SVGフィルターのアニメーション再生が
  重い・カクつくことがある。尺を延ばすか `numOctaves` を下げると軽くなる。
- フィルターは GPU/CPU 負荷があるため、**演出中だけ**適用し、
  終了後に必ず外す設計（`.melting` 除去）にしている。
- `seed` を固定しているので毎回同じ溶け方になる。ランダムにしたい場合は
  `startMelt()` 内で `feTurbulence` の `seed` を書き換えてから `beginElement()` する。

---

_対象ファイル: `portfolio-site/works.html`（`<style>` / インラインSVG / `<script>` に実装）_
