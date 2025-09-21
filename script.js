document.addEventListener('DOMContentLoaded', () => {
    // データ定義
    const experiments = {
        length: { label: 'ふりこの長さ', unit: 'cm', conditions: [25, 50, 100, 200], data: {}, color: '#3b82f6' },
        weight: { label: 'おもりの重さ', unit: 'g', conditions: [10, 20, 30, 40], data: {}, color: '#16a34a' },
        amplitude: { label: 'ふれはば', unit: '°', conditions: [10, 20, 30], data: {}, color: '#f97316' },
    };

    const charts = {};

    // HTML要素の生成
    function createManualForm(key, config) {
        return `
            <div class="p-4 border rounded-lg">
                <h4 class="font-bold text-lg mb-2 text-[${config.color}]">${config.label}の実験</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block font-medium">${config.label} (${config.unit}):</label>
                        <select class="w-full p-2 border rounded-md" data-key="${key}" data-type="condition">
                            ${config.conditions.map(c => `<option value="${c}">${c}${config.unit}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block font-medium">10往復の時間 (秒):</label>
                        <input type="number" step="0.01" class="w-full p-2 border rounded-md" placeholder="例: 14.28" data-key="${key}" data-type="time">
                    </div>
                </div>
                <button class="add-result-btn mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-700" data-key="${key}">記録する</button>
            </div>
        `;
    }

    function createAutoForm(key, config) {
        return `
            <div class="stopwatch-item p-4 border rounded-lg text-center">
                <h4 class="font-bold text-lg mb-2">${config.label}</h4>
                <div class="text-4xl font-bold my-2" id="stopwatch-${key}">00:00.00</div>
                <div class="my-4">
                    <label>${config.label} (${config.unit}):</label>
                    <select class="p-2 border rounded-md" data-key="${key}" data-type="condition">
                       ${config.conditions.map(c => `<option value="${c}">${c}${config.unit}</option>`).join('')}
                    </select>
                </div>
                <button class="start-stop-btn bg-green-500 text-white font-bold py-2 px-4 rounded-full" data-key="${key}">スタート</button>
                <button class="record-btn hidden bg-blue-600 text-white font-bold py-2 px-4 rounded-full" data-key="${key}">記録する</button>
            </div>
        `;
    }
    
    function createDataOutput(key, config) {
        return `
            <div>
                <h3 class="text-lg font-bold text-center mb-4">${config.label}と時間の関係</h3>
                <div class="h-64"><canvas id="chart-${key}"></canvas></div>
                <div class="mt-4 overflow-x-auto">
                    <table class="w-full text-left border-collapse" id="table-${key}">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="p-2 border">${config.label}</th>
                                <th class="p-2 border">10往復(秒)</th>
                                <th class="p-2 border">1往復(秒)</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function createSimControls() {
        return `
            <h4 class="text-xl font-bold mb-4">条件を決めよう</h4>
            ${Object.entries(experiments).map(([key, config]) => `
                <div class="mb-4">
                    <label for="sim-${key}" class="block font-medium">${config.label} (${config.unit})</label>
                    <input type="range" id="sim-${key}" min="${config.conditions[0]}" max="${config.conditions[config.conditions.length - 1]}" step="${key === 'length' ? 25 : 10}" value="${config.conditions[0]}" class="w-full">
                    <span id="sim-${key}-value" class="block text-right">${config.conditions[0]}${config.unit}</span>
                </div>
            `).join('')}
            <button id="startSimBtn" class="mt-4 bg-blue-600 text-white font-bold py-2 px-6 rounded-full w-full">シミュレーションスタート</button>
        `;
    }

    // 画面の初期化
    const manualFormsContainer = document.getElementById('manual-forms');
    const autoFormsContainer = document.getElementById('auto-forms');
    const dataOutputsContainer = document.getElementById('data-outputs');
    const simControlsContainer = document.getElementById('sim-controls');

    Object.entries(experiments).forEach(([key, config]) => {
        manualFormsContainer.innerHTML += createManualForm(key, config);
        autoFormsContainer.innerHTML += createAutoForm(key, config);
        dataOutputsContainer.innerHTML += createDataOutput(key, config);
        createChart(key, config);
    });
    simControlsContainer.innerHTML = createSimControls();


    // グラフの作成と更新
    function createChart(key, config) {
        const ctx = document.getElementById(`chart-${key}`).getContext('2d');
        charts[key] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '1往復の時間 (秒)',
                    data: [],
                    backgroundColor: config.color + '80', // 半透明
                    borderColor: config.color,
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }
    
    function updateDisplay(key) {
        const config = experiments[key];
        const tableBody = document.querySelector(`#table-${key} tbody`);
        tableBody.innerHTML = '';
        const sortedConditions = Object.keys(config.data).sort((a, b) => a - b);
        
        charts[key].data.labels = sortedConditions;
        charts[key].data.datasets[0].data = sortedConditions.map(c => config.data[c] / 10);
        charts[key].update();

        sortedConditions.forEach(condition => {
            const time = config.data[condition];
            const row = `<tr><td class="p-2 border">${condition}${config.unit}</td><td class="p-2 border">${time.toFixed(2)}</td><td class="p-2 border">${(time / 10).toFixed(2)}</td></tr>`;
            tableBody.innerHTML += row;
        });
    }

    // イベントリスナー
    document.getElementById('manual-forms').addEventListener('click', (e) => {
        if (e.target.classList.contains('add-result-btn')) {
            const key = e.target.dataset.key;
            const condition = document.querySelector(`[data-key="${key}"][data-type="condition"]`).value;
            const time = parseFloat(document.querySelector(`[data-key="${key}"][data-type="time"]`).value);
            if (!isNaN(time)) {
                experiments[key].data[condition] = time;
                updateDisplay(key);
            }
        }
    });

    const stopwatches = {};
    document.getElementById('auto-forms').addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        if (e.target.classList.contains('start-stop-btn')) {
            const btn = e.target;
            if (!stopwatches[key] || !stopwatches[key].isRunning) {
                stopwatches[key] = { isRunning: true, startTime: Date.now(), intervalId: setInterval(() => {
                    const elapsed = (Date.now() - stopwatches[key].startTime) / 1000;
                    document.getElementById(`stopwatch-${key}`).textContent = elapsed.toFixed(2);
                }, 10)};
                btn.textContent = 'ストップ';
                btn.classList.replace('bg-green-500', 'bg-red-500');
                document.querySelector(`.record-btn[data-key="${key}"]`).classList.add('hidden');
            } else {
                clearInterval(stopwatches[key].intervalId);
                stopwatches[key].isRunning = false;
                btn.textContent = 'スタート';
                btn.classList.replace('bg-red-500', 'bg-green-500');
                document.querySelector(`.record-btn[data-key="${key}"]`).classList.remove('hidden');
            }
        }
        if (e.target.classList.contains('record-btn')) {
            const time = parseFloat(document.getElementById(`stopwatch-${key}`).textContent);
            const condition = document.querySelector(`#auto-forms [data-key="${key}"][data-type="condition"]`).value;
            experiments[key].data[condition] = time;
            updateDisplay(key);
            e.target.classList.add('hidden');
        }
    });

    // シミュレーション
    const simCanvas = document.getElementById('pendulumCanvas');
    const simCtx = simCanvas.getContext('2d');
    let animationId;
    
    function drawPendulum(angle, length) {
        const pivotX = simCanvas.width / 2;
        const pivotY = 20;
        const bobRadius = 15;
        const bobX = pivotX + length * Math.sin(angle);
        const bobY = pivotY + length * Math.cos(angle);
        simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
        simCtx.beginPath();
        simCtx.moveTo(pivotX, pivotY);
        simCtx.lineTo(bobX, bobY);
        simCtx.stroke();
        simCtx.beginPath();
        simCtx.arc(bobX, bobY, bobRadius, 0, 2 * Math.PI);
        simCtx.fillStyle = '#3b82f6';
        simCtx.fill();
    }
    
    document.getElementById('startSimBtn').addEventListener('click', () => {
        if(animationId) cancelAnimationFrame(animationId);
        const L = parseFloat(document.getElementById('sim-length').value) / 100;
        const maxAngle = parseFloat(document.getElementById('sim-amplitude').value) * Math.PI / 180;
        const period = 2 * Math.PI * Math.sqrt(L / 9.8);
        document.getElementById('periodDisplay').textContent = period.toFixed(2);
        let startTime = performance.now();
        function animate(time) {
            const elapsedTime = (time - startTime) / 1000;
            const angle = maxAngle * Math.cos(2 * Math.PI * elapsedTime / period);
            drawPendulum(angle, L * 500); // 描画用に長さを調整
            animationId = requestAnimationFrame(animate);
        }
        animationId = requestAnimationFrame(animate);
    });
    
    // シミュレーションのスライダー値表示
    simControlsContainer.addEventListener('input', e => {
        if(e.target.type === 'range') {
            document.getElementById(`${e.target.id}-value`).textContent = e.target.value + experiments[e.target.id.split('-')[1]].unit;
        }
    });


    // タブ切り替え
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
            dataSection.style.display = tab.id === 'tab-sim' ? 'none' : 'block';
        });
    });
});
