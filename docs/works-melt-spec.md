# 「溶ける」登場エフェクト 実装仕様（works）

`works.html` の店内画像が、歪んだ状態からドロッと溶けて固まっていく登場演出。
実体は `works.html` 内にインライン（`<style>` / `<svg>` / `<script>`）で完結している。
`play.html` は幕が開く演出なので、この仕様の対象外。

## 仕組み

- SVGフィルター `#meltFilter`（`feTurbulence` + `feDisplacementMap`）を、
  `.works-frame.melting .works-img` の CSS `filter` で適用する。
  枠ではなく画像にかけること（枠にかけると Mac の Safari で枠の外に跡が残った）。
- 歪み量・ノイズ・透明度は、`requestAnimationFrame` の1本の時計で JS が毎フレーム設定する。
  SMIL と CSS アニメーションは使わない（別々の時計だと、重いスマホでズレたり、
  見えないうちに終わったりするため）。

## 流れ

```
HTMLの初期状態: .works-frame.melt-wait（opacity 0.15）
  └─ img.decode() 完了
       └─ startMelt(): melt-wait を外し melting を付ける
            └─ 2フレーム待ってから時計を開始（描画が始まってから動かす）
                 └─ 1.4秒で歪み0へ → melting を外して通常描画へ
```

## 値

| 項目 | 値 |
|---|---|
| 全体の長さ | `DUR = 1400`ms |
| イージング | `1 - (1 - p)^4`（終盤で急速に収束） |
| 歪み `scale` | `190 → 0` |
| ノイズ `baseFrequency` の縦 | `0.03 → 0.006`（横は `0.009` 固定） |
| 透明度 | `0.15 →(35%)→ 1` |

## 再生が飛ばないための処理

- `img.decode()` を待ち、フレームを2回待ってから開始する。
- 1フレームで進める時間は最大100ms。長く止まっても演出が飛ばず、
  1フレームが重い環境でも最大14フレームで必ず終わる（止まった分を捨てる方式にしないこと）。
- `pageshow` の `persisted` で、ブラウザの「戻る」での復元時も再生する。
- 裏タブでは `requestAnimationFrame` が止まるので、表示されてから再生される。
- Safari 向けに、毎フレーム `filter` の値を変えて描き直しを促し、終了時も画像を描き直す。
- `prefers-reduced-motion: reduce` では演出せず、すぐ表示する。

## 調整する場所

| やりたいこと | 変更箇所 |
|---|---|
| 溶けの強さ | `applyMelt()` の `190`（`#meltMap` の初期値も合わせる） |
| 速さ | `DUR` |
| 波の細かさ | `applyMelt()` の `baseFrequency` の値 |
| ノイズの形 | `#meltTurb` の `seed` |
| 序盤の透け具合 | `applyMelt()` の `0.15` と `0.35` |

## 注意

- SVGフィルターは負荷が高いので、演出中だけ適用して終わったら外す。
- 歪みが枠で切れるときは `#meltFilter` の `x / y / width / height` を広げる。
