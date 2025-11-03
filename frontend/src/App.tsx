import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import DragDropUpload from './components/DragDropUpload.tsx';

// 页面组件占位
function Home() {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [aiInfo, setAiInfo] = React.useState<any>(null);
  const handleUpload = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('http://localhost:5000/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setAiInfo(data);
    } catch (e) {
      setAiInfo({ error: '上传失败' });
    }
  };
  return (
    <div className="card" style={{maxWidth: 500, margin: '40px auto'}}>
      <h1>AI试搭镜 - 首页</h1>
      <nav>
        <Link to="/tryon">试穿</Link> |{' '}
        <Link to="/attractiveness">吸引力分析</Link> |{' '}
        <Link to="/history">历史搭配</Link>
      </nav>
      <div style={{marginTop: 24}}>
        <DragDropUpload onUpload={handleUpload} />
        {preview && <img src={preview} alt="预览" style={{maxWidth: 200, marginTop: 16, borderRadius: 8}} />}
        {aiInfo && (
          <div style={{marginTop: 16, background: '#f5f5f5', padding: 12, borderRadius: 8}}>
            {aiInfo.error ? (
              <span style={{color: 'red'}}>{aiInfo.error}</span>
            ) : (
              <>
                <div>AI图片URL: <a href={aiInfo.image_url} target="_blank" rel="noreferrer">{aiInfo.image_url}</a></div>
                <div>face_id: {aiInfo.face_id}</div>
                <div>face_shape: {aiInfo.face_shape}</div>
                <div>beauty_score: {aiInfo.beauty_score}</div>
              </>
            )}
          </div>
        )}
        <p style={{color: '#888'}}>或开启摄像头（开发中）</p>
      </div>
    </div>
  );
}
function TryOn() {
  const [lookImageUrl, setLookImageUrl] = React.useState('');
  const [items, setItems] = React.useState('');
  const [saveResult, setSaveResult] = React.useState<any>(null);
  const [userId] = React.useState('demo_user');
  const [allItems, setAllItems] = React.useState<any[]>([]);
  const [selectedItem, setSelectedItem] = React.useState('');
  React.useEffect(() => {
    fetch('http://localhost:5000/api/recommendations')
      .then(res => res.json())
      .then(data => setAllItems(data));
  }, []);
  const handleSave = async () => {
    const payload = {
      user_id: userId,
      look_image_url: lookImageUrl,
      items: items.split(',').map(s => s.trim()).filter(Boolean),
      timestamp: new Date().toISOString(),
    };
    try {
      const res = await fetch('http://localhost:5000/api/save-look', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSaveResult(data);
    } catch (e) {
      setSaveResult({ error: '保存失败' });
    }
  };
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedItem(e.target.value);
    if (e.target.value) {
      setItems(prev => prev ? prev + ',' + e.target.value : e.target.value);
    }
  };
  return (
    <div className="card" style={{maxWidth: 400, margin: '40px auto'}}>
      <h2>试穿页面 - 保存搭配</h2>
      <div style={{marginBottom: 12}}>
        <label>图片URL：</label>
        <input value={lookImageUrl} onChange={e => setLookImageUrl(e.target.value)} placeholder="如 /static/uploads/xxx.png" />
      </div>
      <div style={{marginBottom: 12}}>
        <label>商品ID（逗号分隔）：</label>
        <input value={items} onChange={e => setItems(e.target.value)} placeholder="如 dress_001,necklace_002" />
      </div>
      <div style={{marginBottom: 12}}>
        <label>选择商品：</label>
        <select value={selectedItem} onChange={handleSelect}>
          <option value="">请选择商品</option>
          {allItems.map(item => (
            <option key={item.item_id} value={item.item_id}>{item.name}</option>
          ))}
        </select>
      </div>
      <button onClick={handleSave}>保存搭配</button>
      {saveResult && (
        <div style={{marginTop: 16, background: '#f5f5f5', padding: 12, borderRadius: 8}}>
          {saveResult.error ? (
            <span style={{color: 'red'}}>{saveResult.error}</span>
          ) : (
            <span>保存成功，look_id: {saveResult.look_id}</span>
          )}
        </div>
      )}
    </div>
  );
}
function Attractiveness() {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [aiInfo, setAiInfo] = React.useState<any>(null);
  const handleUpload = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('http://localhost:5000/api/attractiveness', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setAiInfo(data);
    } catch (e) {
      setAiInfo({ error: '分析失败' });
    }
  };
  return (
    <div className="card" style={{maxWidth: 500, margin: '40px auto'}}>
      <h2>AI吸引力分析</h2>
      <DragDropUpload onUpload={handleUpload} />
      {preview && <img src={preview} alt="预览" style={{maxWidth: 200, marginTop: 16, borderRadius: 8}} />}
      {aiInfo && (
        <div style={{marginTop: 16, background: '#f5f5f5', padding: 12, borderRadius: 8}}>
          {aiInfo.error ? (
            <span style={{color: 'red'}}>{aiInfo.error}</span>
          ) : (
            <>
              <div>颜值评分: {aiInfo.score}</div>
              <div>脸型: {aiInfo.face_shape}</div>
              <div>肤色: {aiInfo.skin_tone}</div>
              <div>推荐风格: {Array.isArray(aiInfo.suggested_style) ? aiInfo.suggested_style.join(', ') : aiInfo.suggested_style}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
function History() {
  const [looks, setLooks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const userId = 'demo_user';
  React.useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/look-history?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        setLooks(data);
        setError(null);
      })
      .catch(() => setError('获取历史失败'))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div style={{maxWidth: 600, margin: '40px auto'}}>
      <h2>历史搭配</h2>
      {loading && <div>加载中...</div>}
      {error && <div style={{color: 'red'}}>{error}</div>}
      {looks.length === 0 && !loading && <div>暂无历史搭配</div>}
      <div>
        {looks.map(look => (
          <div key={look.look_id} style={{marginBottom: 24, background: '#f5f5f5', padding: 12, borderRadius: 8}}>
            <div>look_id: {look.look_id}</div>
            <div>图片: {look.look_image_url && <img src={look.look_image_url} alt="look" style={{maxWidth: 120, verticalAlign: 'middle'}} />}</div>
            <div>商品ID: {Array.isArray(look.items) ? look.items.join(', ') : String(look.items)}</div>
            <div>时间: {look.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tryon" element={<TryOn />} />
        <Route path="/attractiveness" element={<Attractiveness />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;
