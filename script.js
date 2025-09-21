document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-button');
    const panels = {
        'tab-manual': document.getElementById('panel-manual'),
        'tab-auto': document.getElementById('panel-auto'),
        'tab-sim': document.getElementById('panel-sim'),
    };
    const dataSection = document.getElementById('data-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // すべてのタブとパネルを非アクティブ/非表示に
            tabs.forEach(t => t.classList.remove('active'));
            Object.values(panels).forEach(p => p.classList.add('hidden'));

            // クリックされたタブと対応するパネルをアクティブ/表示に
            tab.classList.add('active');
            if (panels[tab.id]) {
                panels[tab.id].classList.remove('hidden');
            }

            // シミュレーションタブ以外ではデータセクションを表示
            if (tab.id !== 'tab-sim') {
                dataSection.classList.remove('hidden');
            } else {
                dataSection.classList.add('hidden');
            }
        });
    });

    // TODO: ここに各パネルの中身（フォームやストップウォッチ）と、グラフや表の処理を追加していきます。
    console.log("実験ページの準備ができました。");
});
