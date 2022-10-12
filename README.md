Slack 部屋から勤怠情報を引っ張ってきて、勤務表に自動入力するアプリ。

勤務状況列に生えるボタンを押すと、その日の出退勤時刻と工数を入力する。

# 準備
- Tampermonkey に `user-script.js` を設置
- `src/solve.ts` の `*Words` 配列の中身をいい感じに決める(一つでも部分一致するものがあれば選ばれる)

## バックエンド
以下のいずれかを実施。

### ローカルでホスト
1. `.env` ファイルの用意

    ```bash
    $ cp .env.example .env
    ```

    `.env` ファイルの値を埋める。

1. サーバーの起動
    ```bash
    $ npm start
    ```

1. リクエスト送信

    リクエストパスかボディで、日付を指定する必要がある。

    e.g. `$ curl localhost:3000/2022/10/11`

### API Gateway + AWS Lambda でホスト
#### AWS Gateway 上での準備
1. `/{year}/{month}/{day}` パスの GET リソースを作って、 CORS を許可する

#### AWS Lambda 上での準備
1. 環境変数に `.env.example` の内容をセット
1. 環境変数の `TZ` に `Asia/Tokyo` をセット

#### その他
- `user-script.js` の fetch している URI を書き換える
- `$ npm run deploy` でLambdaにコードをデプロイ
    + 現状だと、デプロイ結果の861行目の、

        ```
        for(var i = 0; i < opts.retries; i++)timeouts.push(this.createTimeout(i, opts));
        ```

        の記述を手動削除しないと動かない。parcel のバグかも？
