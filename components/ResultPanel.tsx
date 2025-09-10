// Fix: Restored file content to resolve parsing errors caused by file corruption.
import React from 'react';
import type { GeneratedImage, AppMode } from '../types';
import { EyeIcon, DownloadIcon, ExpandIcon, ZoomOutIcon, PaperClipIcon, EraseIcon, PaintBrushIcon, SendToStartFrameIcon, SendToEndFrameIcon } from './Icon';
import { downloadImage, formatFileSize } from '../utils';
import { EXAMPLE_PROMPTS } from '../constants';

interface ResultPanelProps {
  appMode: AppMode;
  images: GeneratedImage[];
  isLoading: boolean;
  error: string | null;
  onPromptSelect: (prompt: string) => void;
  onUpscale: (src: string) => void;
  onZoomOut: (item: GeneratedImage) => void;
  onSetLightboxConfig: (images: GeneratedImage[], startIndex: number) => void;
  onUseImage: (image: GeneratedImage, action: 'reference' | 'remove_bg' | 'draw_bg') => void;
  onSendImageToVeo: (image: GeneratedImage, frame: 'start' | 'end') => void;
  onUe5Upgrade?: (image: GeneratedImage) => void;
}

const ImageCard: React.FC<{
    image: GeneratedImage;
    index: number;
    images: GeneratedImage[];
    appMode: AppMode;
    onUpscale: (src: string) => void;
    onZoomOut: (item: GeneratedImage) => void;
    onSetLightboxConfig: (images: GeneratedImage[], startIndex: number) => void;
    onUseImage: (image: GeneratedImage, action: 'reference' | 'remove_bg' | 'draw_bg') => void;
    onSendImageToVeo: (image: GeneratedImage, frame: 'start' | 'end') => void;
    onUe5Upgrade?: (image: GeneratedImage) => void;
}> = ({ image, index, images, appMode, onUpscale, onZoomOut, onSetLightboxConfig, onUseImage, onSendImageToVeo, onUe5Upgrade }) => {
    
    const handleDownload = () => {
        const safeFilename = (image.prompt || image.alt).replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_').toLowerCase();
        downloadImage(image.src, `${safeFilename.slice(0, 30)}.png`);
    };

    return (
        <div className="relative group aspect-square bg-black rounded-lg themed-panel cyber-glow-corners">
            <img src={image.src} alt={image.alt} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <p className="text-xs text-center text-slate-300 mb-3 max-h-12 overflow-hidden">{image.alt}</p>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => onUseImage(image, 'reference')} title="作為參考圖" className="p-2 text-white themed-button-secondary rounded-full"> <PaperClipIcon className="w-5 h-5" /> </button>
                    <button onClick={() => onUseImage(image, 'remove_bg')} title="移除背景" className="p-2 text-white themed-button-secondary rounded-full"> <EraseIcon className="w-5 h-5" /> </button>
                    <button onClick={() => onUseImage(image, 'draw_bg')} title="設為畫布背景" className="p-2 text-white themed-button-secondary rounded-full"> <PaintBrushIcon className="w-5 h-5" /> </button>
                    <button onClick={handleDownload} title="下載圖片" className="p-2 text-white themed-button-secondary rounded-full"> <DownloadIcon className="w-5 h-5" /> </button>
                    <button onClick={() => onSetLightboxConfig(images, index)} title="放大檢視" className="p-2 text-white themed-button-secondary rounded-full"> <EyeIcon className="w-5 h-5" /> </button>
                    <button onClick={() => onUpscale(image.src)} title="提升畫質" className="p-2 text-white themed-button-secondary rounded-full"> <ExpandIcon className="w-5 h-5" /> </button>
                    <button onClick={() => onZoomOut(image)} title="Zoom out 2x" className="p-2 text-white themed-button-secondary rounded-full"> <ZoomOutIcon className="w-5 h-5" /> </button>
                    <button onClick={() => onSendImageToVeo(image, 'start')} title="用於首幀" className="p-2 text-white themed-button-secondary rounded-full"> <SendToStartFrameIcon className="w-5 h-5" /> </button>
                    {appMode === 'NIGHT_CITY_LEGENDS' && onUe5Upgrade ? (
                        <button onClick={() => onUe5Upgrade(image)} title="升級為 UE5 真實感" className="p-2 text-white themed-button-secondary rounded-full flex items-center justify-center">
                           <span className="font-bold text-xs">UE5</span>
                        </button>
                    ) : (
                         <button onClick={() => onSendImageToVeo(image, 'end')} title="用於尾幀" className="p-2 text-white themed-button-secondary rounded-full"> <SendToEndFrameIcon className="w-5 h-5" /> </button>
                    )}
                </div>
            </div>
            {image.width && image.height && image.size && (
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                    {image.aspectRatio && `${image.aspectRatio} | `}{image.width}x{image.height} | {formatFileSize(image.size)}
                </div>
            )}
        </div>
    );
};


export const ResultPanel: React.FC<ResultPanelProps> = ({ appMode, images, isLoading, error, onPromptSelect, onUpscale, onZoomOut, onSetLightboxConfig, onUseImage, onSendImageToVeo, onUe5Upgrade }) => {

  const hasContent = images.length > 0 || isLoading || error;
  
  const getGridClass = (imageCount: number) => {
    if (imageCount <= 0) return '';
    if (imageCount === 1) return 'grid-cols-1';
    if (imageCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (imageCount === 3) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    if (imageCount === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    // For 5 or more, use the fully responsive 5-col max grid
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
  };

  return (
    <main className="flex-1 flex flex-col p-2 md:p-4 bg-transparent min-w-0 overflow-y-auto cyber-glow-corners">
      {hasContent ? (
        <div className="flex-1 relative">
          {isLoading && (
            <>
              {appMode === 'NIGHT_CITY_LEGENDS' ? (
                <div className="ncl-loading-container">
                    <div className="ncl-loading-text">幻夢製造中......</div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                  <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-fuchsia-500 mb-4"></div>
                  <p className="text-lg font-semibold text-white">圖片生成中...</p>
                </div>
              )}
            </>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="themed-panel border-red-500 text-red-300 p-4 rounded-lg text-center">
                <h3 className="font-bold mb-2">發生錯誤</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          {images.length > 0 && (
            <div className={`grid ${getGridClass(images.length)} gap-4`}>
              {images.map((image, index) => (
                <ImageCard 
                    key={image.id} 
                    image={image}
                    index={index}
                    images={images}
                    appMode={appMode}
                    onUpscale={onUpscale} 
                    onZoomOut={onZoomOut} 
                    onSetLightboxConfig={onSetLightboxConfig}
                    onUseImage={onUseImage}
                    onSendImageToVeo={onSendImageToVeo}
                    onUe5Upgrade={onUe5Upgrade}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 p-4">
            <img 
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAEgCAYAAADCPMtRAAAKQ2l7wAAAAASUVORK5CYII="
                alt="鳥巢AI包娜娜 Logo" 
                className="w-[512] h-[288]4 mb-6" 
            />
          <h2 className="text-2xl font-bold mb-2 text-white themed-text-glow"><a href="https://aiarttw.us/nano" target="_blank">來夜城，鳥巢幫你裝上腦機，創造幻夢吧～</a></h2>
          <p className="max-w-md mb-6 text-slate-500 text-xl themed-text-glow"><a href="https://aiarttw.us/nano" target="_blank">***官方主題曲***</a></p>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => onPromptSelect(prompt)}
                className="px-4 py-2 text-sm rounded-full transition-colors themed-button-secondary"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};