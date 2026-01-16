import React, { useCallback, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.docx')) {
        onFileSelect(file);
      } else {
        alert('Please drop a .docx file');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="drop-zone"
    >
      {isLoading ? (
        <p>Processing template...</p>
      ) : (
        <>
          <p>Drag and drop a .docx template here</p>
          <p>or</p>
          <label className="file-input-label">
            Browse Files
            <input
              type="file"
              accept=".docx"
              onChange={handleFileInput}
              style={{ display: 'none' }}
              data-testid="file-input"
            />
          </label>
        </>
      )}
    </div>
  );
};
