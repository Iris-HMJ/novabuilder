import { useParams } from 'react-router-dom';
import QueryPanel from '../components/QueryPanel';

const AppEditor = () => {
  const { appId } = useParams<{ appId: string }>();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 画布区域 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧组件面板 */}
        <div
          style={{
            width: 200,
            background: '#fff',
            borderRight: '1px solid #e8e8e8',
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 12 }}>组件面板</div>
          <div style={{ color: '#888', fontSize: 12 }}>
            (Step 6 可视化编辑器正在开发中)
          </div>
        </div>

        {/* 画布 */}
        <div
          style={{
            flex: 1,
            background: '#f5f5f5',
            backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: '#888' }}>画布区域 (Step 6 可视化编辑器正在开发中)</div>
        </div>

        {/* 右侧属性面板 */}
        <div
          style={{
            width: 280,
            background: '#fff',
            borderLeft: '1px solid #e8e8e8',
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 12 }}>属性面板</div>
          <div style={{ color: '#888', fontSize: 12 }}>
            (选择组件后显示属性)
          </div>
        </div>
      </div>

      {/* 查询面板 */}
      {appId && <QueryPanel appId={appId} />}
    </div>
  );
};

export default AppEditor;
