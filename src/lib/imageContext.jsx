import React, { createContext, useContext, useState, useCallback } from 'react';

const ImageContext = createContext(null);

export function ImageProvider({ children }) {
  const [imageData, setImageData] = useState(null);
  const [activeCase, setActiveCase] = useState(null);
  // imageData: { file, url, name, width, height, size, type, arrayBuffer }
  // activeCase: ForensicCase entity object

  const loadImage = useCallback((file) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = {
            file,
            url,
            name: file.name,
            width: img.width,
            height: img.height,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            arrayBuffer: e.target.result,
            imageElement: img,
          };
          setImageData(data);
          resolve(data);
        };
        reader.readAsArrayBuffer(file);
      };
      img.src = url;
    });
  }, []);

  const clearImage = useCallback(() => {
    if (imageData?.url) {
      URL.revokeObjectURL(imageData.url);
    }
    setImageData(null);
  }, [imageData]);

  const openCase = useCallback((forensicCase) => {
    setActiveCase(forensicCase);
    setImageData(null);
  }, []);

  const closeCase = useCallback(() => {
    if (imageData?.url) URL.revokeObjectURL(imageData.url);
    setActiveCase(null);
    setImageData(null);
  }, [imageData]);

  return (
    <ImageContext.Provider value={{ imageData, loadImage, clearImage, activeCase, openCase, closeCase }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImage() {
  const ctx = useContext(ImageContext);
  if (!ctx) throw new Error('useImage must be used within ImageProvider');
  return ctx;
}