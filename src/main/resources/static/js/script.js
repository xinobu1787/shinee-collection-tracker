// =================================================
// script.js: トラッカー・マイページ・問い合わせ共通
// =================================================

// 全ページで共有するディスク情報を保持する変数
let allDiscs = [];


/**
 * ページ読み込み完了時の初期化処理
 * ページごとに必要なデータ取得や関数呼び出しを振り分ける
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log("ページ読み込み完了💎");

    // A. 判定用の要素を取得
    // ページ内に特定のIDが存在するかどうかで、どの機能（トラッカー or マイページ）が必要か判断する
    const discListContainer = document.getElementById('disc-container'); // トラッカー用
    const statsContainer = document.getElementById('mypage-content');   // マイページ用

    // B. データが必要なページ（トラッカー or マイページ）の場合のみ実行
    if (discListContainer || statsContainer) {
        console.log("データが必要なページです。通信を開始します...");

        // 共通のデータ取得：Supabaseから全ディスク情報を一括取得
        // await を使うことで、データ取得が完了するまで次の描画処理を待機させる
        await fetchDiscs();

        // トラッカーページ専用の初期化
        if (discListContainer) {
            console.log("トラッカー表示を初期化します");
            setupEventListeners(); // 検索やフィルタのイベント登録
            updateDisplay();       // 取得データに基づいた初期描画
        }

        // マイページ（コレクションページ）の場合は、
        // 外部ファイル mypage.js 側で allDiscs を参照して統計描画を行う設計
    }
    // C. データが不要問い合わせページの場合
    else {
        console.log("このページではデータ取得をスキップします💎");
        // 通信を発生させないことで、不要なAPI呼び出しを抑え、パフォーマンスを向上させている
    }


    // 【設計のポイント】
    // 共通の script.js でデータを一括管理(Single Source of Truth)し、
    // 実際の描画は各ページ(DOMの存在)に応じて切り替えることで、
    // メンテナンス性の高い「疎結合」な設計を目指しています。
});


/**
 * Javaサーバーからデータを取得する関数
 */
async function fetchDiscs() {
    try {
        // コンソールに表示されているURLにリクエストを送信
        const response = await fetch('/api/shinee/discography');

        // HTTPステータスが200 OK以外（500エラーなど）の場合、Java側のエラーを検知して停止させる
        if (!response.ok) {
            throw new Error(`サーバーエラー: ${response.status}`);
        }

        // JSON形式でデータを受け取り、全ページ共通変数 allDiscs に格納
        allDiscs = await response.json();
        console.log("データ取得成功！", allDiscs);

        // データが空でないことを確認してから、カテゴリーフィルターの生成を実行
        if (allDiscs && allDiscs.length > 0) {
            generateCategoryFilter(allDiscs);
        }


        /**
         * カテゴリーフィルター生成専用の関数
         * 外に出すと動かないためデータ取得後に確実に動作するように処理を行う
         */
        function generateCategoryFilter(data) {
            const container = document.getElementById('filter-category-container');
            if (!container) return; // フィルター設置場所がないページでは終了

            // 1. 全データからカテゴリーを抜き出し、スラッシュで分割して平坦なリストにする
            // 例：「Mini/Album」を [ "Mini", "Album" ] という配列に分けて1つにまとめる
            const allCategoriesRaw = data.flatMap(d => {
                if (!d.category) return [];
                return d.category.split('/');
            });

            // 2. Setオブジェクトを使用して重複を自動削除し、ユニークなリストを作成
            const categories = [...new Set(allCategoriesRaw)];

            console.log("分割・抽出されたカテゴリー:", categories);

            // 3. セレクトボックスの生成とスタイルの適用
            const select = document.createElement('select');
            select.id = 'filter-category';
            select.className = 'filter-select'; // CSSで定義した「▽なし・丸ボタン風」のデザインを適用

            // 4. 最初の選択肢を「全表示ラベル」にする
            select.innerHTML = `<option value="All">All Category</option>`;

            // 5. 抽出したカテゴリーを順次optionとして追加
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                select.appendChild(option);
            });

            // 6. 元々の「カテゴリー」という文字ラベルを消して、生成したセレクトボックスと差し替え
            container.innerHTML = '';
            container.appendChild(select);

            // 7. カテゴリーを変えた時に画面を再描画（フィルタリング実行）するイベント
            select.addEventListener('change', () => {
                updateDisplay(); // 既存の描画更新関数を呼び出す
            });
        }

    } catch (error) {
        // 通信失敗時のフォールバック処理：デバッグ用のダミーデータを表示させる
        // これによりJava側が動いていない状態でも、フロントエンドの見た目確認が可能になる
        console.error("【エラー発生】Javaサーバーから応答がありません:", error);

        allDiscs = [
            {
                disc_id: 'd1',
                title: "Don't Call Me",
                title_sub: "7th Album",
                artist: "SHINee",
                country: "KR",
                releaseDate: "2021-02-22",
                isPurchased: true,
                display_name: "Fake Reality Ver.",
                edition_id: "e1",
                price: 13000,
                currency: "₩",
                tracklist: "Don't Call Me,Heart Attack,Marry You",
                benefit: "Booklet 12P,Lyrics Paper,トレカ(全4種中1種ランダム)",
                video_content: "Music Video",
                remarks: "ジャケット：メンバー別4種"
            }
        ];
    }
}


/**
 * フィルタ＆ソート
 * 要素の存在チェックを強化し、どのページでもエラーで止まらないように設計
 */
function updateDisplay() {
    // A. 各セレクトボックス要素を取得
    const elArtist = document.getElementById('filter-artist');
    const elCountry = document.getElementById('filter-country');
    const elPurchased = document.getElementById('filter-purchased');
    const elSort = document.getElementById('sort-date');
    const elCategory = document.getElementById('filter-category'); // カテゴリ追加

    // 【重要】どれか一つでも見つからなければ、処理を中断する（安全装置）
    // これにより、フィルターがないページ（マイページ等）でこの関数が呼ばれてもエラーにならない
    if (!elArtist || !elCountry || !elPurchased || !elSort || !elCategory) {
        return;
    }

    // 現在の選択値を取得
    const artistVal = elArtist.value;
    const countryVal = elCountry.value;
    const purchasedVal = elPurchased.value;
    const sortOrder = elSort.value;
    // カテゴリーは生成タイミングによって存在しない場合があるため、安全に取得
    const categoryVal = (elCategory && elCategory.value) ? elCategory.value : 'All';

    // B. アーティストに合わせてサイトのテーマカラーを変更
    // メンバーカラーへの切り替えロジックを呼び出す
    if (typeof updateMemberTheme === 'function') {
        updateMemberTheme(artistVal);
    }

    // C. メインロジック：全データ（allDiscs）から条件に合うものを抽出
    let filtered = allDiscs.filter(disc => {
        // 1. アーティスト絞り込み（'All'なら全件通す）
        const matchArtist = (artistVal === 'All' || disc.artist === artistVal);
        // 2. 国別の絞り込み
        const matchCountry = (countryVal === 'All' || disc.country === countryVal);
        // 3. カテゴリーの絞り込み（文字列内に含まれているか判定）
        const matchCategory = (categoryVal === 'All' || (disc.category && disc.category.includes(categoryVal)));

        // 4. 【修正ポイント】購入済み判定
        // Java側の仕様（Boolean型）とJS側の文字列を比較するために論理値を正規化
        const isPurchased = !!disc.purchased;
        let matchPurchased = true;
        if (purchasedVal === 'Purchased') {
            matchPurchased = (isPurchased === true);
        } else if (purchasedVal === 'NotPurchased') {
            matchPurchased = (isPurchased === false);
        }

        // すべての条件を満たしたものだけが filtered 配列に残る
        return matchArtist && matchCountry && matchPurchased && matchCategory;
    });

    // フィルタデバッグ用
    console.log("フィルタ実行中:", { artistVal, countryVal, purchasedVal, categoryVal });
    console.log("【デバッグ情報】", {
        元データの数: allDiscs ? allDiscs.length : "データ自体が存在しません",
        フィルター後の数: filtered.length,
        現在のカテゴリー: categoryVal,
        現在のアーティスト: artistVal
    });


    // D. ソート処理：発売日順に並び替え
    filtered.sort((a, b) => {
        const dateA = new Date(a.releaseDate);
        const dateB = new Date(b.releaseDate);
        // 昇順(asc)か降順(desc)かで計算順序を切り替え
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // E. 重複排除：ユニークなリストを作成
    // 同じ作品でエディション違いがある場合でも、タイトルやIDで一つにまとめる
    const uniqueDiscs = [];
    const seenIds = new Set();
    filtered.forEach(disc => {
        const id = disc.discId || disc.disc_id;

        if (id && !seenIds.has(id)) {
            seenIds.add(id);
            uniqueDiscs.push(disc);
        } else if (!id) {
            // もしIDが取れていなければ、タイトルで代用（保険）
            if (!seenIds.has(disc.title)) {
                seenIds.add(disc.title);
                uniqueDiscs.push(disc);
            }
        }
    });

    //ソートデバッグ用
    console.log("描画するユニークな作品数:", uniqueDiscs.length);

    // 最後に、完成した「ユニークなリスト」を画面に描画する関数へ渡す
    renderDiscGrid(uniqueDiscs);


    // 【データクレンジング】
    // 同一作品に複数のエディションがある場合でも、トップ画面では1つのカードとして
    // 表示させるため、Setオブジェクトを活用してユニークなIDのみを抽出しています。

}

/**
 * アーティスト（メンバー）の選択に合わせてサイトのテーマカラーを動的に切り替える
 * @param {string} artist - 選択されたアーティスト名（'All', 'SHINee', 'Onew' など）
 */
function updateMemberTheme(artist) {
    const body = document.body;

    // 1. クラスのリセット
    // 現在設定されている可能性のあるすべてのメンバー用クラスと、メンバー専用モードのフラグを一括削除
    // これにより、テーマが重複して適用されるのを防ぐ
    body.classList.remove('theme-onew', 'theme-jonghyun', 'theme-key', 'theme-minho', 'theme-taemin', 'member-mode');

    // 2. テーマ適用判定
    // 'All'（全員）または 'SHINee'（グループ全体）以外が選ばれた場合のみ、個別テーマを適用する
    if (artist !== 'All' && artist !== 'SHINee') {
        // 文字列を小文字に変換（例：'Key' -> 'key'）してクラス名を作成
        // テンプレートリテラルを使うことで、メンバーが増えても柔軟に対応できる設計
        body.classList.add(`theme-${artist.toLowerCase()}`, 'member-mode');

        // クラスを付け替えることで、CSS側で定義したカスタムプロパティ（--theme-color 等）が
        // 一括で書き換わり、JSでスタイルを1つずつ指定することなくページ全体の着色を実現しています。
    }
}

/**
 * メイングリッド描画
 * フィルタリング・ソート済みのデータを受け取り、HTML要素として画面に生成する
 * @param {Array} discs - 描画対象のディスクオブジェクト配列
 */
function renderDiscGrid(discs) {
    console.log("今から描画する枚数:", discs.length); // デバッグ用：件数の整合性確認
    const container = document.getElementById('disc-container');
    if (!container) return; // 描画先がない場合は中断

    // 前回の描画内容をクリア
    container.innerHTML = '';

    discs.forEach(disc => {
        // A. カード要素（div）の生成
        const item = document.createElement('div');

        // B. 購入ステータスの判定ロジック
        // DB（Java側）のカラム名表記揺れに対応するため、複数のプロパティ名をチェック
        const isPurchased = (disc.purchased === true || disc.IsPurchased === true);
        const isAnyPurchased = (disc.hasPurchased === true || isPurchased);

        // C. 動的なクラス適用
        // 購入済みなら 'is-purchased'、未購入なら 'not-purchased' を付与
        // これにより、CSS側で「未購入なら画像を白黒にする」などの視覚効果を制御できる
        item.className = `disc-item ${isAnyPurchased ? 'is-purchased' : 'not-purchased'}`;

        // D. カード内部のHTML構築
        // テンプレートリテラルを使い、サブタイトルがある場合のみ span タグを生成する三項演算子を活用
        item.innerHTML = `
            <span class="disc-title">${disc.title}</span>${disc.titleSub ? `<span class="disc-subtitle"> ${disc.titleSub}</span>` : ''}
            
        `;

        // E. インタラクション設定（クリックで詳細表示）
        item.onclick = () => {
            // JavaのDiscographyクラスのID命名規則に合わせて discId または disc_id を取得
            const targetId = disc.discId || disc.disc_id;
            console.log("モーダルを開こうとしています。ID:", targetId);

            // トラッカーページの中核機能である「形態一覧モーダル」を表示する関数を呼び出し
            if (typeof showModal === 'function') {
                showModal(targetId);
            }
        };

        // 親コンテナに追加
        container.appendChild(item);
    });
}

/**
 * チェックボックスが押されたときにJavaのAPIを叩いてDBを更新する関数
 * @param {string} editionId - 更新対象のエディションID
 * @param {boolean} isChecked - 新しい購入状態（true: 購入済み / false: 未購入）
 */
async function updatePurchaseStatus(editionId, isChecked) {
    console.log("更新中...", editionId, isChecked);

    try {
        // 1. PATCHメソッドによる部分更新リクエスト
        // 指定したエディションIDの購入フラグのみを書き換えるエンドポイントを呼び出す
        const response = await fetch(`/api/editions/${editionId}/purchase`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            // 2. Java側の @RequestBody Map<String, Boolean> payload に合わせた形式で送信
            // オブジェクトのキー名を Java 側の変数名 'isPurchased' と一致させることが重要
            body: JSON.stringify({ isPurchased: isChecked })
        });

        // 3. サーバー側での更新成否をチェック
        if (!response.ok) {
            throw new Error("サーバーでの更新に失敗しました");
        }

        console.log("DB更新成功！");
        // 更新が成功したことをユーザーに知らせる（必要に応じてUIを更新）

    } catch (error) {
        // 4. エラーハンドリング：通信失敗やDBエラー時の処理
        console.error("【エラー】ステータス更新中に問題が発生しました:", error);

        // ユーザーに視覚的に失敗を伝える（チェックボックスの状態を元に戻すなどの配慮があると親切）
        alert("保存に失敗しました。ネット接続やサーバーを確認してください。");
    }
}

/**
 * 形態一覧モーダルを表示する関数
 * クリックされた作品（discId）に紐づくすべてのエディションを表示する
 * @param {string} discId - 作品のユニークID
 */

function showModal(discId) {
    const modalBody = document.getElementById('modal-body');
    const overlay = document.getElementById('modal-overlay');

    // 1. 増殖防止：モーダルを開くたびに中身をリセットする
    modalBody.innerHTML = '';

    // 2. データ抽出：全データの中から、選択された作品に属するエディションをすべて探す
    const editions = allDiscs.filter(d => (d.discId === discId || d.disc_id === discId));

    if (editions.length === 0) {
        console.warn("データが見つかりません:", discId);
        return;
    }

    // 3. ヘッダー生成（作品タイトル部分）
    const header = document.createElement('div');
    header.className = 'modal-header-section';
    header.innerHTML = `
        <div class="modal-title-row">
            <span class="modal-main-title">${editions[0].title}</span>
            ${editions[0].titleSub ? `<span class="modal-sub-title">${editions[0].titleSub}</span>` : ''}
        </div>
    `;
    modalBody.appendChild(header);

    // 4. エディション（形態）ごとのカードを生成
    editions.forEach(ed => {
        // JavaのEntityクラス（Discography.java / Edition.java）のカラム名と完全に一致させる
        const id = ed.editionId;
        const name = ed.displayName;
        const purchased = ed.purchased;
        const isWishlist = ed.wishlist;

        // ウィッシュリストの状態に合わせてアイコンとクラスを切り替え
        const wishlistIcon = isWishlist ? 'shopping_cart' : 'add_shopping_cart';
        const wishlistClass = isWishlist ? 'active' : ''; // アクティブ時の色分け用

        // labelタグを使用することで、BOX全体をチェックボックスの反応範囲にする
        const label = document.createElement('label');
        label.className = 'edition-box';

        // innerHTMLで中身を構築：チェックボックス、エディション名、トラックリスト・詳細・ウィッシュリスト追加ボタン
        label.innerHTML = `
            <input type="checkbox" class="purchase-checkbox" 
                   ${purchased ? 'checked' : ''} 
                   onchange="updatePurchaseStatus('${id}', this.checked)"
                   style="display:none;">
            
            <span class="edition-name">${name || '通常盤'}</span>
            
            <div class="edition-controls">
                <button class="btn-circle" onclick="event.stopPropagation(); toggleDetail('${id}', 'track')">
                    <span class="material-symbols-outlined">queue_music</span>
                </button>
                <button class="btn-circle" onclick="event.stopPropagation(); toggleDetail('${id}', 'info')">
                    <span class="material-symbols-outlined">info</span>
                </button>
                <button class="btn-circle wishlist-btn ${wishlistClass}" onclick="event.stopPropagation(); toggleWishlist('${id}', this)">
                    <span class="material-symbols-outlined">${wishlistIcon}</span>
                </button>
            </div>
        `;
        modalBody.appendChild(label);

        // 5. 詳細表示用の箱（隠し要素）を独立して作成
        // BOXの外側なので、幅を自由に使える設計
        const detailDiv = document.createElement('div');
        detailDiv.id = `detail-${id}`;
        detailDiv.className = 'edition-detail hidden';
        modalBody.appendChild(detailDiv);
    });

    // 最後にモーダルを表示状態にする
    overlay.classList.remove('hidden');
}

/**
 * トラックリスト(🎵)や詳細情報(ⓘ)を表示・非表示する関数
 * @param {string} editionId - 対象のエディションID
 * @param {string} type - 表示タイプ ('track' または 'info')
 */
function toggleDetail(editionId, type) {
    // 1. 表示エリア（さっきモーダルで作った隠し箱）を取得
    const detailArea = document.getElementById(`detail-${editionId}`);

    // 2. 該当するエディションデータを全件データから検索
    // 修正ポイント：edition_id だけでなく editionId 両方の表記に対応させて安全性を向上
    const ed = allDiscs.find(e => e.editionId === editionId || e.edition_id === editionId);

    if (!ed) {
        console.error("エディションデータが見つかりません:", editionId);
        return;
    }

    // 3. 表示の切り替えロジック
    // 「隠れている」または「今とは違うタイプが選ばれた」場合に中身を書き換えて表示
    if (detailArea.classList.contains('hidden') || detailArea.dataset.currentType !== type) {
        detailArea.classList.remove('hidden');
        detailArea.dataset.currentType = type; // 現在表示中のタイプを記憶

        // --- A. トラックリスト表示の場合 ---
        if (type === 'track') {
            // トラックリストが空でないか確認
            if (!ed.tracklist) {
                detailArea.innerHTML = '<p class="no-data">No Tracklist</p>';
            } else {
                // 文字列整形：'///' でDISCごと、',' で曲ごとに分割してリスト化
                const discUnits = ed.tracklist.split('///');
                let fullHtml = '';

                discUnits.forEach((discContent, index) => {
                    // 各曲の前後スペースを削除し、2桁の番号（01.など）を付与
                    const tracks = discContent.split(',').map((t, i) =>
                        `<li>${String(i + 1).padStart(2, '0')}. ${t.trim()}</li>`
                    ).join('');

                    // 複数ディスクある場合は「DISC 1」などの見出しを付ける
                    const discTitle = discUnits.length > 1 ? `<h4 class="disc-label">DISC ${index + 1}</h4>` : '';
                    fullHtml += `
                        <div class="disc-unit">
                            ${discTitle}
                            <ul class="track-list">${tracks}</ul>
                        </div>
                    `;
                });

                detailArea.innerHTML = fullHtml;
            }
        }
        // --- B. 詳細情報(info)表示の場合 ---
        else if (type === 'info') {
            // 部品化された関数（createInfoContent）を呼び出すことで、コードの重複を避ける
            detailArea.innerHTML = createInfoContent(ed);
        }


    }
    // 4. すでに表示されているボタンをもう一度押した場合は閉じる
    else {
        detailArea.classList.add('hidden');
    }
}

/**
 * 特典情報や価格など、詳細情報の中身をHTMLとして組み立てる部品関数
 * @param {Object} ed - 対象のエディションデータ
 * @returns {string} 組み立てられたHTML文字列
 */
function createInfoContent(ed) {
    let html = `<div class="info-content">`;


    // 1. 価格のフォーマット処理：Intl.NumberFormat の活用
    // 単なる数字（13000）を、通貨記号や桁区切り（₩13,000）に自動変換する高度な実装
    if (ed.price) {
        // DBの通貨コード（ed.currency）を使用して、国に合わせたフォーマットを自動設定
        const formattedPrice = new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: ed.currency || 'JPY' // 通貨コードがない場合は日本円をデフォルトに
        }).format(ed.price);

        html += `<p class="info-item"><strong>価格:</strong> ${formattedPrice}</p>`;
    }

    // 2. 特典情報の整形
    // カンマ区切りの文字列を、<br>タグに置換して読みやすく改行表示させる
    if (ed.benefit) html += `<p class="info-item"><strong>特典:</strong><br>${ed.benefit.split(',').join('<br>')}</p>`;

    // 3. 映像内容の表示判定
    // DVDやBlu-rayが含まれるエディションのみ、項目自体を表示するロジックを維持
    if (ed.videoContent) html += `<p class="info-item"><strong>映像内容:</strong><br>${ed.videoContent.split(',').join('<br>')}</p>`;
    html += `</div>`;

    // 4. 備考欄の追加
    // 備考がある場合のみ、専用のスタイル（remarks-box）を当てて表示
    if (ed.remarks) html += `<p class="info-item remarks-box"><strong>備考:</strong> ${ed.remarks}</p>`;
    html += `</div>`;
    return html;
}

/**
 * イベント設定
 * ユーザーがセレクトボックスを動かした時に、自動で表示を更新するように紐付ける
 */
function setupEventListeners() {
    // A. 監視したい要素のIDをリスト（配列）にする
    const filterIds = ['filter-artist', 'filter-country', 'filter-purchased', 'sort-date'];

    // B. 配列をループ（forEach）して、1つずつ設定を貼り付けていく
    filterIds.forEach(id => {
        // IDを使って画面から要素を探す
        const el = document.getElementById(id);

        //要素が存在する場合のみイベントを追加
        //要素がないページでエラーが出てアプリが止まってしまうのを防いでいる
        if (el) {
            // セレクトボックスの値が変わった（change）瞬間に、
            // updateDisplay（フィルタリング関数）を動かすように予約する
            el.addEventListener('change', updateDisplay);
        }
    });

    // C. モーダルを閉じる処理の設定
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            // モーダルを隠すクラス（hidden）を付け足して画面から消す
            document.getElementById('modal-overlay').classList.add('hidden');
        });
    }
}

/**
 * 欲しいものリスト（🛒）の表示を切り替え、Java側へ保存リクエストを送る
 * @param {string} id - エディションのID
 * @param {HTMLButtonElement} btnElement - クリックされたボタン自身（this）
 */
async function toggleWishlist(id, btnElement) {
    // 1. 現在の状態をクラス名で判定
    const isActive = btnElement.classList.contains('active');

    // 2. 【楽観的UI更新】見た目を即座に反転させる
    // サーバーからの返事を待たずに画面を変えることで、サクサク動く操作感を実現
    const nextState = !isActive;
    const iconSpan = btnElement.querySelector('.material-symbols-outlined');

    if (nextState) {
        btnElement.classList.add('active');
        iconSpan.textContent = 'shopping_cart'; // 🛒カートに入ったアイコンへ
    } else {
        btnElement.classList.remove('active');
        iconSpan.textContent = 'add_shopping_cart'; // 🛒+追加待ちアイコンへ
    }

    console.log(`ID: ${id} を ${nextState ? '欲しいもの' : 'リストから削除'} として処理します`);

    // 3. Javaへの非同期通信（バックグラウンドで実行）
    try {
        const response = await fetch(`/api/editions/${id}/wishlist`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            // Java側のEntityクラスの変数名 'isWishlist' と合わせて送信
            body: JSON.stringify({ isWishlist: nextState })
        });

        if (!response.ok) {
            throw new Error('サーバー側の更新に失敗しました');
        }
        console.log("DB更新成功！");

    } catch (error) {
        console.error("DB更新エラー:", error);

        // 4. ロールバック処理：通信に失敗した場合は、ユーザーにバレないようにこっそり見た目を元に戻す
        // これにより「画面では変わったのに実は保存されていなかった」という不整合を防ぐ
        btnElement.classList.toggle('active');
        iconSpan.textContent = btnElement.classList.contains('active') ? 'shopping_cart' : 'add_shopping_cart';

        alert("保存に失敗しました。電波の良いところで再度お試しください。");
    }

}
