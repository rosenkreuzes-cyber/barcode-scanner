<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#042219" />
  <title>シリアル記入シート - QuickScan DB</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- ZXingライブラリ（バーコードスキャン用） -->
  <script src="https://unpkg.com/@zxing/library@latest"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #042219;
      color: #E6DAA6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    input { color-scheme: dark; text-transform: uppercase; }

    /* A4縦サイズ1ページに確実に完全収容し、2ページ目を完全に排除する印刷設定 */
    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body {
        background: white !important;
        color: black !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      .no-print { display: none !important; }
      .print-area {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        background: white !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
      }
      th, td {
        border: 1px solid #000 !important;
        padding: 2px 4px !important;
        font-size: 9.5px !important;
        line-height: 1.1 !important;
        color: black !important;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      th { background-color: #f2f2f2 !important; }
      @page {
        size: A4 portrait;
        margin: 4mm;
      }
    }
  </style>
</head>
<body class="p-3 max-w-xl mx-auto w-full">

  <!-- 隠しファイル入力（CSV読込用） -->
  <input type="file" id="csvFileInput" accept=".csv" class="hidden" onchange="loadCSVFile(event)" />

  <!-- TOP画面（基本情報） -->
  <div id="view-home" class="space-y-4">
    <h1 class="text-3xl font-extrabold text-center text-[#F5D887] mt-2">QuickScan DB</h1>
    <p class="text-sm text-center text-[#E6DAA6]/80">基本情報設定</p>

    <div class="bg-[#093325] border border-[#E6DAA6]/30 p-4 rounded-2xl space-y-3 shadow-lg">
      <div>
        <button type="button" onclick="document.getElementById('csvFileInput').click()" class="w-full bg-[#093325] border-2 border-[#00ffcc] text-[#00ffcc] font-bold py-3 rounded-xl text-base shadow-md cursor-pointer">
          📂 保存済みCSVを読み込んで編集・追記
        </button>
      </div>
    </div>

    <div class="bg-[#093325] border border-[#E6DAA6]/30 p-4 rounded-2xl space-y-3 shadow-lg">
      <div>
        <label class="block text-sm font-bold mb-1">製造指図書No</label>
        <input type="text" id="docNo" placeholder="例: ORD-2026-X" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base uppercase" />
      </div>
      <div>
        <label class="block text-sm font-bold mb-1">機種名</label>
        <input type="text" id="modelName" placeholder="例: MODEL-A100" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base uppercase" />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block text-sm font-bold mb-1">記入日</label>
          <input type="text" id="entryDate" readonly class="w-full bg-[#042219]/50 border border-[#E6DAA6]/20 rounded-xl px-3 py-2.5 text-base opacity-70" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-bold mb-1">客先名</label>
          <input type="text" id="customer" placeholder="客先名" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base uppercase" />
        </div>
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block text-sm font-bold mb-1">号機No</label>
          <input type="number" id="unitNo" placeholder="1" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-bold mb-1">発注台数</label>
          <input type="number" id="orderQty" placeholder="1" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-bold mb-1">エレキ担当</label>
        <input type="text" id="elecStaff" placeholder="担当者名" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base uppercase" />
      </div>
    </div>

    <button type="button" onclick="goToInput()" class="w-full bg-[#F5D887] text-[#042219] font-bold py-4 rounded-full text-lg shadow-xl mt-4 cursor-pointer">入力を開始 (電源ユニットへ)</button>
  </div>

  <!-- ユニット入力画面 -->
  <div id="view-input" class="hidden space-y-3">
    <div class="flex justify-between items-center text-base text-[#E6DAA6] font-bold">
      <button type="button" onclick="prevStep()" class="hover:underline cursor-pointer">← 前へ</button>
      <span id="step-indicator">1 / 5</span>
      <button type="button" onclick="goToTop()" class="hover:underline text-[#F5D887] cursor-pointer">🏠 TOP</button>
    </div>

    <h2 id="unit-title" class="text-2xl font-bold text-center text-[#F5D887]">電源ユニット 画面</h2>

    <div class="w-full text-center mb-2">
      <!-- バーコードスキャン用ビデオプレビュー -->
      <div class="relative w-full h-56 bg-black overflow-hidden flex items-center justify-center mb-2 rounded-xl">
        <video id="video" playsInline class="w-full h-full object-cover"></video>
        <span id="cam-status" class="absolute bottom-2 text-xs bg-black/70 px-3 py-1 rounded text-[#00ffcc] font-mono font-bold">バーコードリーダー停止中</span>
      </div>
      <div class="flex gap-2">
        <button type="button" id="btn-cam" onclick="toggleScanner()" class="w-full bg-[#093325] border-2 border-[#00ffcc] text-[#00ffcc] font-bold py-3 rounded-xl text-base cursor-pointer">📷 バーコードスキャン起動</button>
      </div>
    </div>

    <div class="bg-[#093325] border border-[#E6DAA6]/30 p-4 rounded-2xl space-y-3 shadow-lg">
      <div id="title-field-wrap" class="hidden">
        <label class="block text-sm mb-1 font-bold">機器名称</label>
        <input type="text" id="f-title" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base uppercase" placeholder="例: サーボパック" />
      </div>
      <div>
        <label class="block text-sm mb-1 font-bold">製品型式</label>
        <input type="text" id="f-model" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base uppercase" placeholder="型式" />
      </div>
      <div>
        <label class="block text-sm mb-1 font-bold">シリアルNo</label>
        <input type="text" id="f-serial" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base uppercase" placeholder="シリアル" />
      </div>
      <div>
        <label class="block text-sm mb-1 font-bold">備考 (バージョン情報等)</label>
        <input type="text" id="f-remarks" class="w-full bg-[#042219] border border-[#E6DAA6]/40 rounded-xl px-3 py-2.5 text-base uppercase" placeholder="例: A03" />
      </div>
    </div>

    <!-- 機器追加ボタン（LIO-04含む3番目以降の画面で常時表示） -->
    <div id="add-btn-wrap" class="hidden">
      <button type="button" onclick="addDevice()" class="w-full border border-dashed border-[#00ffcc] text-[#00ffcc] py-3 rounded-xl text-base font-bold bg-[#00ffcc]/10 shadow-md cursor-pointer">＋ 機器追加 (各種機器画面へ)</button>
    </div>

    <button type="button" onclick="nextStep()" class="w-full bg-[#F5D887] text-[#042219] font-bold py-4 rounded-full text-lg shadow-lg cursor-pointer">次へ</button>
  </div>

  <!-- 印刷プレビュー画面 -->
  <div id="view-result" class="hidden space-y-2">
    <div class="no-print flex flex-wrap justify-between items-center gap-2 mb-2">
      <button type="button" onclick="goToInput()" class="text-[#E6DAA6] font-bold cursor-pointer">← 修正に戻る</button>
      <div class="flex gap-2">
        <button type="button" onclick="document.getElementById('csvFileInput').click()" class="bg-[#093325] border border-[#E6DAA6] text-[#E6DAA6] font-bold px-3 py-2 rounded-full text-sm cursor-pointer">📂 読込</button>
        <button type="button" onclick="saveCSV()" class="bg-[#093325] border border-[#00ffcc] text-[#00ffcc] font-bold px-4 py-2 rounded-full text-sm cursor-pointer">💾 CSV保存</button>
        <button type="button" onclick="triggerPrint()" class="bg-[#F5D887] text-[#042219] font-bold px-4 py-2 rounded-full text-sm shadow-md cursor-pointer">🖨 印刷</button>
      </div>
    </div>

    <!-- 1ページに確実収容する印刷・プレビューエリア -->
    <div class="print-area bg-white text-black p-1.5 rounded-lg shadow-xl w-full">
      <h1 class="text-center font-bold text-sm mb-1 border-b border-black pb-0.5">シリアル記入シート</h1>
      <table class="w-full text-[10px] border-collapse border border-black mb-1 table-fixed">
        <tbody>
          <tr>
            <th class="border border-black p-0.5 bg-gray-100 w-20">製造指図書No</th>
            <td id="p-docNo" class="border border-black p-0.5 font-bold truncate"></td>
            <th class="border border-black p-0.5 bg-gray-100 w-14">客先名</th>
            <td id="p-customer" class="border border-black p-0.5 truncate"></td>
          </tr>
          <tr>
            <th class="border border-black p-0.5 bg-gray-100">機種名</th>
            <td id="p-modelName" class="border border-black p-0.5 font-bold truncate"></td>
            <th class="border border-black p-0.5 bg-gray-100">号機No</th>
            <td id="p-unitNo" class="border border-black p-0.5 truncate"></td>
          </tr>
          <tr>
            <th class="border border-black p-0.5 bg-gray-100">記入日</th>
            <td id="p-entryDate" class="border border-black p-0.5 truncate"></td>
            <th class="border border-black p-0.5 bg-gray-100">発注台数</th>
            <td id="p-orderQty" class="border border-black p-0.5 truncate"></td>
          </tr>
          <tr>
            <th class="border border-black p-0.5 bg-gray-100" colspan="2"></th>
            <th class="border border-black p-0.5 bg-gray-100">エレキ担当</th>
            <td id="p-elecStaff" class="border border-black p-0.5 truncate"></td>
          </tr>
        </tbody>
      </table>

      <table class="w-full text-[10px] border-collapse border border-black table-fixed">
        <thead>
          <tr class="bg-gray-200">
            <th class="border border-black p-0.5 text-center w-6">No</th>
            <th class="border border-black p-0.5 w-[28%]">製品型式</th>
            <th class="border border-black p-0.5 w-[28%]">シリアルNo</th>
            <th class="border border-black p-0.5 w-[18%]">機器名称</th>
            <th class="border border-black p-0.5">備考</th>
          </tr>
        </thead>
        <tbody id="p-tbody"></tbody>
      </table>
    </div>
  </div>

  <script>
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    let items = [
      { title: '電源ユニット', model: '', serial: '', remarks: '' },
      { title: 'CPU', model: '', serial: '', remarks: '' },
      { title: 'ベースユニット', model: '', serial: '', remarks: '' },
      { title: 'LIO-04', model: '', serial: '', remarks: '' }
    ];
    let currentStep = 0;
    let isStarted = false;
    let codeReader = null;
    let isScanning = false;

    try {
      if (typeof ZXing !== 'undefined') {
        codeReader = new ZXing.BrowserBarcodeReader();
      }
    } catch(e) {}

    function saveCurrentForm() {
      if (isStarted && currentStep >= 0 && currentStep < items.length && currentStep !== 999) {
        const m = document.getElementById('f-model');
        const s = document.getElementById('f-serial');
        const r = document.getElementById('f-remarks');
        if (m) items[currentStep].model = m.value.toUpperCase();
        if (s) items[currentStep].serial = s.value.toUpperCase();
        if (r) items[currentStep].remarks = r.value.toUpperCase();
        if (currentStep >= 4) {
          const t = document.getElementById('f-title');
          if (t) items[currentStep].title = t.value.toUpperCase();
        }
      }
    }

    function render() {
      const viewHome = document.getElementById('view-home');
      const viewInput = document.getElementById('view-input');
      const viewResult = document.getElementById('view-result');

      if (!viewHome || !viewInput || !viewResult) return;

      viewHome.classList.add('hidden');
      viewInput.classList.add('hidden');
      viewResult.classList.add('hidden');

      stopScanner();

      if (!isStarted) {
        viewHome.classList.remove('hidden');
      } else if (currentStep !== 999) {
        viewInput.classList.remove('hidden');
        const item = items[currentStep];
        document.getElementById('unit-title').innerText = currentStep >= 4 ? `各種機器 ${currentStep - 3} 画面` : `${item.title} 画面`;
        document.getElementById('step-indicator').innerText = `${currentStep + 1} / ${items.length}`;
        
        document.getElementById('f-model').value = item.model || '';
        document.getElementById('f-serial').value = item.serial || '';
        document.getElementById('f-remarks').value = item.remarks || '';

        const titleWrap = document.getElementById('title-field-wrap');
        const addBtnWrap = document.getElementById('add-btn-wrap');

        if (currentStep >= 4) {
          titleWrap.classList.remove('hidden');
          document.getElementById('f-title').value = item.title || '';
        } else {
          titleWrap.classList.add('hidden');
        }

        if (currentStep >= 3) {
          addBtnWrap.classList.remove('hidden');
        } else {
          addBtnWrap.classList.add('hidden');
        }

        const camBtn = document.getElementById('btn-cam');
        if(camBtn) camBtn.innerText = "📷 バーコードスキャン起動";
        const camStatus = document.getElementById('cam-status');
        if(camStatus) camStatus.innerText = "バーコードリーダー停止中";
      } else {
        viewResult.classList.remove('hidden');
        document.getElementById('p-docNo').innerText = document.getElementById('docNo').value.toUpperCase();
        document.getElementById('p-customer').innerText = document.getElementById('customer').value.toUpperCase();
        document.getElementById('p-modelName').innerText = document.getElementById('modelName').value.toUpperCase();
        document.getElementById('p-unitNo').innerText = document.getElementById('unitNo').value;
        document.getElementById('p-entryDate').innerText = document.getElementById('entryDate').value;
        document.getElementById('p-orderQty').innerText = document.getElementById('orderQty').value;
        document.getElementById('p-elecStaff').innerText = document.getElementById('elecStaff').value.toUpperCase();

        let tbody = document.getElementById('p-tbody');
        if (tbody) {
          tbody.innerHTML = '';
          for (let i = 0; i < 25; i++) {
            const rowData = items[i] || { model: '', serial: '', title: '', remarks: '' };
            const displayTitle = rowData.title || (i < 4 ? items[i].title : '');
            tbody.innerHTML += `
              <tr class="h-[15px]">
                <td class="border border-black text-center font-bold bg-gray-50">${i + 1}</td>
                <td class="border border-black px-1 font-bold truncate">${rowData.model}</td>
                <td class="border border-black px-1 font-bold truncate">${rowData.serial}</td>
                <td class="border border-black px-1 truncate">${displayTitle}</td>
                <td class="border border-black px-1 truncate">${rowData.remarks}</td>
              </tr>
            `;
          }
        }
      }
    }

    function goToTop() {
      saveCurrentForm();
      currentStep = 0;
      isStarted = false;
      stopScanner();
      render();
    }

    function goToInput() {
      saveCurrentForm();
      currentStep = 0;
      isStarted = true;
      stopScanner();
      render();
    }

    function nextStep() {
      saveCurrentForm();
      if (currentStep < items.length - 1) {
        currentStep++;
      } else {
        currentStep = 999;
      }
      stopScanner();
      render();
    }

    function prevStep() {
      saveCurrentForm();
      if (currentStep > 0) {
        currentStep--;
        stopScanner();
        render();
      } else {
        goToTop();
      }
    }

    function addDevice() {
      saveCurrentForm();
      items.push({ title: '各種機器', model: '', serial: '', remarks: '' });
      currentStep = items.length - 1;
      stopScanner();
      render();
    }

    function triggerPrint() {
      setTimeout(() => {
        window.print();
      }, 100);
    }

    // ZXingを使ったリアルタイム・バーコードスキャンの起動／停止切替
    async function toggleScanner() {
      const status = document.getElementById('cam-status');
      const btn = document.getElementById('btn-cam');

      if (isScanning) {
        stopScanner();
        if(btn) btn.innerText = "📷 バーコードスキャン起動";
        if(status) status.innerText = "バーコードリーダー停止中";
        return;
      }

      if (!codeReader) {
        try {
          codeReader = new ZXing.BrowserBarcodeReader();
        } catch(e) {
          alert('バーコードリーダーを初期化できませんでした。');
          return;
        }
      }

      try {
        if(status) status.innerText = "🔍 カメラ起動中・読取待機中...";
        isScanning = true;
        if(btn) btn.innerText = "⏹ スキャン停止";

        // カメラ映像をvideo要素に流し込みながらバーコードをデコード
        codeReader.decodeFromVideoDevice(undefined, 'video', (result, err) => {
          if (result) {
            const scannedText = result.text.trim().toUpperCase();
            if(status) status.innerText = `✨ 読取成功: ${scannedText}`;

            // 空いているフィールド（優先的にシリアルNo、空いていなければ製品型式）へ自動セット
            const serialInput = document.getElementById('f-serial');
            const modelInput = document.getElementById('f-model');

            if (serialInput && !serialInput.value) {
              serialInput.value = scannedText;
            } else if (modelInput && !modelInput.value) {
              modelInput.value = scannedText;
            } else {
              serialInput.value = scannedText; // デフォルトでシリアルに上書き
            }

            saveCurrentForm();
            
            // 読み取ったら一度スキャンを停止してビープ音の代わりの通知
            stopScanner();
            if(btn) btn.innerText = "📷 バーコードスキャン起動";
          }
        });
      } catch (e) {
        isScanning = false;
        if(btn) btn.innerText = "📷 バーコードスキャン起動";
        if(status) status.innerText = "カメラ起動エラー";
        alert('カメラを起動できませんでした。権限をご確認ください。');
      }
    }

    function stopScanner() {
      if (codeReader) {
        try {
          codeReader.reset();
        } catch(e) {}
      }
      isScanning = false;
    }

    function loadCSVFile(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);
          const clean = (val) => val ? val.replace(/^"|"$/g, '').trim().toUpperCase() : '';

          lines.forEach(line => {
            const cols = line.split(',').map(clean);
            if (cols[0].includes('製造指図書')) {
              document.getElementById('docNo').value = cols[1] || '';
              document.getElementById('customer').value = cols[3] || '';
            } else if (cols[0] === '機種名') {
              document.getElementById('modelName').value = cols[1] || '';
              document.getElementById('unitNo').value = cols[3] || '';
            } else if (cols[0] === '記入日') {
              document.getElementById('entryDate').value = cols[1] || document.getElementById('entryDate').value;
              document.getElementById('orderQty').value = cols[3] || '';
            } else if (cols[2] === 'エレキ担当') {
              document.getElementById('elecStaff').value = cols[3] || '';
            }
          });

          const headerIdx = lines.findIndex(l => l.includes('No,製品型式') || l.includes('NO,製品型式'));
          if (headerIdx !== -1) {
            const itemLines = lines.slice(headerIdx + 1);
            let newItems = [
              { title: '電源ユニット', model: '', serial: '', remarks: '' },
              { title: 'CPU', model: '', serial: '', remarks: '' },
              { title: 'ベースユニット', model: '', serial: '', remarks: '' },
              { title: 'LIO-04', model: '', serial: '', remarks: '' }
            ];

            itemLines.forEach((line, idx) => {
              if (idx >= 25) return;
              const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
              const cols = match ? match.map(clean) : [];
              const no = parseInt(cols[0], 10);
              if (isNaN(no)) return;

              const rowData = {
                model: cols[1] || '',
                serial: cols[2] || '',
                title: cols[3] || '',
                remarks: cols[4] || ''
              };

              if (no >= 1 && no <= 4) {
                newItems[no - 1].model = rowData.model;
                newItems[no - 1].serial = rowData.serial;
                newItems[no - 1].remarks = rowData.remarks;
              } else if (no >= 5) {
                if (rowData.model || rowData.serial || rowData.title || rowData.remarks) {
                  newItems.push({
                    title: rowData.title || '各種機器',
                    model: rowData.model,
                    serial: rowData.serial,
                    remarks: rowData.remarks
                  });
                }
              }
            });
            items = newItems;
          }
          alert('CSVファイルからデータを復元しました！');
          document.getElementById('csvFileInput').value = '';
        } catch (err) {
          alert('CSVファイルの読み込みに失敗しました。');
        }
      };
      reader.readAsText(file, 'UTF-8');
    }

    function saveCSV() {
      saveCurrentForm();
      const docNo = document.getElementById('docNo').value.toUpperCase();
      const modelName = document.getElementById('modelName').value.toUpperCase();
      const unitNo = document.getElementById('unitNo').value || '1';
      const filename = `${yy}${mm}${dd}_${modelName || '機種'}_${docNo || '指図書'}_${unitNo}.csv`;

      let csv = "\uFEFF";
      csv += `製造指図書No,${docNo},客先名,${document.getElementById('customer').value.toUpperCase()}\n`;
      csv += `機種名,${modelName},号機No,${unitNo}\n`;
      csv += `記入日,${document.getElementById('entryDate').value},発注台数,${document.getElementById('orderQty').value}\n`;
      csv += `,,エレキ担当,${document.getElementById('elecStaff').value.toUpperCase()}\n\n`;
      csv += `No,製品型式,シリアルNo,機器名称,備考\n`;

      for (let i = 0; i < 25; i++) {
        const it = items[i] || { model: '', serial: '', title: '', remarks: '' };
        const titleVal = it.title || (i < 4 ? items[i].title : '');
        csv += `${i+1},"${it.model}","${it.serial}","${titleVal}","${it.remarks}"\n`;
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    window.addEventListener('DOMContentLoaded', () => {
      const entryDateEl = document.getElementById('entryDate');
      if (entryDateEl) {
        entryDateEl.value = `${now.getFullYear()}/${mm}/${dd}`;
      }
      render();
    });
  </script>
</body>
</html>
