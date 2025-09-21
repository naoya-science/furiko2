document.addEventListener('DOMContentLoaded', () => {
    // データ定義
    const experiments = {
        length: { label: 'ふりこの長さ', unit: 'cm', conditions: [25, 50, 100, 200], data: {}, color: '#3b82f6' },
        weight: { label: 'おもりの重さ', unit: 'g', conditions: [10, 20, 30, 40], data: {}, color: '#16a34a' },
        amplitude: { label: 'ふれはば', unit: '°', conditions: [10, 20, 30], data: {}, color: '#f97316' },
    };

    const charts = {};

    // ===================================
    // HTML要素の動的生成
    // ===================================
    function createManualForm(key, config) {
        return `
            <div class="p-4 border rounded-lg">
                <h4 class="font-bold text-lg mb-2 text-[${config.color}]">${config.label}の実験</h4>
                ${config.conditions.map(c => `
                    <div class="flex items-center gap-4 my-2 p-2 rounded-md bg-gray-50">
                        <div class="font-bold w-24">${c}${config.unit}</div>
                        <input type="number" step="0.01" placeholder="1回目" class="w-full p-1 border rounded-md manual-time-input" data-key="${key}" data-condition="${c}" data-trial="0">
                        <input type="number" step="0.01" placeholder="2回目" class="w-full p-1 border rounded-md manual-time-input" data-key="${key}" data-condition="${c}" data-trial="1">
                        <input type="number" step="0.01" placeholder="3回目" class="w-full p-1 border rounded-md manual-time-input" data-key="${key}" data-condition="${c}" data-trial="2">
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    function createDataOutput(key, config) {
        return `
            <div>
                <h3 class="text-lg font-bold text-center mb-4">${config.label}と時間の関係</h3>
                <div class="h-64"><canvas id="chart-${key}"></canvas></div>
                <div class="mt-4 overflow-x-auto">
                    <table class="w-full text-left border-collapse text-sm" id="table-${key}">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="p-2 border">${config.label}</th>
                                <th class="p-2 border">1回目</th><th class="p-2 border">2回目</th><th class="p-2 border">3回目</th>
                                <th class="p-2 border">合計</th><th class="p-2 border">平均</th><th class="p-2 border font-bold">1往復</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // ===================================
    // 画面の初期化
    // ===================================
    const manualFormsContainer = document.getElementById('manual-forms');
    const dataOutputsContainer = document.getElementById('data-outputs');
    
    Object.entries(experiments).forEach(([key, config]) => {
        manualFormsContainer.innerHTML += createManualForm(key, config);
        dataOutputsContainer.innerHTML += createDataOutput(key, config);
        createChart(key, config);
        // 初期テーブル描画
        updateManualDisplay(key); 
    });

    // ===================================
    // グラフの作成と更新
    // ===================================
    function createChart(key, config) {
        const ctx = document.getElementById(`chart-${key}`).getContext('2d');
        charts[key] = new Chart(ctx, {
            type: 'bar',
            data: { labels: [], datasets: [{
                label: '1往復の時間 (秒)', data: [], backgroundColor: config.color + '80',
                borderColor: config.color, borderWidth: 1
            }]},
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 5, title: { display: true, text: '時間(秒)' } } }
            }
        });
    }
    
    function updateManualDisplay(key) {
        const config = experiments[key];
        const tableBody = document.querySelector(`#table-${key} tbody`);
        tableBody.innerHTML = '';
        
        const chartLabels = [];
        const chartData = [];

        config.conditions.forEach(condition => {
            const times = config.data[condition] || [];
            const validTimes = times.filter(t => t > 0);
            const sum = validTimes.reduce((a, b) => a + b, 0);
            const avg = validTimes.length > 0 ? sum / validTimes.length : 0;
            const period = avg > 0 ? avg / 10 : 0;

            const row = `
                <tr>
                    <td class="p-2 border">${condition}${config.unit}</td>
                    <td class="p-2 border">${times[0] ? times[0].toFixed(2) : '-'}</td>
                    <td class="p-2 border">${times[1] ? times[1].toFixed(2) : '-'}</td>
                    <td class="p-2 border">${times[2] ? times[2].toFixed(2) : '-'}</td>
                    <td class="p-2 border">${sum > 0 ? sum.toFixed(2) : '-'}</td>
                    <td class="p-2 border">${avg > 0 ? avg.toFixed(2) : '-'}</td>
                    <td class="p-2 border font-bold">${period > 0 ? period.toFixed(2) : '-'}</td>
                </tr>`;
            tableBody.innerHTML += row;
            
            if (period > 0) {
                chartLabels.push(`${condition}${config.unit}`);
                chartData.push(period);
            }
        });

        charts[key].data.labels = chartLabels;
        charts[key].data.datasets[0].data = chartData;
        charts[key].update();
    }

    // ===================================
    // 手動記録 イベントリスナー
    // ===================================
    manualFormsContainer.addEventListener('input', e => {
        if (e.target.classList.contains('manual-time-input')) {
            const { key, condition, trial } = e.target.dataset;
            const value = parseFloat(e.target.value);
            
            if (!experiments[key].data[condition]) {
                experiments[key].data[condition] = [];
            }
            experiments[key].data[condition][parseInt(trial)] = value;
            
            updateManualDisplay(key);
        }
    });

    // ===================================
    // ストップウォッチモード
    // ===================================
    const swDisplay = document.getElementById('stopwatch-display');
    const swStartBtn = document.getElementById('sw-start');
    const swStopBtn = document.getElementById('sw-stop');
    const swResetBtn = document.getElementById('sw-reset');
    const swRecordBtn = document.getElementById('sw-record');
    const swLogBody = document.getElementById('sw-log-body');
    const expTypeSelect = document.getElementById('experiment-type');
    const swControlsContainer = document.getElementById('sw-controls');
    let swState = { isRunning: false, startTime: 0, intervalId: null, elapsedTime: 0 };
    let logCount = 0;

    // スライダー生成
    Object.entries(experiments).forEach(([key, config]) => {
        const isLength = key === 'length';
        const step = isLength ? 25 : 10;
        const min = config.conditions[0];
        const max = config.conditions[config.conditions.length-1];

        swControlsContainer.innerHTML += `
            <div id="sw-control-${key}" class="p-2 rounded-md transition-all duration-300">
                <label for="sw-${key}" class="block font-medium">${config.label} (${config.unit})</label>
                <div class="flex items-center gap-4">
                    <input type="range" id="sw-${key}" min="${min}" max="${max}" step="${step}" value="${min}" class="w-full">
                    <span id="sw-${key}-value" class="font-bold w-24 text-right">${min}${config.unit}</span>
                </div>
            </div>
        `;
    });
    
    // スライダーの値表示更新
    swControlsContainer.addEventListener('input', e => {
        if (e.target.type === 'range') {
            const key = e.target.id.split('-')[1];
            document.getElementById(`${e.target.id}-value`).textContent = e.target.value + experiments[key].unit;
        }
    });

    // 実験の種類に応じてヒントを表示
    expTypeSelect.addEventListener('change', e => {
        const selectedType = e.target.value;
        Object.keys(experiments).forEach(key => {
            const controlDiv = document.getElementById(`sw-control-${key}`);
            const slider = document.getElementById(`sw-${key}`);
            if (selectedType === 'none') {
                controlDiv.classList.remove('bg-yellow-200', 'bg-gray-200');
                slider.disabled = false;
            } else if (key === selectedType) {
                controlDiv.classList.add('bg-yellow-200'); // 動かす値
                controlDiv.classList.remove('bg-gray-200');
                slider.disabled = false;
            } else {
                controlDiv.classList.add('bg-gray-200'); // 揃える値
                controlDiv.classList.remove('bg-yellow-200');
                slider.disabled = true;
            }
        });
    });

    function formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const hundredths = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
    }

    swStartBtn.addEventListener('click', () => {
        if (swState.isRunning) return;
        swState.isRunning = true;
        swState.startTime = Date.now() - swState.elapsedTime;
        swState.intervalId = setInterval(() => {
            swDisplay.textContent = formatTime(Date.now() - swState.startTime);
        }, 10);
        swStartBtn.disabled = true;
        swStopBtn.disabled = false;
        swResetBtn.disabled = true;
        swRecordBtn.disabled = true;
    });

    swStopBtn.addEventListener('click', () => {
        if (!swState.isRunning) return;
        swState.isRunning = false;
        clearInterval(swState.intervalId);
        swState.elapsedTime = Date.now() - swState.startTime;
        swStartBtn.disabled = false;
        swStopBtn.disabled = true;
        swResetBtn.disabled = false;
        swRecordBtn.disabled = false;
    });

    swResetBtn.addEventListener('click', () => {
        swState = { isRunning: false, startTime: 0, intervalId: null, elapsedTime: 0 };
        swDisplay.textContent = '00:00.00';
        swStartBtn.disabled = false;
        swStopBtn.disabled = true;
        swResetBtn.disabled = true;
        swRecordBtn.disabled = true;
    });
    
    swRecordBtn.addEventListener('click', () => {
        if (logCount >= 50) {
            alert('最大50件まで記録できます。');
            return;
        }
        logCount++;
        const length = document.getElementById('sw-length').value;
        const weight = document.getElementById('sw-weight').value;
        const amplitude = document.getElementById('sw-amplitude').value;
        const time = (swState.elapsedTime / 1000).toFixed(2);
        
        const row = `
            <tr>
                <td class="p-2 border">${logCount}</td>
                <td class="p-2 border">${length}</td>
                <td class="p-2 border">${weight}</td>
                <td class="p-2 border">${amplitude}</td>
                <td class="p-2 border">${time}</td>
            </tr>
        `;
        swLogBody.innerHTML += row;
        swRecordBtn.disabled = true;
    });

    // ===================================
    // タブ切り替え
    // ===================================
    const tabs = document.querySelectorAll('.tab-button');
    const panels = {
        'tab-manual': document.getElementById('panel-manual'),
        'tab-auto': document.getElementById('panel-auto'),
        'tab-sim': document.getElementById('panel-sim'),
    };
    const dataSection = document.getElementById('data-section');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            Object.values(panels).forEach(p => p.classList.add('hidden'));
            tab.classList.add('active');
            panels[tab.id].classList.remove('hidden');
            dataSection.style.display = tab.id === 'tab-manual' ? 'block' : 'none';
        });
    });
});
