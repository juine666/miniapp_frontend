// 拖拽上传图片组件，支持拖拽和点击上传
import React, { useCallback, useRef, useState } from 'react';

interface DragDropUploadProps {
  onUpload: (file: File) => void;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  }, [onUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleClick = () => {
    inputRef.current?.click();
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      style={{
        border: dragActive ? '2px solid #1976d2' : '2px dashed #aaa',
        padding: 32,
        textAlign: 'center',
        borderRadius: 12,
        background: dragActive ? '#e3f2fd' : '#fafafa',
        cursor: 'pointer',
        margin: '24px 0',
      }}
    >
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        ref={inputRef}
        onChange={handleChange}
      />
      拖拽图片到此处上传，或点击选择图片
    </div>
  );
};

export default DragDropUpload; 