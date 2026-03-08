import React, { useState, useCallback } from 'react';
import { Input, Tooltip } from 'antd';
import { CodeOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ExpressionInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

// Check if a string contains an expression pattern {{...}}
const containsExpression = (str: string): boolean => {
  return /\{\{.*?\}\}/.test(str);
};

const ExpressionInput: React.FC<ExpressionInputProps> = ({
  value = '',
  onChange,
  placeholder = '输入文本或 {{ expression }}',
  rows = 2,
  disabled = false,
}) => {
  const [isExpressionMode, setIsExpressionMode] = useState(containsExpression(value));

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);

    // Auto-detect expression mode based on content
    if (!isExpressionMode && containsExpression(newValue)) {
      setIsExpressionMode(true);
    }
  }, [onChange, isExpressionMode]);

  const toggleMode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpressionMode(!isExpressionMode);
  }, [isExpressionMode]);

  // Render input with expression highlighting (simplified - just show the value)
  const renderInput = () => {
    if (isExpressionMode) {
      // Expression mode - treat as single expression
      const expr = value.replace(/^\{\{|\}\}$/g, '').trim();
      return (
        <Input
          value={expr}
          onChange={(e) => onChange?.(`{{${e.target.value}}}`)}
          placeholder="输入表达式，如: queries.getUsers.data"
          disabled={disabled}
          prefix={<span style={{ color: '#1677ff', fontWeight: 'bold' }}>{'{{'}</span>}
          suffix={<span style={{ color: '#1677ff', fontWeight: 'bold' }}>{'}'}</span>}
        />
      );
    }

    // Normal mode - can mix text and expressions
    return (
      <TextArea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {renderInput()}
      <Tooltip title="切换表达式模式">
        <CodeOutlined
          onClick={toggleMode}
          style={{
            position: 'absolute',
            right: 8,
            top: rows > 1 ? 8 : 0,
            cursor: 'pointer',
            color: isExpressionMode ? '#1677ff' : '#999',
            zIndex: 1,
          }}
          onMouseDown={(e) => e.preventDefault()}
        />
      </Tooltip>
    </div>
  );
};

export default ExpressionInput;
