Slack 部屋から勤怠情報を引っ張ってきて、勤務表に自動入力するアプリ。

勤務状況列に生えるボタンを押すと、その日の出退勤時刻と工数を入力する。

# 準備
- Tampermonkey に `user-script.js` を設置
- `src/solve.ts` の `*Words` 配列の中身をいい感じに決める(一つでも部分一致するものがあれば選ばれる)

## バックエンド
以下のいずれかを実施。

### ローカルでホスト
1. 
    ```bash
    $ cp .env.example .env
    ```

    `.env` ファイルの値を埋める。

1.
    ```bash
    $ npm start
    ```

### API Gateway + AWS Lambda でホスト
1.
    ```bash
    $ npm run bundle
    ```
    で `dist/lambda.js` にバンドル結果が吐かれるので Lambda に設置
1. 環境変数に `.env.example` の内容をセット
1. 環境変数の `TZ` に `Asia/Tokyo` をセット
1. API Gateway で `/{year}/{month}/{day}` パスの GET リソースを作って、 CORS を許可する
1. `user-script.js` の fetch している URI を書き換える
