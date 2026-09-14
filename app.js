
const { useState } = React;

function App() {
  const [entryDate] = useState('2026/09/15');
  const [units, setUnits] = useState([
    { id: 'power', label: '電源ユニット', model: 'JPMC-PSD3012N', serial: '', axis: '', remarks: '' },
    { id: 'cpu', label: 'CPU', model: 'JPMC-CP3202N-E', serial: '', axis: '', remarks: '' },
    { id: 'base', label: 'ベースユニット', model: 'JPMC-BUB3008N-E', serial: '', axis: '', remarks: '' },
    { id: 'lio', label: 'LIO-04', model: 'JPMC-IO2303-E', serial: '', axis: '', remarks: '' }
  ]);
  const [servoPacks, setServoPacks] = useState([
    { id: 'servo_1', label: 'サーボパック 1', model: '', serial: '', axis: '', remarks: '' }
  ]);
  const [currentStep, setCurrentStep] = useState(0); // 0: Home, 1-4: Units, 5+: ServoPacks

  // データクリア機能（日付は保持）
  const handleClearData = () => {
    setUnits(units.map(u => ({ ...u, serial: '', axis: '', remarks: '' })));
    setServoPacks([{ id: 'servo_1', label: 'サーボパック 1', model: '', serial: '', axis: '', remarks: '' }]);
    setCurrentStep(0);
    alert('入力データをクリアしました（記入日は保持されます）。');
  };

  const handleServoChange = (index, field, value) => {
    const updated = [...servoPacks];
    updated[index][field] = value;
    setServoPacks(updated);
  };

  const handleAddServo = () => {
    const newPack = {
      id: `servo_${Date.now()}`,
      label: `サーボパック ${servoPacks.length + 1}`,
      model: '',
      serial: '',
      axis: '',
      remarks: ''
    };
    setServoPacks([...servoPacks, newPack]);
  };

  const handleRemoveServo = (index) => {
    if (servoPacks.length <= 1) return;
    const updated = servoPacks.filter((_, i) => i !== index);
    setServoPacks(updated);
  };

  // ダッシュボード（スタート画面）
  if (currentStep === 0) {
    return (
      <div className="min-h-screen p-6 flex flex-col justify-between max-w-md mx-auto">
        <div className="text-center pt-8">
          <h1 className="text-2xl font-bold tracking-wider mb-2">QuickScan DB</h1>
          <p className="text-xs text-[#E6DAA6]/60">記入日: {entryDate}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentStep(1)}
            className="w-full bg-[#F5D887] text-[#042219] font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-[#e0c476]"
          >
            スキャン・入力を開始
          </button>
        </div>

        <div className="pb-8">
          <button
            onClick={handleClearData}
            className="w-full border border-red-500/50 text-red-400 py-3 rounded-lg text-sm hover:bg-red-950/20"
          >
            入力情報をクリア
          </button>
        </div>
      </div>
    );
  }

  // サーボパック入力画面
  const servoIndex = currentStep - 5;
  const currentPack = servoPacks[servoIndex];

  return (
    <div className="min-h-screen p-4 flex flex-col justify-between max-w-md mx-auto">
      <div>
        <div className="flex justify-between items-center text-sm mb-4">
          <button onClick={() => setCurrentStep(currentStep - 1)} className="text-[#E6DAA6]/80">← 前へ</button>
          <span className="text-xs font-mono">{currentStep} / {4 + servoPacks.length}</span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">{currentPack.label}</h2>
          <p className="text-xs text-[#E6DAA6]/60">サーボパック情報のスキャン・入力</p>
        </div>

        <div className="space-y-4">
          {[
            { key: 'model', label: '製品型式' },
            { key: 'serial', label: 'シリアルNo' },
            { key: 'axis', label: '軸名称' },
            { key: 'remarks', label: '備考' }
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs mb-1">{label}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentPack[key]}
                  onChange={(e) => handleServoChange(servoIndex, key, e.target.value)}
                  placeholder="入力またはスキャン"
                  className="flex-1 bg-[#093325] border border-[#E6DAA6]/30 rounded-lg px-3 py-2 text-sm text-[#E6DAA6]"
                />
                <button
                  onClick={() => handleServoChange(servoIndex, key, `SN-${Math.floor(100000 + Math.random() * 900000)}`)}
                  className="bg-[#093325] border border-[#E6DAA6]/40 rounded-lg px-3 py-2"
                >
                  📷
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleAddServo}
            className="flex-1 border border-dashed border-[#E6DAA6]/60 text-[#E6DAA6] rounded-lg py-2.5 text-sm"
          >
            ＋ サーボパックを追加
          </button>
          {servoPacks.length > 1 && (
            <button
              onClick={() => handleRemoveServo(servoIndex)}
              className="border border-red-500/40 text-red-400 rounded-lg px-3 py-2.5 text-sm"
            >
              削除
            </button>
          )}
        </div>
      </div>

      <div className="pt-6">
        <button
          onClick={() => {
            if (servoIndex < servoPacks.length - 1) {
              setCurrentStep(currentStep + 1);
            } else {
              alert('全入力完了：プレビュー画面へ遷移します');
            }
          }}
          className="w-full bg-[#F5D887] text-[#042219] font-bold py-3.5 rounded-full text-base"
        >
          {servoIndex < servoPacks.length - 1 ? '次のサーボパックへ' : 'プレビューへ'}
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
