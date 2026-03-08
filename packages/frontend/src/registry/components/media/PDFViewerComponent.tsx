import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { LeftOutlined, RightOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';

// PDFViewer component - placeholder for now
const PDFViewerComponent: React.FC<ComponentRenderProps> = ({ props, style, mode }) => {
  const {
    src = '',
    showToolbar = true,
  } = props;

  const isEditMode = mode === 'edit';
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);

  if (isEditMode || !src) {
    return (
      <div style={{
        ...style,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        border: '1px solid #e8e8e8',
        boxSizing: 'border-box',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
        <div style={{ color: '#999', fontSize: 12 }}>PDF 预览区域</div>
        <div style={{ color: '#ccc', fontSize: 11, marginTop: 4 }}>拖入 PDF 文件或输入 URL</div>
      </div>
    );
  }

  return (
    <div style={{ ...style, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', boxSizing: 'border-box' }}>
      {showToolbar && (
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Space>
            <Button
              size="small"
              icon={<LeftOutlined />}
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            />
            <span style={{ fontSize: 12 }}>{page}</span>
            <Button
              size="small"
              icon={<RightOutlined />}
              onClick={() => setPage(p => p + 1)}
            />
          </Space>
          <Space>
            <Button
              size="small"
              icon={<ZoomOutOutlined />}
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            />
            <span style={{ fontSize: 12 }}>{Math.round(scale * 100)}%</span>
            <Button
              size="small"
              icon={<ZoomInOutlined />}
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
            />
          </Space>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: 16 }}>
        {/* PDF.js viewer would go here */}
        <iframe
          src={`${src}#zoom=${Math.round(scale * 100)}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="PDF Viewer"
        />
      </div>
    </div>
  );
};

// PDFViewer component definition
export const PDFViewerDefinition: ComponentDefinition = {
  type: 'PDFViewer',
  name: 'PDF查看',
  category: 'media',
  icon: 'FilePdfOutlined',
  defaultProps: {
    src: '',
    showToolbar: true,
  },
  defaultStyle: {
    width: 500,
    height: 600,
  },
  propertySchema: [
    { key: 'src', label: 'PDF 地址', type: 'expression' },
    { key: 'showToolbar', label: '显示工具栏', type: 'boolean', defaultValue: true },
  ],
  eventDefs: [],
  render: PDFViewerComponent,
};

export default PDFViewerDefinition;
