// ==========================================
// random.js: ランダム管理ページ専用
// ==========================================


/**
 * 初期化処理
 * ページが開かれた瞬間に、DBから「どのアルバムの特典か」を選べるようにリストを作る
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. ページ読み込み時にアルバム一覧をプルダウンにセット
    initAlbumList();

    // 2. アルバムが選択された時のイベント
    const discSelect = document.getElementById('disc-select');
    discSelect.addEventListener('change', (e) => {
        const discId = e.target.value;
        if (discId) {
            // 選択されたアルバムに紐付く「形態（Edition）」を読み込む
            loadEditions(discId);
        } else {
            resetEditionSelect();
        }
    });
});

/**
 * アルバム一覧をAPIから取得してセレクトボックスを埋める
 */
async function initAlbumList() {
    try {
        // MasterDataController (Java) から全アルバム情報を取得
        const response = await fetch('/api/master/discs');
        if (!response.ok) throw new Error('アルバム情報の取得に失敗');

        const discs = await response.json();
        const select = document.getElementById('disc-select');

        discs.forEach(disc => {
            const option = document.createElement('option');
            option.value = disc.discId; // D001 など
            option.textContent = disc.title; // Album名
            select.appendChild(option);
        });

        // 【理想】 
        // 今は全件取得しているが、将来的に数が増えたら
        // 検索機能付きのプルダウンにするか、ページネーションが必要
    } catch (error) {
        console.error('Fetch error (discs):', error);
    }
}

/**
 * アルバムIDに紐づく形態（Edition）一覧を取得してセレクトボックスを埋める
 * @param {string} discId - アルバムのID (例: D001)
 */
async function loadEditions(discId) {
    try {
        // Java側の MasterDataController で作った「アルバムIDで絞り込むAPI」を叩く
        const response = await fetch(`/api/master/editions?discId=${discId}`);
        if (!response.ok) throw new Error('Network response was not ok');

        const editions = await response.json();
        const select = document.getElementById('edition-select');

        // 初期化：前の選択肢を消して、選択可能な状態にする
        select.innerHTML = '<option value="">形態を選択してください</option>';
        select.disabled = false;

        editions.forEach(ed => {
            const option = document.createElement('option');
            option.value = ed.editionId; // D001-01 など
            option.textContent = ed.displayName; // 通常盤 など
            select.appendChild(option);
        });

        // 【UX設計：コンテキストに応じたUI制御】
        // アルバム未選択時に形態を選ばせない（disabled）制御を行うことで、
        // ユーザーの誤操作を防ぎ、常に整合性のあるデータ選択を促す設計にしています。

        // 【理想】もし形態が1つしかない場合は、自動でそれを選択状態にして
        // ユーザーのクリック回数を減らす「オートセレクション機能」を入れたい
    } catch (error) {
        console.error('Fetch error (editions):', error);
    }
}

/**
 * 形態セレクトボックスをリセット（未選択状態）にする
 * アルバムの選択が外された時に呼び出される
 */
function resetEditionSelect() {
    const select = document.getElementById('edition-select');
    select.innerHTML = '<option value="">先にアルバムを選んでください</option>';
    select.disabled = true;
}



/**
 * 画面上の操作に必要な主要要素を取得
 * slotCountは追加されるスロットのID管理に使用する
 */
const addSlotBtn = document.getElementById('add-slot-btn');
const slotsContainer = document.getElementById('item-slots-container');
const saveBtn = document.getElementById('save-all-btn');
let slotCount = 0;

/**
 * アイテム登録用のスロット（入力枠）を画面に新しく追加する
 * 各スロットにはメンバー選択、アイテム名入力、画像アップロード機能が含まれる [cite: 2026-01-12]
 */
addSlotBtn.addEventListener('click', () => {
    // 1. スロットの識別番号をカウントアップ
    slotCount++;

    // 2. スロットの土台となる外枠（カード）を生成
    const slotDiv = document.createElement('div');
    slotDiv.className = 'item-slot-card'; // 後でCSSで綺麗にする用

    // 【理想】スマホ対応を強化するため、将来的にスタイルはCSSファイルへ移行し
    // remやvh単位でのレスポンシブ管理を徹底する
    slotDiv.style = "border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;";

    // 3. スロット内部のHTMLを構築
    // メンバー選択、アイテム名、画像ファイル入力、プレビュー領域をセット
    slotDiv.innerHTML = `
        <div class="input-group">
            <label>Member</label>
                <select class="member-select custom-select">
                    <option value="">メンバーを選択してください</option>
                    <option value="Group">集合</option>
                    <option value="Onew">Onew</option>
                    <option value="Jonghyun">Jonghyun</option>
                    <option value="Key">Key</option>
                    <option value="Minho">Minho</option>
                    <option value="Taemin">Taemin</option>
                </select>
        </div>

        <div class="input-group">
            <label>アイテム名</label>
            <input type="text" placeholder="例：トレカA" class="item-type-input custom-select">
        </div>

        <div class="input-group">
            <label>アイテム画像</label>
                    <input type="file" class="slot-image-input" accept="image/*">
                        <div class="preview-area" style="margin-top: 10px;">
                            <img class="preview-img" src="" style="display:none; max-width: 100px; border-radius: 5px;">
                        </div>
        </div>
    `;

    // 4. コンテナの末尾に完成したスロットを追加
    slotsContainer.appendChild(slotDiv);

    // 5. 【重要】追加したスロット内の画像入力要素に対し、プレビュー表示イベントを設定
    const currentInput = slotDiv.querySelector(`.slot-image-input`);
    const currentPreview = slotDiv.querySelector(`.preview-img`);

    if (currentInput && currentPreview) {
        currentInput.addEventListener('change', function (e) {
            // A. 選択されたファイルを取得
            const file = e.target.files[0];

            if (file) {
                // B. 画像を読み込むためのリーダーを生成
                const reader = new FileReader();

                // C. 読み込み完了時の処理：プレビュー画像に反映し表示させる
                reader.onload = function (event) {
                    currentPreview.src = event.target.result;
                    currentPreview.style.display = 'block';
                };

                // D. ファイルをデータURL形式で読み込み開始
                reader.readAsDataURL(file);

                // 【技術的工夫：FileReaderによる即時フィードバック】
                // サーバーへのアップロード（重い処理）を行う前に、ブラウザ側で画像を読み込み
                // プレビュー表示させることで、ユーザーが内容を確認してから送信できる安心感を提供しています。

                // 【理想】1つのスロットで表裏の2枚をアップロード可能にし、
                // マウスホバーで画像が裏返るようなプレビュー演出を加えたい
            }
        });
    }
});


/**
 * データの保存（送信）ロジック
 * ボタン押下時にFormDataを作成し、画像を含む一括アップロードを行う
 */
saveBtn.addEventListener('click', async () => {
    console.log("保存処理を開始します"); // デバッグ用

    const formData = new FormData();

    // 1. アルバムと形態の選択状態を取得
    // 要素が存在するかチェックしながら取得し、空でも送れるように三項演算子で制御
    const discSelect = document.getElementById('disc-select');
    const editionSelect = document.getElementById('edition-select');

    // 値が空でも送れるようにする
    formData.append('discId', discSelect ? discSelect.value : "");
    formData.append('editionId', editionSelect ? editionSelect.value : "");

    // 2. 画面上の全スロットを取得し、件数をチェック
    const slots = document.querySelectorAll('.item-slot-card');
    console.log("スロット数:", slots.length);

    if (slots.length === 0) {
        alert("アイテムを最低1つは追加してね！");
        return;
    }

    // 3. 各スロットからデータを回収してFormDataに追加
    slots.forEach((slot) => {
        // A. メンバー名：クラス名 '.member-select' で取得
        const memberSelect = slot.querySelector('.member-select');
        const memberValue = memberSelect ? memberSelect.value : "Group";
        formData.append("memberNames", memberValue);

        // B. アイテム名：クラス名 '.item-type-input' で取得
        const typeInput = slot.querySelector('.item-type-input');
        const typeValue = typeInput ? typeInput.value : "名称未設定";
        formData.append("names", typeValue);

        // C. 画像：クラス名 '.slot-image-input' で取得
        const imageInput = slot.querySelector('.slot-image-input');
        if (imageInput && imageInput.files[0]) {
            formData.append("images", imageInput.files[0]);
        }
    });

    // 4. サーバーへ送信
    try {
        console.log("サーバーへ送信中...");
        const response = await fetch('/api/random/upload', {
            method: 'POST',
            body: formData
        });

        console.log("サーバー応答ステータス:", response.status);

        if (response.ok) {
            alert("データの送信に成功したよ！");
            // 保存が終わった直後に、最新のリストを再読み込みして画面を書き換える
            loadCollection();
        } else {
            alert("送信に失敗しました（エラーコード: " + response.status + "）");
        }

        // 【理想】現在は送信完了までユーザーが待つ必要があるが、
        // ローディングアニメーションを表示させ、完了後にふわっとリストが更新される演出を入れたい
    } catch (error) {
        // ここでエラーが出る場合は通信環境かURLの問題
        console.error("通信エラー:", error);
        alert("通信に失敗しました。詳細はコンソールを確認してね");
    }


    // 【通信設計：Multipart/FormDataによる一括アップロード】
    // 複数の画像ファイルとメタデータ（メンバー名、アイテム名）を1つのリクエストにまとめ、
    // Java側の List<MultipartFile> で受け取れる形式で効率的に送信しています。
});


/**
 * データの表示ロジック
 * DBから届いた本物のデータの数だけ、新しくカードを作る
 */
async function loadCollection() {
    // 1. セレクトボックスの値を取得
    const editionSelect = document.getElementById('edition-select');
    const editionId = editionSelect ? editionSelect.value : "";

    try {
        // 2. IDが空なら /api/random/items 、あればクエリ付きのURLを生成
        const url = editionId ? `/api/random/items?editionId=${editionId}` : `/api/random/items`;
        const response = await fetch(url);
        const items = await response.json();

        const container = document.getElementById('collection-grid');
        container.innerHTML = '';

        // 3. データが0件の場合のメッセージ表示
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                    <p>まだこのエディションのアイテムはありません。</p>
                    <p>上のフォームから登録してみてね！💎</p>
                </div>
            `;
            return;
        }

        // 4. DBから届いた本物のデータの数だけ、新しくカードを作る
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'collection-item';
            card.innerHTML = `
            <div class="item-img-wrapper">
                <img src="${item.imageUrl}" alt="${item.itemType}">
            </div>
            <p class="member-tag">${item.memberName}</p>
            <p class="item-name">${item.itemType}</p>
        `;
            container.appendChild(card);
        });


        // 【理想】アイテムが増えた際に、メンバー別や種類別で
        // リアルタイムに並び替え（ソート）ができるボタンを設置したい
    } catch (error) {
        console.error("コレクションの取得に失敗しました:", error);
    }
}

// ページ読み込み時に実行
loadCollection();