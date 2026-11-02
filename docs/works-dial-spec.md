# Works の回転ダイヤルと暗号化 実装仕様

Works (2022~) の電話のダイヤルを回して番号を入力し、正しければ中身を表示する。
電話をタップするとシーンが2.4倍に拡大し、ダイヤルを回せるようになる。
拡大中に外をタップすると元に戻る（Esc キーでも戻る）。
今の中身は空で、正解しても CLOSED の札はそのまま。受話器の音だけが鳴る。

- 画面と操作: `works-dial.js`、`works.html` の `.dial-*`
- 画像: `dial-bed.webp`（古いダイヤルを隠す土台と中央の紙）、`dial-wheel.webp`（回る盤。元写真に合わせて半透明のアクリル風、厚みは CSS の影）、`dial-needle.webp`（指止め）
- `works-closed.webp` にも同じ盤と指止めを合成してある（溶ける演出の間も同じ見た目にするため）
- 暗号文: `assets/works.enc.json`（AES-256-GCM、鍵は PBKDF2-SHA256 60万回）

番号はリポジトリに置かない。ページは入力された番号で復号を試し、成功したときだけ中身を表示する。

## 中身や番号を変えるとき

1. `private/works-content.html`（git の対象外）を編集する。
2. 暗号文を作り直す: `WORKS_PASS=番号 python3 tools/encrypt-works.py`（`cryptography` が必要）
3. `works-dial.js` の `works.enc.json?v=` を上げる。

`private/` はこのパソコンにしかない。消えた場合は中身を作り直す。

## 調整する場所

| やりたいこと | 変更箇所 |
|---|---|
| 穴の位置の判定 | `works-dial.js` の `HOLES` |
| 指止めまでの角度 | `FIRST_TRAVEL` |
| 戻る速さ | `RETURN_SPEED` |
| 入力した桁の点 | `.dial-dots`（桁数の半分ずつ2行に並ぶ） |
| 話し中の音 | `busyTone()` |
| 拡大の大きさ | `works.html` の `.phone-zoom .works-scene` の `scale(2.4)` |
| 電話のタップ範囲 | `works.html` の `.phone-tap` |

## 守りの強さ

8桁の数字は組み合わせが1億通りしかなく、暗号文は公開されているので、
時間をかけた総当たりには耐えられない。守秘義務のある内容はここに置かない。
