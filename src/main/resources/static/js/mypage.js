// =================================================
// mypage.js: マイページ専用
// =================================================


/**
 * Javaの集計APIから統計を取得して、各進捗バーとバッジを更新する
 */
async function updateMyPageStats() {
    try {
        // 集計済みデータの取得
        // Java側で計算された { total: 85, Onew: 60, ... } のようなオブジェクトが返ってくる
        const response = await fetch('/api/stats');
        if (!response.ok) return;

        const stats = await response.json();
        console.log("統計データ反映中:", stats);

        // --- A. 全体進捗バー（水平バー） ---
        const mainBar = document.querySelector('#totalBar');
        const mainText = document.querySelector('.bar-label');
        if (mainBar) mainBar.style.width = `${stats.total}%`;
        if (mainText) mainText.textContent = `${stats.total}%`;

        // --- B. メンバー別・円形バー（CSS変数の活用） --- 
        // メンバー名と、HTML上のクラス名を紐付ける「マップ」を作成
        const memberMap = {
            'Onew': '.circle-onew',
            'Jonghyun': '.circle-jonghyun',
            'Key': '.circle-key',
            'Minho': '.circle-minho',
            'Taemin': '.circle-taemin'

            // 【技術的工夫：CSS変数による宣言的アニメーション】
            // JSで計算ロジックを回すのではなく、CSS変数 '--percent' を書き換えることで
            // CSS側の transition や conic-gradient(扇形グラデーション) に描画を任せています。
            // これにより、JSの負荷を下げつつ、滑らかなアニメーションを実現しています。
        };

        // ループで一気に円形グラフの角度（パーセント）を更新
        Object.keys(memberMap).forEach(name => {
            const circle = document.querySelector(memberMap[name]);
            // stats[name] が 0 の場合もあるため、undefined かどうかで厳密に判定
            if (circle && stats[name] !== undefined) {
                // CSS変数 --percent を書き換える
                // これにより、CSS側の conic-gradient 等が反応し、アニメーションしながら動く
                circle.style.setProperty('--percent', `${stats[name]}%`);
            }
        });

        // --- C. 国別バー（Japan / Korea） ---
        // stats.jp や stats.kr の値を使って、それぞれのバーの長さを調整
        const jpBar = document.querySelector('.bar-jp');
        const jpText = document.querySelector('.percent-jp');
        if (jpBar && stats.jp !== undefined) {
            jpBar.style.width = `${stats.jp}%`;
            if (jpText) jpText.textContent = `${stats.jp}%`;
        }

        const krBar = document.querySelector('.bar-kr');
        const krText = document.querySelector('.percent-kr');
        if (krBar && stats.kr !== undefined) {
            krBar.style.width = `${stats.kr}%`;
            if (krText) krText.textContent = `${stats.kr}%`;
        }

        // --- D. バッジ解放ロジック ---
        // stats（Javaから取得した集計データ）を元に、条件達成を判定する
        const total = stats.total;
        const jonghyunPercent = stats.Jonghyun;

        // 1. Helloバッジ (収集率5%以上)
        // 初心者向けの最初のステップ。要素があるか確認してから置換する
        if (total >= 5) {
            document.getElementById('badge-hello')?.classList.replace('lock', 'unlocked');
        }

        // 2. Oddバッジ (収集率50%以上)
        // 中級者の証。アルバムタイトルにちなんだバッジ名にする
        if (total >= 50) {
            document.getElementById('badge-odd')?.classList.replace('lock', 'unlocked');
        }

        // 3. Jonghyun's Poetバッジ (特定のメンバーを100%で解放)
        // コンプリートを目指すユーザーへの特別な称号
        if (jonghyunPercent >= 100) {
            document.getElementById('badge-jonghyun-poet')?.classList.replace('lock', 'unlocked');
        }

        // 【ゲーミフィケーション要素：バッジ機能】
        // ユーザーの収集意欲を高めるため、Java側から返される統計値をトリガーに
        // バッジの 'lock' クラスを 'unlocked' に置換し、CSSで「光る」演出を加えています。
        // 今後、アルバム枚数に応じた「SHINee World」バッジなどの追加も容易な設計です。

    } catch (error) {
        console.error("統計データの取得またはバッジ更新に失敗しました:", error);
    }

}

/**
 * WishlistデータをDBから取得して画面に表示する
 */
async function updateWishlistDisplay() {
    const container = document.getElementById('wishlist-container');
    // 1. 安全装置：要素がないページ（index.htmlなど）では処理をスキップ
    if (!container) return;

    try {
        // 2. Javaのウィッシュリスト専用エンドポイントからデータを取得
        const response = await fetch('/api/editions/wishlist');
        if (!response.ok) throw new Error('Wishlistの取得に失敗');

        const wishlistData = await response.json();

        // 3. データが空の場合の「おもてなし」表示
        // gridレイアウトを維持しつつ、中央にメッセージを出す
        if (wishlistData.length === 0) {
            container.innerHTML = '<p class="empty-msg" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #aaa;">まだリストは空です 💎</p>';
            return;
        }

        container.innerHTML = ''; // ローディング表示などをクリア

        // 4. リストの動的生成
        wishlistData.forEach(item => {
            // Java/Lombokの命名規則（isWishlist ↔ wishlist）の揺れを考慮した安全な取得
            // DBのカラム名(wishlist)とJavaのLombokが生成する命名(isWishlist)の両方に対応。
            // APIの仕様変更があっても表示が崩れないよう、二段構えで値を取得しています。
            const isWishStatus = item.wishlist !== undefined ? item.wishlist : item.isWishlist;
            // stats[name] が 0（未収集）の場合、JSの!判定(falsy判定)ではスルーされてしまうため、
            // undefined かどうかを明示的にチェックすることで、収集率0%の状態も正しく描画しています。
            const title = item.title || 'Unknown Title';
            const editionName = item.displayName || item.editionName || '通常盤';

            const div = document.createElement('div');
            div.className = 'wish-item';

            // カード形式のHTMLを流し込む
            div.innerHTML = `
                <div class="wish-item-content">
                    <span class="artist-name">${item.artist}</span>
                    <span class="edition-name-mp">${title}</span>
                    <span class="edition-tag">${editionName}</span>
                </div>
            `;
            container.appendChild(div);
        });

    } catch (error) {
        // 5. 通信失敗時のユーザーへのフィードバック
        console.error("Wishlist反映エラー:", error);
        container.innerHTML = '<p class="error-msg">データの読み込みに失敗しました</p>';
    }
}

/**
 * 画面（HTML）が読み込み終わった瞬間に動く処理
 */
document.addEventListener('DOMContentLoaded', () => {

    // 1. 統計データの反映を開始
    // JavaのAPIから数字を取ってきて、円形バーや進捗バーを動かす
    updateMyPageStats();

    // 2. 欲しいものリストの表示を開始
    // ウィッシュリストに登録されたアイテムを画面に並べる
    updateWishlistDisplay();
});