// ==UserScript==
// @name         kintai-automator
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  .
// @author       https://github.com/Gobi03
// @match        https://opthd.lightning.force.com/lightning/n/teamspirit__AtkWorkTimeTab
// @match        https://opthd--teamspirit.visualforce.com/apex/AtkWorkTimeView*
// @run-at       document-end
// @grant        none
// ==/UserScript==

;(function () {
    'use strict'

    const origin = 'http://localhost:3000'

    async function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
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
        dayRow.getElementsByClassName('dval vjob')[0].click() // ウィンドウを開く

        const arrow = document.getElementsByClassName(
            'dijitSliderIncrementIconH'
        )[0]
        arrow.dispatchEvent(new MouseEvent('mousedown'))
        arrow.dispatchEvent(new MouseEvent('mouseup'))

        document.getElementById('empWorkOk').click() // 登録ボタンのクリック
    }

    // num 個休憩時間入力用のテクストボックスを追加する
    async function addKyuukeyTextBox(num) {
        const buttons = document.getElementsByClassName('pb_btn_plusL')
        for (let i = 0; i < num; i++) {
            for (const e of buttons) {
                if (e.title === '休憩時間入力行追加') e.click()
            }
        }
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
            const res = await fetch(`${origin}/${year}/${month}/${day}`)
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
            button.style.backgroundImage =
                'url("https://cdn.glitch.com/b7bdb756-5cf5-4040-a1f8-32c1ecaba205%2Ffurueru_sisisin.gif?1530642080549")'
            button.style.backgroundSize = 'contain'
            button.style.border = 'none'
            button.style.width = '20px'
            button.style.height = '20px'
            button.onclick = () => run(year, month, day)
            // button.classList.add('png-add')

            const row = table[day]
            const dayKind = row.getElementsByClassName('dval vstatus')[0].title
            // 工数記入済みなら true
            const written = Boolean(
                row.cells[8].getElementsByClassName('work-job-time').length
            )

            if (dayKind.includes('通常出勤日') && !written) {
                const targetCell = row.cells[2]
                targetCell.removeChild(targetCell.firstChild)
                targetCell.appendChild(button)
            }
        }
    }

    setInterval(setButton, 1000)
})()
