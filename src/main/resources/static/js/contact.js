// ==========================================
// contact.js: 問い合わせフォーム専用
// ==========================================

/**
 * 問い合わせフォームの送信挙動を制御する
 * 実際には送信せず、送信したかのような「疑似体験」をユーザーに提供する
 */

const contactForm = document.getElementById('contact-form');

// 1. 安全装置：フォームが存在する問い合わせページでのみ実行
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        // ページのリロードを防ぐ（SPAのような滑らかな挙動のため）
        e.preventDefault();

        const btn = document.getElementById('submit-btn');
        const toast = document.getElementById('toast');

        // 2. 二重送信防止ロジック
        // 【堅牢性の確保：ダブルサブミット対策】
        // サーバーへの多重リクエストを防ぎ、DBへの重複登録や
        // システム負荷を軽減するための標準的なフロントエンド防衛策です。
        btn.disabled = true;
        btn.innerText = '送信中...';
        btn.style.opacity = '0.7';

        // 3. 疑似的な通信待ち時間（1.5秒）を作る
        // 実際には即座に終わる処理でも、あえて「溜め」を作ることで
        // ユーザーに「ちゃんと処理されている感」を与える演出
        setTimeout(() => {
            // A. トースト通知の表示（CSSの .show クラスを活用）
            toast.className = "toast-message show";
            // 【ステート管理】
            // CSSクラス（.show）の着脱のみで通知のフェードイン・アウトを制御。
            // JSでスタイルを直接いじらず、見た目の変化はCSSに任せる「関心の分離」を意識しています。

            // B. フォームのリセット
            // 入力された文字をきれいに消す
            contactForm.reset();

            // 4. さらに3秒後、通知を消してボタンを元に戻す
            setTimeout(() => {
                toast.className = toast.className.replace("show", "");

                // ボタンを再び押せる状態に復旧
                btn.disabled = false;
                btn.innerText = '送信する';
                btn.style.opacity = '1';
            }, 3000);
        }, 1500);


        // 【UXデザインの工夫：知覚的パフォーマンス】
        // 処理が速すぎると、ユーザーは「本当に送信された？」と不安になることがあります。
        // あえて1.5秒の遅延を作ることで、サーバー通信が正常に行われたような
        // 信頼感のあるフィードバック（確信感）を与えています。
    });
}