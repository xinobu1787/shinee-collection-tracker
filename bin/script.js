let allData = []; // Javaから読み込んだ全データ

// 1. ページ読み込み時にデータを取得
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data.json');
        allData = await response.json();
        
        // 初回表示（全データ表示）
        applyFilters();

        // フィルターのセレクトボックスにイベントを設定
        ['f-artist', 'f-country', 'f-category'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('change', applyFilters);
        });

    } catch (e) {
        console.error("データの読み込みに失敗しました:", e);
    }
});



// 2. フィルターを適用して描画する関数
function applyFilters() {
    const artist = document.getElementById('f-artist').value.toLowerCase();
    const country = document.getElementById('f-country').value.toLowerCase();
    const category = document.getElementById('f-category').value.toLowerCase();

    // フィルター実行
    const filtered = allData.filter(item => {
        const matchA = (artist === 'all' || item.artist.toLowerCase() === artist);
        const matchC = (country === 'all' || item.country.toLowerCase() === country);
        
        let matchCat = (category === 'all');
        if (!matchCat) {
            // item.category が ["Mini", "album"] のような配列であることを前提
            const cats = item.category.map(c => c.toLowerCase());
            if (category === 'album') {
                matchCat = cats.includes('album') || cats.includes('mini');
            } else {
                matchCat = cats.includes(category);
            }
        }
        return matchA && matchC && matchCat;
    });

    render(filtered);
}


// 3. データを「アルバム名」でグループ化してHTMLを作る
function render(data) {
    const app = document.getElementById('collection-app');
    
    // アルバムごとにグループ化
    const groups = [];
    data.forEach(item => {
        let group = groups.find(g => g.title === item.title);
        if (!group) {
            group = { 
                title: item.title, 
                artist: item.artist, 
                country: item.country,
                category: item.category,
                editions: [] 
            };
            groups.push(group);
        }
        group.editions.push(item);
    });

    // HTMLの組み立て
    app.innerHTML = `
        <table id="collection-table">
            ${groups.map(group => `
                <tr class="album-row" onclick="handleToggle(this)">
                    <td class="title-cell">${group.title}</td>
                    <td colspan="2"></td>
                </tr>
                <tr class="edition-container-row" style="display: none;">
                    <td colspan="3">
                        <table class="edition-table" style="width:100%;">
                            ${group.editions.map(ed => `
                                <tr class="edition-row">
                                    <td class="edition-name">${ed.displayName}</td>
                                    <td><input type="checkbox" ${ed.isPurchased ? 'checked' : ''}></td>
                                    <td>
                                        <button class="btn-tracks">曲目</button>
                                        <button class="btn-details">詳細</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    </td>
                </tr>
            `).join('')}
        </table>
    `;
}



// 4. トグル（開閉）機能
function handleToggle(element) {
    const containerRow = element.nextElementSibling;
    if (containerRow.style.display === "none") {
        containerRow.style.display = "table-row"; // テーブルなので table-row にする
    } else {
        containerRow.style.display = "none";
    }
}
   

   

/*function sortRows(rows, order) {
    const tbody = document.querySelector('#collection-table tbody');
    
    rows.sort((a, b) => {
        const dateA = a.getAttribute('data-date');
        const dateB = b.getAttribute('data-date');
        
        if (order === 'new') {
            return dateB.localeCompare(dateA); // 降順
        } else {
            return dateA.localeCompare(dateB); // 昇順
        }
    });

    // 並べ替えた行をテーブルに再配置
    rows.forEach(row => tbody.appendChild(row));
}*/

