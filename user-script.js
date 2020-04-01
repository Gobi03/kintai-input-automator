// ==UserScript==
// @name         kintai-automator
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  .
// @author       https://github.com/Gobi03
// @match        https://opthd--teamspirit.visualforce.com/apex/AtkWorkTimeView?sfdc.tabName=01r100000001yyc
// @grant        none
// ==/UserScript==

;(function() {
    'use strict'

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    // load 完了後に callback 関数を実行する
    async function loadedHook(callback) {
        await sleep(100)

        // ロード中なら true
        const isLoaded =
            document.getElementById('BusyWait').style.display === 'none'

        if (isLoaded) return callback()
        else return await loadedHook(callback)
    }

    // 工数を第一項目で埋める形で入力
    async function inputKousu(dayRow) {
        const kousuuButton = dayRow.getElementsByClassName('dval vjob')[0]

        // 工数入力バーの動かし方が分からないので、時間入力後ウィンドウを開き直して時計ボタンを押すと、時間をその日の稼働時間に変更してくれる仕様を利用する。
        kousuuButton.click() // ウィンドウを開く
        document.getElementById('empWorkLock0').click()
        document.getElementById('empInputTime0').value = '1:00'
        document.getElementById('empWorkOk').click() // 登録ボタンのクリック
        await loadedHook(() => {
            kousuuButton.click() // ウィンドウを開く
            document.getElementById('empWorkLock0').click()
            document.getElementById('empWorkOk').click() // 登録ボタンのクリック
        })
    }

    // num 個休憩時間入力用のテクストボックスを追加する
    async function addKyuukeyTextBox(num) {
        const buttons = document.getElementsByClassName('pb_btn_plusL')
        for (let i = 0; i < num; i++)
            for (const e of buttons)
                if (e.title === '休憩時間入力行追加') e.click()
    }

    // 出退勤休憩時刻の入力
    async function inputSlackKintaiInfo(dayRow, kintaiData) {
        dayRow.getElementsByClassName('dval vst')[0].click() // ウィンドウを開く

        // 出退勤時刻の入力（すでに入力されている場合スキップ）
        const statTimeBox = document.getElementById('startTime')
        if (!statTimeBox.value) statTimeBox.value = kintaiData.shukkinTime
        const endTimeBox = document.getElementById('endTime')
        if (!endTimeBox.value) endTimeBox.value = kintaiData.taikinTime

        // 休憩時刻の入力（強制的に上書く）
        // clean
        const restTextBoxes = document.getElementsByClassName('input-rest-time')
        for (const e of restTextBoxes) {
            e.firstElementChild.value = ''
        }
        // 休憩時間テキストボックスの不足分を追加
        await addKyuukeyTextBox(
            Math.max(
                0,
                kintaiData.kyuukeiTimes.length / 2 - restTextBoxes.length / 2
            )
        )
        // 入力
        for (let i = 0; i < kintaiData.kyuukeiTimes.length; i++) {
            restTextBoxes[i].firstElementChild.value =
                kintaiData.kyuukeiTimes[i]
        }

        // 登録ボタンのクリック
        document.getElementById('dlgInpTimeOk').click()
    }

    const run = async (year, month, day) => {
        try {
            // cretech_kintai 部屋情報の取得
            // { shukkinTime: string; taikinTime: string; kyuukeiTimes: Array<string> } 型のJSONが返る
            const res = await fetch(
                `http://localhost:3000/${year}/${month}/${day}`
            )
            const kintaiData = await (res.ok ? res.json() : Promise.reject(res))
            console.log(kintaiData)

            const table = document.getElementById('mainTableBody').children
            const dayRow = table[day]

            await inputSlackKintaiInfo(dayRow, kintaiData)
            await loadedHook(() => inputKousu(dayRow))
        } catch (error) {
            console.error(error)
        }
    }

    const setButton = () => {
        const table = document.getElementById('mainTableBody').children
        const year = Number(
            document.getElementById('yearMonthList').value.slice(0, 4)
        )
        const month = Number(
            table[1].firstChild.firstChild.firstChild.textContent.split('/')[0]
        )

        for (let day = 1; day < table.length - 1; day++) {
            let button = document.createElement('button')
            button.onclick = () => run(year, month, day)
            button.classList.add('png-add')

            const row = table[day]
            const dayKind = row.getElementsByClassName('dval vstatus')[0].title
            // 工数記入済みなら true
            const written = Boolean(
                row.cells[7].getElementsByClassName('work-job-time').length
            )

            if (dayKind.includes('通常出勤日') && !written) {
                const targetCell = row.cells[2]
                targetCell.removeChild(targetCell.firstChild)
                targetCell.appendChild(button)
            }
        }
    }

    setInterval(setButton, 500)
})()
