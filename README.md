# 進路傾向診断

Webベースの進路診断システムです。
質問への回答から興味・性格・得意不得意をスコア化し、相性のよい学部学科系統と大学候補を提案します。

## 公開URL

https://norifumiogawa.github.io/shinro/

## 特徴

- DB不要
- 静的HTML/CSS/JavaScriptのみで動作
- 質問、学部学科、大学候補はJSONで管理
- ローカルでもLightsailでも配信しやすい
- 個人情報を保存しない

## ローカル起動

```bash
python3 -m http.server 8080
```

ブラウザで以下を開きます。

```txt
http://127.0.0.1:8080/
```

## データ編集

- `data/questions.json`: 診断質問
- `data/departments.json`: 学部学科系統
- `data/universities.json`: 大学候補。実在大学データを収録し、偏差値は未設定の場合 `null` にします。

偏差値は予備校・進学情報サイト等の利用条件に依存しやすいため、初期データには入れていません。
利用許諾済みの偏差値データがある場合は、各レコードの `deviationValue` に数値を入れると画面の偏差値フィルターが有効になります。

## Lightsail配備

Dockerを使う場合:

```bash
docker build -t shinrosoudan .
docker run -p 8080:80 shinrosoudan
```

Nginxに直接配置する場合は、このフォルダの中身をドキュメントルートに配置してください。
