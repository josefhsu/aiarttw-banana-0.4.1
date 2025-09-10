import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import type { AppMode, UploadedImage, DrawTool, AspectRatio, VeoAspectRatio, Toast } from '../types';
import {
    MagicIcon, EraseIcon, PaintBrushIcon, HistoryIcon, PlusIcon, TrashIcon, WandIcon, LightbulbIcon,
    XCircleIcon, UndoIcon, RectangleIcon, CircleIcon, ArrowUpRightIcon, CameraIcon, ImportIcon, XIcon,
    ClipboardIcon, UserCircleIcon, VideoCameraIcon, DownloadIcon
} from './Icon';
import { ASPECT_RATIOS, FUNCTION_BUTTONS, ART_STYLES_LIST, EDITING_EXAMPLES, VEO_ASPECT_RATIOS, VEO_MEME_PROMPTS, NIGHT_CITY_LEGENDS_SCENES, NIGHT_CITY_WEAPONS, NIGHT_CITY_VEHICLES, NIGHT_CITY_COMPANIONS, NCL_OPTIONS, UNIFIED_DIRECTOR_STYLES, NIGHT_CITY_MISSIONS, NCL_OUTFITS_AND_CYBERWARE } from '../constants';
import { removeBackground } from '../services/geminiService';
import { ColorPicker } from './ColorPicker';
import { dataURLtoFile, getImageDimensions, getAspectRatio } from '../utils';
import { AutosizeTextarea } from './AutosizeTextarea';


type ControlPanelProps = {
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
    onGenerate: (options?: { scenes?: string[] }) => void;
    onRemoveBackground: () => void;
    isLoading: boolean;
    uploadedImage: UploadedImage | null;
    setUploadedImage: (image: UploadedImage | null) => void;
    referenceImages: UploadedImage[];
    setReferenceImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
    onRemoveReferenceImage: (index: number) => void;
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    selectedAspectRatio: AspectRatio;
    onAspectRatioSelect: (aspectRatio: AspectRatio) => void;
    isOptimizing: boolean;
    onOptimizePrompt: () => void;
    onInspirePrompt: () => void;
    onClearSettings: () => void;
    addGreenScreen: boolean;
    setAddGreenScreen: (value: boolean) => void;
    drawTool: DrawTool;
    setDrawTool: (tool: DrawTool) => void;
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    fillColor: string;
    setFillColor: (color: string) => void;
    strokeColor: string;
    setStrokeColor: (color: string) => void;
    drawAspectRatio: AspectRatio;
    setDrawAspectRatio: (ratio: AspectRatio) => void;
    canvasBackgroundColor: string;
    setCanvasBackgroundColor: (color: string) => void;
    onClearCanvas: () => void;
    onUndoCanvas: () => void;
    onDownloadCanvas: () => void;
    onUseDrawing: () => void;
    onDrawBackgroundUpload: (file: File | null) => void;
    drawBackgroundImage: string | null;
    isControlPanelOpen: boolean;
    setIsControlPanelOpen: (isOpen: boolean) => void;
    isMobile: boolean;
    modifierKey: 'Ctrl' | '⌘';
    isSuggestingEdit: boolean;
    theme: 'cyberpunk' | 'classic';
    setTheme: (theme: 'cyberpunk' | 'classic') => void;
    addToast: (message: string, type?: Toast['type']) => void;
    // Night City Legends Props
    characterImage: UploadedImage | null;
    setCharacterImage: (image: UploadedImage | null) => void;
    customWeaponImages: UploadedImage[];
    setCustomWeaponImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
    handleCustomImageUpload: (newImages: UploadedImage[], type: 'weapon' | 'companion') => Promise<void>;
    customCompanionImages: UploadedImage[];
    setCustomCompanionImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
    selectedWeapon: string;
    setSelectedWeapon: (weapon: string) => void;
    selectedVehicle: string;
    setSelectedVehicle: (vehicle: string) => void;
    selectedCompanion: string;
    setSelectedCompanion: (companion: string) => void;
    hairStyle: string;
    setHairStyle: (style: string) => void;
    hairColor: string;
    setHairColor: (color: string) => void;
    expression: string;
    setExpression: (expression: string) => void;
    headwear: string;
    setHeadwear: (value: string) => void;
    outerwear: string;
    setOuterwear: (value: string) => void;
    innerwear: string;
    setInnerwear: (value: string) => void;
    legwear: string;
    setLegwear: (value: string) => void;
    footwear: string;
    setFootwear: (value: string) => void;
    faceCyberware: string;
    setFaceCyberware: (value: string) => void;
    bodyCyberware: string;
    setBodyCyberware: (value: string) => void;
    lifePath: string;
    setLifePath: (background: string) => void;
    selectedScenes: string[];
    setSelectedScenes: React.Dispatch<React.SetStateAction<string[]>>;
    onRandomSceneGenerate: () => void;
    selectedDirector: string;
    setSelectedDirector: (director: string) => void;
    selectedMission: string;
    setSelectedMission: (mission: string) => void;
    nclPlaceholderImage: UploadedImage | null;
    isCinematicRealism: boolean;
    setIsCinematicRealism: (value: boolean) => void;
    // VEO Props
    veoPrompt: string;
    setVeoPrompt: React.Dispatch<React.SetStateAction<string>>;
    startFrame: UploadedImage | null;
    onStartFrameChange: (image: UploadedImage | null) => void;
    endFrame: UploadedImage | null;
    onEndFrameChange: (image: UploadedImage | null) => void;
    veoAspectRatio: VeoAspectRatio;
    setVeoAspectRatio: (ratio: VeoAspectRatio) => void;
    videoDuration: number;
    setVideoDuration: (duration: number) => void;
    onGenerateVeo: () => void;
    isGeneratingVideo: boolean;
    isAnalyzingFrames: boolean;
    selectedVeoDirector: string;
    setSelectedVeoDirector: (director: string) => void;
};

const NavButton: React.FC<{
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    label: string;
    isActive: boolean;
    onClick: () => void;
    title?: string;
}> = ({ icon: Icon, label, isActive, onClick, title }) => (
    <button
        onClick={onClick}
        title={title}
        className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors text-white ${
            isActive ? 'themed-button themed-active' : 'themed-button themed-button-secondary'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium">{label}</span>
    </button>
);

const Section: React.FC<{ title?: string; children: React.ReactNode, noMb?: boolean, className?: string }> = ({ title, children, noMb, className }) => (
    <div className={`${noMb ? '' : 'mb-4'} ${className}`}>
        {title && <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2" style={{textShadow: '0 0 3px #0ff'}}>{title}</h3>}
        {children}
    </div>
);


const Accordion: React.FC<{ title: string; children: React.ReactNode, initialOpen?: boolean }> = ({ title, children, initialOpen=false }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
        <div className="themed-panel rounded-lg mb-2">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-2 text-left">
                <span className="text-xs font-medium">{title}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && <div className="p-2 border-t border-fuchsia-500/20">{children}</div>}
        </div>
    );
};

const AspectRatioOverlay: React.FC<{ width?: number; height?: number }> = ({ width, height }) => {
    if (!width || !height) return null;
    const ratio = getAspectRatio(width, height);
    return (
        <div 
            className="absolute bottom-1 right-1 bg-black/60 text-gray-300 rounded-sm pointer-events-none"
            style={{ 
                fontSize: '10pt',
                lineHeight: '1.1',
                padding: '1px 5px',
                textShadow: '0px 0px 3px black, 0px 0px 3px black' 
            }}
        >
            {ratio}
        </div>
    );
};


const WebcamCapture: React.FC<{
    onClose: () => void;
    onImageSelect: (image: UploadedImage) => void;
}> = ({ onClose, onImageSelect }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setIsLoading(false);
                    };
                }
            } catch (err) {
                console.error("Error accessing webcam:", err);
                alert("無法存取攝像頭。請檢查權限設定。");
                onClose();
            }
        };

        startCamera();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [onClose]);

    const handleTakePhoto = useCallback(async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = canvas.toDataURL('image/png');
            if (imageData) {
                setIsProcessing(true);
                try {
                    const capturedFile = dataURLtoFile(imageData, `webcam-capture-${Date.now()}.png`);
                    const processedBase64 = await removeBackground(capturedFile, true); // remove BG and add green screen
                    
                    const finalSrc = `data:image/png;base64,${processedBase64}`;
                    const file = dataURLtoFile(finalSrc, `webcam-processed-${Date.now()}.png`);
                    const { width, height } = await getImageDimensions(finalSrc);
                    onImageSelect({ src: finalSrc, file, width, height });
                    onClose();
                } catch (err) {
                    console.error("Failed to process webcam image:", err);
                    alert(`影像處理失敗: ${err instanceof Error ? err.message : String(err)}`);
                    setIsProcessing(false);
                }
            }
        }
    }, [videoRef, canvasRef, onImageSelect, onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !isProcessing) {
                e.preventDefault();
                handleTakePhoto();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleTakePhoto, isProcessing]);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="themed-panel p-4 rounded-lg shadow-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">攝像頭拍攝</h3>
                <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
                    {(isLoading || isProcessing) && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-fuchsia-500 mb-3"></div>
                            <p className="font-semibold">{isProcessing ? '正在移除背景...' : '正在啟動攝像頭...'}</p>
                         </div>
                    )}
                    <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover transform scale-x-[-1] ${isLoading ? 'opacity-0' : 'opacity-100'}`} />
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                 <button onClick={handleTakePhoto} disabled={isLoading || isProcessing} className="w-full mt-4 py-2 themed-button rounded-lg font-semibold flex items-center justify-center gap-2">
                    {isProcessing ? '請稍候...' : '拍攝照片 (Enter)'}
                </button>
            </div>
        </div>
    );
};

const VersionInfo: React.FC<{ modifierKey: 'Ctrl' | '⌘' }> = ({ modifierKey }) => (
    <div className="flex flex-col h-full text-slate-400 p-4 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
            <img 
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAEgCAYAAADCPMtRAAAKx/AQYAcelI+bfRq7wAAAAASUVORK5CYII="
                alt="鳥巢AI包娜娜 Logo" 
                className="w-[256] h-[144] mb-4" 
            />
            <h3 className="text-xl font-semibold text-white-400 themed-text-glow">鳥巢AI包娜娜 v0.4</h3>
            <p className="text-lg mt-2 mb-4">主要功能介紹：</p>
            <ul className="text-sm text-left space-y-2 list-disc list-inside bg-black/20 p-4 rounded-lg">
                <li className="font-bold text-cyan-300">賽博龐克主題「夜城傳奇」模式</li>
                <li className="font-bold text-cyan-300"><a href="https://aiarttw.us/nano" target="_blank">***官方主題曲***</a></li>
                <li>多場景幻夢生成 (一次最多5個)</li>
                <li>沉浸式 UI/UX (動態載入動畫/呼吸光暈)</li>
                <li>智慧化圖片上傳 (拖曳/攝像頭/剪貼簿)</li>
                <li>VEO 2 影片生成與 AI 導演腳本</li>
                <li>全功能圖像編輯 (AI繪圖/去背/塗鴉/升頻)</li>
            </ul>
            <div className="mt-6 text-xm text-slate-400 border-t border-fuchsia-500/20 pt-4 w-full">
                <p className="font-bold text-cyan-400 mb-2">2025歡迎邀約鳥巢AI</p>
                <p>想學最新AI生成影音工具嗎？</p>
                <p>企業想找AI工具顧問減少摸索時間？</p>
                <p className="mb-2">
                    歡迎找鳥巢AI預約 <a href="https://aiarttw.us/contact" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:underline">https://aiarttw.us/contact</a>
                </p>
                <p className="text-slate-500">
                    #300場AI活動經歷<br />
                    #企業生成式AI代訓<br />
                    #鳥巢AI影音教學合作洽詢 <br />
                    #SunoV45+ #AI歌以載道 <br />
                    鳥巢AI歌曲 <br /><a href="https://aiarttw.us/aisong" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:underline">https://aiarttw.us/aisong</a>
                </p>
            </div>
        </div>
    </div>
);


const MultiUploader: React.FC<{
    images: UploadedImage[];
    onFilesUpload: (images: UploadedImage[]) => void;
    onRemoveImage: (index: number) => void;
    maxFiles: number;
    placeholder: React.ReactNode;
    borderColorClass: string;
}> = ({ images, onFilesUpload, onRemoveImage, maxFiles, placeholder, borderColorClass }) => {
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);

    const processFiles = useCallback(async (files: File[]) => {
        const uploadedImages: UploadedImage[] = [];
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                const promise = new Promise<UploadedImage>((resolve, reject) => {
                    reader.onload = async (e) => {
                        const src = e.target?.result as string;
                        try {
                            const { width, height } = await getImageDimensions(src);
                            resolve({ src, file, width, height, id: crypto.randomUUID() });
                        } catch(err) {
                            console.error("Could not get image dimensions for uploaded file", err);
                            reject(err);
                        }
                    };
                    reader.onerror = reject;
                });
                reader.readAsDataURL(file);
                try {
                    uploadedImages.push(await promise);
                } catch (error) {
                     console.error("Error processing file:", error);
                }
            }
        }
        if (uploadedImages.length > 0) {
            onFilesUpload(uploadedImages);
        }
    }, [onFilesUpload]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        processFiles(acceptedFiles);
    }, [processFiles]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        multiple: maxFiles > 1,
        maxFiles: maxFiles - images.length,
        disabled: images.length >= maxFiles,
    });
    
    const handlePasteFromClipboard = () => {
       alert("貼上功能已啟用！請直接在頁面上按 Ctrl+V (或 Cmd+V) 來貼上圖片。");
    };
    
    return (
        <div>
            <div {...getRootProps()} className={`p-2 border-2 border-dashed rounded-md transition-colors ${isDragActive ? 'border-fuchsia-500 bg-fuchsia-500/20' : borderColorClass}`}>
                <input {...getInputProps()} />
                 {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center w-full min-h-[100px] cursor-pointer" onClick={open}>
                        {isDragActive ? <p className="text-fuchsia-300 text-sm">將圖片拖曳至此</p> : placeholder}
                    </div>
                 ) : (
                    <div className={`grid gap-2 ${maxFiles > 1 ? 'grid-cols-4' : 'grid-cols-1'}`}>
                        {images.map((img, index) => (
                            <div key={img.id || index} className="relative group aspect-square">
                                <img src={img.src} alt={`upload-${index}`} className="w-full h-full object-cover rounded-md"/>
                                {img.isProcessing && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-md">
                                        <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-cyan-400"></div>
                                    </div>
                                )}
                                <AspectRatioOverlay width={img.width} height={img.height} />
                                <button onClick={(e) => { e.stopPropagation(); onRemoveImage(index); }} className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100">
                                    <XIcon className="w-3 h-3"/>
                                </button>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
            {images.length < maxFiles && (
                 <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <button onClick={open} className="themed-button themed-button-secondary rounded-md flex items-center justify-center gap-2 p-1">
                        <ImportIcon className="w-4 h-4"/> 上傳
                    </button>
                    <button onClick={() => setIsWebcamOpen(true)} className="themed-button themed-button-secondary rounded-md flex items-center justify-center gap-2 p-1">
                        <CameraIcon className="w-4 h-4"/> 攝像頭
                    </button>
                    <button onClick={handlePasteFromClipboard} className="col-span-2 themed-button themed-button-secondary rounded-md flex items-center justify-center gap-2 p-1">
                        <ClipboardIcon className="w-4 h-4"/> 從剪貼簿貼上
                    </button>
                </div>
            )}
            {isWebcamOpen && <WebcamCapture onClose={() => setIsWebcamOpen(false)} onImageSelect={(img) => onFilesUpload([img])} />}
        </div>
    );
};

const StyledSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; }> = ({ label, value, onChange, children }) => (
    <div className="my-2">
        {label && <label className="text-xs text-slate-400 block mb-1">{label}</label>}
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className="w-full appearance-none bg-black/40 border border-cyan-500/50 rounded-md p-2 text-sm focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    </div>
);


export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    const { appMode, setAppMode, isControlPanelOpen, setIsControlPanelOpen, isMobile, modifierKey, isSuggestingEdit, theme, setTheme } = props;

    const handleFunctionButtonClick = (promptText: string) => {
        props.setPrompt(prev => {
            const trimmedPrev = prev.trim();
            // Avoid adding comma if prompt is empty
            return trimmedPrev ? `${trimmedPrev}, ${promptText}` : promptText;
        });
    };

    const renderGeneratePanel = () => (
        <>
            <Section title="1. 提示詞 (Prompt)">
                <AutosizeTextarea
                    value={props.prompt}
                    onChange={(e) => props.setPrompt(e.target.value)}
                    placeholder="輸入您的創意，例如：一隻可愛的貓咪太空人..."
                    className="w-full p-2 bg-black/40 rounded-lg text-sm placeholder-slate-500 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-none min-h-[7rem] border border-cyan-500/50"
                />
                <div className="flex gap-2 mt-2">
                    <button onClick={props.onOptimizePrompt} disabled={props.isOptimizing} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs themed-button themed-button-secondary rounded-md" title={!isMobile ? `自動優化 (${modifierKey}+O)` : '自動優化'}>
                        <WandIcon className="w-4 h-4" /> {props.isOptimizing ? '優化中...' : '自動優化'}
                    </button>
                    <button onClick={props.onInspirePrompt} disabled={props.isOptimizing} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs themed-button themed-button-secondary rounded-md" title={!isMobile ? `靈感提示 (${modifierKey}+I)` : '靈感提示'}>
                        <LightbulbIcon className="w-4 h-4" /> {props.isOptimizing ? '提示中...' : '靈感提示'}
                    </button>
                    <button onClick={props.onClearSettings} className="p-2 text-xs themed-button themed-button-secondary rounded-md" title={`清除設定${!isMobile ? ` (${modifierKey}+Backspace)` : ''}`.trim()}>
                        <XCircleIcon className="w-4 h-4" />
                    </button>
                </div>
            </Section>
            
            <div className="space-y-2 mb-4">
                <Accordion title="世界 Top 100 藝術風格">
                    <div className="max-h-32 overflow-y-auto pr-1 flex flex-wrap gap-1">
                        {ART_STYLES_LIST.map(style => (
                            <button key={style.en} onClick={() => handleFunctionButtonClick(style.en)} className="px-2 py-0.5 bg-slate-700/50 text-xs rounded hover:bg-fuchsia-600 border border-fuchsia-500/30">{style.zh}</button>
                        ))}
                    </div>
                </Accordion>

                <Accordion title="終極改圖指南">
                    <div className="max-h-48 overflow-y-auto pr-1">
                        {EDITING_EXAMPLES.map(cat => (
                        <div key={cat.category}>
                                <p className="text-xs text-cyan-300 mt-2 mb-1 font-semibold">{cat.category}</p>
                                {cat.examples.map(ex => (
                                    <button key={ex.title} onClick={() => props.setPrompt(ex.prompt)} title={ex.prompt} className="w-full text-left px-2 py-0.5 bg-slate-700/50 text-xs rounded hover:bg-fuchsia-600 mb-1 border border-fuchsia-500/30">{ex.title}</button>
                                ))}
                        </div>
                        ))}
                    </div>
                </Accordion>
            </div>

            <Section title="火熱應用">
                <div className="flex flex-wrap gap-2">
                    {FUNCTION_BUTTONS.map(btn => (
                        <button 
                            key={btn.label}
                            onClick={() => handleFunctionButtonClick(btn.prompt)}
                            title={btn.prompt}
                            className="themed-button themed-button-secondary px-2 py-1 text-xs rounded"
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </Section>

            <Section title="參考圖 (選填，最多8張)" className="relative">
                 {isSuggestingEdit && (
                    <div className="absolute inset-0 bg-black/70 z-10 flex flex-col items-center justify-center rounded-lg">
                         <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-cyan-400"></div>
                         <p className="mt-2 text-sm text-cyan-300">AI改圖顧問分析中...</p>
                    </div>
                 )}
                <MultiUploader
                    images={props.referenceImages}
                    onFilesUpload={(imgs) => props.setReferenceImages(prev => [...prev, ...imgs].slice(0, 8))}
                    onRemoveImage={props.onRemoveReferenceImage}
                    maxFiles={8}
                    borderColorClass="border-fuchsia-500/50"
                    placeholder={
                        <div className="text-center">
                            <ImportIcon className="w-10 h-10 text-slate-500 mb-2 mx-auto" />
                            <p className="text-xs text-slate-400">點擊或拖曳上傳圖片</p>
                            <p className="text-xs text-slate-600">最多8張</p>
                        </div>
                    }
                />
            </Section>

            <Section title="圖片設定">
                <div className="space-y-3">
                     <div>
                        <label className="text-xs text-slate-400 block mb-1">長寬比例</label>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                           {ASPECT_RATIOS.map(ratio => (
                               <button 
                                key={ratio} 
                                onClick={() => props.onAspectRatioSelect(ratio)} 
                                className={`py-1 rounded transition-colors themed-button-secondary ${props.selectedAspectRatio === ratio ? 'themed-active' : ''}`}
                                >
                                {ratio}
                                </button>
                           ))}
                        </div>
                    </div>
                </div>
            </Section>
            
            <button onClick={() => props.onGenerate()} disabled={props.isLoading || isSuggestingEdit} className="w-full py-3 mt-auto themed-button themed-button-shine rounded-lg font-semibold flex items-center justify-center gap-2" title={!isMobile ? `生成圖片 (${modifierKey}+Enter)` : '生成圖片'}>
                 {props.isLoading ? '生成中...' : (isSuggestingEdit ? 'AI分析中...' : '生成圖片')}
            </button>
        </>
    );
    
    const renderNightCityLegendsPanel = () => {
        const handleSceneChange = (scene: string) => {
            const currentScenes = props.selectedScenes;
            if (currentScenes.includes(scene)) {
                props.setSelectedScenes(prev => prev.filter(s => s !== scene));
            } else {
                if (currentScenes.length >= 5) {
                    props.addToast('最多只能選擇5個場景', 'error');
                    return;
                }
                props.setSelectedScenes(prev => [...prev, scene]);
            }
        };

        const SceneButton: React.FC<{ scene: string }> = ({ scene }) => {
            const isSelected = props.selectedScenes.includes(scene);
            return (
                 <button onClick={() => handleSceneChange(scene)} className={`px-2 py-1 text-xs rounded transition-colors ${isSelected ? 'themed-button themed-active' : 'themed-button themed-button-secondary'}`}>
                    {scene}
                </button>
            );
        };

        return (
            <>
                <div className="themed-panel border-2 border-cyan-500/80 p-3 mb-4">
                    <Section title="I. 角色設定" noMb>
                         <AutosizeTextarea
                            value={props.prompt}
                            onChange={(e) => props.setPrompt(e.target.value)}
                            placeholder="輸入角色描述，或留空由AI分析圖片..."
                            className="w-full p-2 bg-black/40 rounded-lg text-sm placeholder-slate-500 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-none min-h-[5rem] border border-cyan-500/50 mb-2"
                        />
                        {props.nclPlaceholderImage && (
                            <div className="mb-2">
                                <h4 className="text-xs text-slate-400 mb-1">比例參考圖</h4>
                                <div className="relative">
                                    <img src={props.nclPlaceholderImage.src} className="w-full rounded-md opacity-50" alt="Aspect ratio placeholder" />
                                    <AspectRatioOverlay width={props.nclPlaceholderImage.width} height={props.nclPlaceholderImage.height} />
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs text-slate-400 mb-1">原始數據</h4>
                            <span className="text-xs text-slate-500">{props.characterImage ? 1 : 0}/1</span>
                        </div>
                        <MultiUploader
                            images={props.characterImage ? [props.characterImage] : []}
                            onFilesUpload={([img]) => img && props.setCharacterImage(img)}
                            onRemoveImage={() => props.setCharacterImage(null)}
                            maxFiles={1}
                            borderColorClass="border-cyan-500/50"
                            placeholder={
                                <div className="text-center">
                                    <UserCircleIcon className="w-10 h-10 text-slate-500 mb-2 mx-auto" />
                                    <p className="text-xs text-slate-400">點擊或拖曳選擇數據來源</p>
                                    <p className="text-xs text-slate-600">建議清晰正面照</p>
                                </div>
                            }
                        />
                        
                        <div className="grid grid-cols-1 gap-y-1 mt-4">
                            <StyledSelect label="髮型" value={props.hairStyle} onChange={e => props.setHairStyle(e.target.value)}>
                                {NCL_OPTIONS.hairStyle.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>
                            <StyledSelect label="髪色" value={props.hairColor} onChange={e => props.setHairColor(e.target.value)}>
                                 {NCL_OPTIONS.hairColor.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>
                            <StyledSelect label="表情" value={props.expression} onChange={e => props.setExpression(e.target.value)}>
                                 {NCL_OPTIONS.expression.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>

                            <StyledSelect label={NCL_OUTFITS_AND_CYBERWARE.headwear.label} value={props.headwear} onChange={e => props.setHeadwear(e.target.value)}>
                                {NCL_OUTFITS_AND_CYBERWARE.headwear.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>
                             <StyledSelect label={NCL_OUTFITS_AND_CYBERWARE.outerwear.label} value={props.outerwear} onChange={e => props.setOuterwear(e.target.value)}>
                                {NCL_OUTFITS_AND_CYBERWARE.outerwear.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>
                             <StyledSelect label={NCL_OUTFITS_AND_CYBERWARE.innerwear.label} value={props.innerwear} onChange={e => props.setInnerwear(e.target.value)}>
                                {NCL_OUTFITS_AND_CYBERWARE.innerwear.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>
                             <StyledSelect label={NCL_OUTFITS_AND_CYBERWARE.legwear.label} value={props.legwear} onChange={e => props.setLegwear(e.target.value)}>
                                {NCL_OUTFITS_AND_CYBERWARE.legwear.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>
                             <StyledSelect label={NCL_OUTFITS_AND_CYBERWARE.footwear.label} value={props.footwear} onChange={e => props.setFootwear(e.target.value)}>
                                {NCL_OUTFITS_AND_CYBERWARE.footwear.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>
                             <StyledSelect label={NCL_OUTFITS_AND_CYBERWARE.faceCyberware.label} value={props.faceCyberware} onChange={e => props.setFaceCyberware(e.target.value)}>
                                {NCL_OUTFITS_AND_CYBERWARE.faceCyberware.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>
                             <StyledSelect label={NCL_OUTFITS_AND_CYBERWARE.bodyCyberware.label} value={props.bodyCyberware} onChange={e => props.setBodyCyberware(e.target.value)}>
                                {NCL_OUTFITS_AND_CYBERWARE.bodyCyberware.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>

                            <StyledSelect label="出身" value={props.lifePath} onChange={e => props.setLifePath(e.target.value)}>
                                {NCL_OPTIONS.lifePath.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </StyledSelect>
                        </div>
                    </Section>
                </div>
                
                <div className="themed-panel border-2 border-fuchsia-500/80 p-3 mb-4">
                    <Section title="II. 武器庫 & 載具" noMb>
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs text-slate-400 mb-1">自訂武器庫 (自動去背)</h4>
                            <span className="text-xs text-slate-500">{props.customWeaponImages.filter(i => !i.isPlaceholder).length}/8</span>
                        </div>
                        <MultiUploader
                            images={props.customWeaponImages}
                            onFilesUpload={(imgs) => props.handleCustomImageUpload(imgs, 'weapon')}
                            onRemoveImage={(index) => props.setCustomWeaponImages(prev => prev.filter((_, i) => i !== index))}
                            maxFiles={8}
                            borderColorClass="border-fuchsia-500/50"
                            placeholder={<p className="text-xs text-slate-500">點擊或拖曳武器圖片</p>}
                        />
                         <StyledSelect label="武器庫" value={props.selectedWeapon} onChange={e => props.setSelectedWeapon(e.target.value)}>
                            <option value="不裝備">不裝備</option>
                            {Object.entries(NIGHT_CITY_WEAPONS).map(([category, weapons]) => (
                                <optgroup label={category} key={category}>
                                    {weapons.map(weapon => <option key={weapon} value={weapon}>{weapon}</option>)}
                                </optgroup>
                            ))}
                        </StyledSelect>
                         <StyledSelect label="經典交通工具" value={props.selectedVehicle} onChange={e => props.setSelectedVehicle(e.target.value)}>
                            <option value="不駕駛">不駕駛</option>
                            {Object.entries(NIGHT_CITY_VEHICLES).map(([category, vehicles]) => (
                                <optgroup label={category} key={category}>
                                    {vehicles.map(vehicle => <option key={vehicle} value={vehicle}>{vehicle}</option>)}
                                </optgroup>
                            ))}
                        </StyledSelect>
                    </Section>
                </div>

                <div className="themed-panel border-2 border-fuchsia-500/80 p-3 mb-4">
                    <Section title="III. 任務夥伴" noMb>
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs text-slate-400 mb-1">自訂夥伴 (自動去背)</h4>
                            <span className="text-xs text-slate-500">{props.customCompanionImages.length}/8</span>
                        </div>
                         <MultiUploader
                            images={props.customCompanionImages}
                            onFilesUpload={(imgs) => props.handleCustomImageUpload(imgs, 'companion')}
                            onRemoveImage={(index) => props.setCustomCompanionImages(prev => prev.filter((_, i) => i !== index))}
                            maxFiles={8}
                            borderColorClass="border-fuchsia-500/50"
                            placeholder={<p className="text-xs text-slate-500">點擊或拖曳夥伴圖片</p>}
                        />
                        <StyledSelect label="任務夥伴" value={props.selectedCompanion} onChange={e => props.setSelectedCompanion(e.target.value)}>
                            <option value="單獨行動">單獨行動</option>
                            {Object.entries(NIGHT_CITY_COMPANIONS).map(([gender, companions]) => (
                                <optgroup label={gender} key={gender}>
                                    {companions.map(c => <option key={c} value={c}>{c}</option>)}
                                </optgroup>
                            ))}
                        </StyledSelect>
                    </Section>
                </div>

                <Section title="幻夢設定">
                    <StyledSelect label="任務類型" value={props.selectedMission} onChange={e => props.setSelectedMission(e.target.value)}>
                        <option value="隨機任務">隨機任務</option>
                        {NIGHT_CITY_MISSIONS.map(category => (
                            <optgroup label={category.label} key={category.label}>
                                {category.options.map(mission => <option key={mission} value={mission}>{mission}</option>)}
                            </optgroup>
                        ))}
                    </StyledSelect>
                     <div className="mb-2">
                        <StyledSelect label="世界知名導演風格" value={props.selectedDirector} onChange={e => props.setSelectedDirector(e.target.value)}>
                            {UNIFIED_DIRECTOR_STYLES.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                        </StyledSelect>
                    </div>
                    <div className="space-y-3">
                         <div>
                            <label className="text-xs text-slate-400 block mb-1">長寬比例</label>
                            <div className="grid grid-cols-5 gap-2 text-xs">
                               {ASPECT_RATIOS.map(ratio => (
                                   <button 
                                    key={ratio} 
                                    onClick={() => props.onAspectRatioSelect(ratio)} 
                                    className={`py-1 rounded transition-colors themed-button-secondary ${props.selectedAspectRatio === ratio ? 'themed-active' : ''}`}
                                    >
                                    {ratio}
                                    </button>
                               ))}
                            </div>
                        </div>
                    </div>
                </Section>

                <Section title="出任務(最多複選5個場景)">
                    <div className="themed-panel p-2 rounded-lg mb-2">
                        <h4 className="text-xs font-bold text-cyan-300 mb-2">夜城</h4>
                        <div className="flex flex-wrap gap-1">
                             {NIGHT_CITY_LEGENDS_SCENES.nightCity.slice(0, 20).map(scene => <SceneButton key={scene} scene={scene} />)}
                        </div>
                        {NIGHT_CITY_LEGENDS_SCENES.nightCity.length > 20 && (
                            <Accordion title="更多夜城場景">
                                <div className="flex flex-wrap gap-1">
                                    {NIGHT_CITY_LEGENDS_SCENES.nightCity.slice(20).map(scene => <SceneButton key={scene} scene={scene} />)}
                                </div>
                            </Accordion>
                        )}
                    </div>
                     <div className="themed-panel p-2 rounded-lg">
                        <h4 className="text-xs font-bold text-cyan-300 mb-2">狗命鎮</h4>
                        <div className="flex flex-wrap gap-1">
                             {NIGHT_CITY_LEGENDS_SCENES.dogtown.slice(0, 20).map(scene => <SceneButton key={scene} scene={scene} />)}
                        </div>
                        {NIGHT_CITY_LEGENDS_SCENES.dogtown.length > 20 && (
                            <Accordion title="更多狗命鎮場景">
                                <div className="flex flex-wrap gap-1">
                                    {NIGHT_CITY_LEGENDS_SCENES.dogtown.slice(20).map(scene => <SceneButton key={scene} scene={scene} />)}
                                </div>
                            </Accordion>
                        )}
                    </div>
                </Section>
    
                <div className="mt-auto space-y-2">
                    <button onClick={props.onRandomSceneGenerate} disabled={props.isLoading} className="w-full py-3 themed-button themed-button-secondary rounded-lg font-semibold flex items-center justify-center gap-2">
                        隨選5場景
                    </button>
                    <div className="flex items-stretch gap-2">
                        <div className="flex items-center p-2 bg-black/30 rounded-lg flex-1">
                             <input
                                id="cinematic-toggle"
                                type="checkbox"
                                checked={props.isCinematicRealism}
                                onChange={(e) => props.setIsCinematicRealism(e.target.checked)}
                                className="w-4 h-4 text-fuchsia-600 bg-gray-700 border-gray-600 rounded focus:ring-fuchsia-500 focus:ring-2"
                            />
                            <label htmlFor="cinematic-toggle" className="text-sm cursor-pointer ml-2 whitespace-nowrap">電影真人版</label>
                        </div>
                        <button onClick={() => props.onGenerate()} disabled={props.isLoading} className="flex-1 py-3 themed-button themed-button-shine rounded-lg font-semibold flex items-center justify-center gap-2">
                            {props.isLoading ? '幻夢ing...' : '改裝腦機'}
                        </button>
                    </div>
                </div>
            </>
        );
    };

    const renderRemoveBgPanel = () => (
        <>
            <Section title="1. 上傳圖片">
                <MultiUploader
                    images={props.uploadedImage ? [props.uploadedImage] : []}
                    onFilesUpload={([img]) => img && props.setUploadedImage(img)}
                    onRemoveImage={() => props.setUploadedImage(null)}
                    maxFiles={1}
                    borderColorClass="border-fuchsia-500/50"
                    placeholder={
                        <div className="text-center">
                            <ImportIcon className="w-10 h-10 text-slate-500 mb-2 mx-auto" />
                            <p className="text-xs text-slate-400">點擊或拖曳上傳圖片</p>
                        </div>
                    }
                />
            </Section>
            <Section title="2. 選項">
                <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                    <label htmlFor="green-screen-toggle" className="text-sm cursor-pointer">去背後綠幕</label>
                    <input
                        id="green-screen-toggle"
                        type="checkbox"
                        checked={props.addGreenScreen}
                        onChange={(e) => props.setAddGreenScreen(e.target.checked)}
                        className="w-4 h-4 text-fuchsia-600 bg-gray-700 border-gray-600 rounded focus:ring-fuchsia-500 focus:ring-2"
                    />
                </div>
            </Section>
            {props.uploadedImage && (
                <>
                    <button onClick={props.onRemoveBackground} disabled={props.isLoading} className="w-full py-3 mt-auto themed-button themed-button-shine rounded-lg font-semibold" title={!isMobile ? `移除背景 (${modifierKey}+Enter)` : '移除背景'}>
                        {props.isLoading ? '處理中...' : '移除背景'}
                    </button>
                </>
            )}
        </>
    );
    
    const renderDrawPanel = () => {
        const tools: { name: DrawTool, icon: React.FC<any>, key: string, label: string }[] = [
            { name: 'brush', icon: PaintBrushIcon, key: 'B', label: '筆刷' },
            { name: 'rectangle', icon: RectangleIcon, key: 'R', label: '矩形' },
            { name: 'circle', icon: CircleIcon, key: 'C', label: '圓形' },
            { name: 'arrow', icon: ArrowUpRightIcon, key: 'A', label: '箭頭' },
        ];

        const isShapeTool = props.drawTool === 'rectangle' || props.drawTool === 'circle';
        const brushSizeLabel = {
            brush: '筆刷尺寸',
            rectangle: '邊框寬度',
            circle: '邊框寬度',
            arrow: '線條寬度'
        }[props.drawTool];

        return (
            <>
                <Section title="工具">
                    <div className="grid grid-cols-4 gap-2">
                        {tools.map(t => (
                            <button key={t.name} onClick={() => props.setDrawTool(t.name)} className={`p-2 rounded-lg themed-button-secondary ${props.drawTool === t.name ? 'themed-active' : ''}`} title={!isMobile ? `${t.label} (${t.key})` : t.label}>
                                <t.icon className="w-5 h-5 mx-auto"/>
                            </button>
                        ))}
                    </div>
                </Section>
                <Section title="屬性" noMb>
                    <div className="space-y-4">
                        {isShapeTool ? (
                            <>
                                <ColorPicker label="填滿" color={props.fillColor} setColor={props.setFillColor} paletteKey="draw-fill-palette" />
                                <ColorPicker label="邊框" color={props.strokeColor} setColor={props.setStrokeColor} paletteKey="draw-stroke-palette" />
                            </>
                        ) : (
                            <ColorPicker label="顏色" color={props.strokeColor} setColor={props.setStrokeColor} paletteKey="draw-stroke-palette" />
                        )}
                        
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">{brushSizeLabel}</label>
                            <div className="flex items-center gap-2" title={!props.isMobile ? "使用 [ 和 ] 鍵調整" : undefined}>
                                 <input type="range" min="1" max="100" value={props.brushSize} onChange={(e) => props.onBrushSizeChange(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                 <span className="text-sm font-semibold w-8 text-center">{props.brushSize}</span>
                            </div>
                        </div>
                    </div>
                </Section>
                 <Section title="畫布">
                    <div className="mb-3">
                        <label className="text-xs text-slate-400 block mb-1">畫布比例</label>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                           {ASPECT_RATIOS.map(ratio => (
                               <button 
                                key={ratio} 
                                onClick={() => props.setDrawAspectRatio(ratio)} 
                                className={`py-1 rounded transition-colors themed-button-secondary ${props.drawAspectRatio === ratio ? 'themed-active' : ''}`}
                                >
                                {ratio}
                                </button>
                           ))}
                        </div>
                    </div>
                    <div className="my-3">
                       <ColorPicker label="畫布背景" color={props.canvasBackgroundColor} setColor={props.setCanvasBackgroundColor} paletteKey="draw-canvas-bg-palette" />
                    </div>
                    {props.drawBackgroundImage && (
                        <div className="relative group mb-2">
                            <p className="text-xs text-slate-400 mb-1">目前背景</p>
                            <img src={props.drawBackgroundImage} alt="Canvas background" className="w-full rounded-md" />
                             <button onClick={() => props.onDrawBackgroundUpload(null)} className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100">
                                 <XIcon className="w-3 h-3"/>
                             </button>
                        </div>
                    )}
                     <MultiUploader
                        images={[]}
                        onFilesUpload={([img]) => img && props.onDrawBackgroundUpload(img.file)}
                        onRemoveImage={() => {}} // no-op since state is handled by parent
                        maxFiles={1}
                        borderColorClass="border-fuchsia-500/50"
                        placeholder={
                            <div className="text-center text-xs text-slate-400 py-4">
                                <p>上傳新背景 (選填)</p>
                                <p className="text-slate-600">點擊或拖曳圖片</p>
                            </div>
                        }
                    />
                 </Section>
                <div className="grid grid-cols-3 gap-2 mt-auto">
                    <button onClick={props.onUndoCanvas} className="themed-button themed-button-secondary rounded-md flex items-center justify-center gap-2 py-2" title={!isMobile ? `復原 (${modifierKey}+Z)` : '復原'}>
                        <UndoIcon className="w-4 h-4"/>復原
                    </button>
                    <button onClick={props.onClearCanvas} className="themed-button themed-button-secondary rounded-md flex items-center justify-center gap-2 py-2" title={!isMobile ? `清除 (${modifierKey}+Backspace)` : '清除'}>
                        <TrashIcon className="w-4 h-4"/>清除
                    </button>
                    <button onClick={props.onDownloadCanvas} className="themed-button themed-button-secondary rounded-md flex items-center justify-center gap-2 py-2" title="下載">
                        <DownloadIcon className="w-4 h-4"/>下載
                    </button>
                    <button onClick={props.onUseDrawing} className="col-span-3 py-3 themed-button themed-button-shine rounded-lg font-semibold" title={!isMobile ? `使用此畫布生成 (${modifierKey}+Enter)` : '使用此畫布生成'}>
                        使用此畫布生成
                    </button>
                </div>
            </>
        );
    };

    const VeoFrameUploader: React.FC<{
        label: string;
        image: UploadedImage | null;
        setImage: (image: UploadedImage | null) => void;
        disabled?: boolean;
    }> = ({ label, image, setImage, disabled }) => {
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [isWebcamOpen, setIsWebcamOpen] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);
        const menuRef = useRef<HTMLDivElement>(null);

        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file?.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const src = e.target?.result as string;
                    const { width, height } = await getImageDimensions(src);
                    setImage({ src, file, width, height });
                };
                reader.readAsDataURL(file);
            }
            if (event.target) event.target.value = '';
        };

        const handlePasteFromClipboard = () => alert("貼上功能已啟用！請直接在頁面上按 Ctrl+V (或 Cmd+V) 來貼上圖片。");

        const handleImageSelect = (img: UploadedImage) => {
            setImage(img);
            setIsWebcamOpen(false);
        };

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setIsMenuOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        return (
            <div className="relative">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                <label className="text-xs text-slate-400 block mb-1">{label}</label>
                {image ? (
                     <div 
                        onClick={() => !disabled && setIsMenuOpen(true)}
                        className={`relative group aspect-video rounded-md overflow-hidden ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <img src={image.src} alt={label} className="w-full h-full object-cover" />
                        <AspectRatioOverlay width={image.width} height={image.height} />
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-sm">點擊更換</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); if(!disabled) setImage(null); }} disabled={disabled} className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100"><XIcon className="w-3 h-3"/></button>
                    </div>
                ) : (
                    <div onClick={() => !disabled && setIsMenuOpen(true)} className={`flex flex-col items-center justify-center w-full h-full aspect-video bg-black/30 rounded-lg border-2 border-dashed border-fuchsia-500/50 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-fuchsia-500'}`}>
                        <PlusIcon className="w-6 h-6 text-slate-500" />
                        <p className="text-xs text-slate-500 mt-1">點擊上傳</p>
                    </div>
                )}
                {isMenuOpen && (
                    <div ref={menuRef} className="absolute z-10 top-full mt-2 w-full bg-slate-800 rounded-md shadow-lg p-2 space-y-2 text-sm themed-panel">
                        <button onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 p-2 hover:bg-slate-700 rounded-md"><ImportIcon className="w-4 h-4"/>從檔案</button>
                        <button onClick={() => { setIsWebcamOpen(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 p-2 hover:bg-slate-700 rounded-md"><CameraIcon className="w-4 h-4"/>攝像頭</button>
                        <button onClick={() => { handlePasteFromClipboard(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 p-2 hover:bg-slate-700 rounded-md"><ClipboardIcon className="w-4 h-4"/>剪貼簿</button>
                    </div>
                )}
                {isWebcamOpen && <WebcamCapture onClose={() => setIsWebcamOpen(false)} onImageSelect={handleImageSelect} />}
            </div>
        );
    };

    const renderVeoPanel = () => {
        return (
            <>
                <Section title="提示詞">
                    <div className="relative">
                        <AutosizeTextarea
                            value={props.veoPrompt}
                            onChange={(e) => props.setVeoPrompt(e.target.value)}
                            placeholder="一位太空人，在一個廢棄的太空艙裡，凝視著窗外的星空..."
                            className="w-full p-2 bg-black/40 rounded-lg text-sm placeholder-slate-500 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-none min-h-[6rem] border border-cyan-500/50"
                            disabled={props.isAnalyzingFrames}
                        />
                        {props.isAnalyzingFrames && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-fuchsia-400"></div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button onClick={props.onOptimizePrompt} disabled={props.isOptimizing || props.isAnalyzingFrames} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs themed-button themed-button-secondary rounded-md">
                            <WandIcon className="w-4 h-4" /> {props.isOptimizing ? '處理中...' : '優化提示'}
                        </button>
                        <button onClick={props.onInspirePrompt} disabled={props.isOptimizing || props.isAnalyzingFrames} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs themed-button themed-button-secondary rounded-md">
                            <LightbulbIcon className="w-4 h-4" /> 提示靈感
                        </button>
                    </div>
                </Section>
                
                 <Section title="導演風格">
                    <StyledSelect label="" value={props.selectedVeoDirector} onChange={e => props.setSelectedVeoDirector(e.target.value)}>
                        {UNIFIED_DIRECTOR_STYLES.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                    </StyledSelect>
                </Section>

                <Section title="幽默迷因">
                     <div className="flex flex-wrap gap-2">
                        {VEO_MEME_PROMPTS.map(p => (
                            <button key={p.label} onClick={() => props.setVeoPrompt(p.prompt)} title={p.prompt} className="px-3 py-1 bg-black/40 text-xs rounded-full hover:bg-cyan-600/50 hover:text-cyan-300 border border-cyan-500/30">
                                {p.label}
                            </button>
                        ))}
                    </div>
                </Section>
                
                <Section title="AI 導演">
                    <div className="grid grid-cols-2 gap-3">
                        <VeoFrameUploader label="首幀 (可選)" image={props.startFrame} setImage={props.onStartFrameChange} disabled={props.isAnalyzingFrames} />
                        <VeoFrameUploader label="尾幀 (可選)" image={props.endFrame} setImage={props.onEndFrameChange} disabled={props.isAnalyzingFrames} />
                    </div>
                </Section>
                
                <Section title="影片設定">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">寬高比</label>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                           {VEO_ASPECT_RATIOS.map(ratio => (
                               <button 
                                key={ratio} 
                                onClick={() => props.setVeoAspectRatio(ratio)} 
                                className={`py-1 rounded transition-colors themed-button-secondary ${props.veoAspectRatio === ratio ? 'themed-active' : ''}`}
                                >
                                {ratio}
                                </button>
                           ))}
                        </div>
                    </div>
                    <div className="mt-3">
                         <label className="text-xs text-slate-400 block mb-1">影片長度 ({props.videoDuration}秒)</label>
                         <input type="range" min="5" max="8" step="1" value={props.videoDuration} onChange={(e) => props.setVideoDuration(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </Section>

                <button onClick={() => props.onGenerateVeo()} disabled={props.isGeneratingVideo || props.isAnalyzingFrames} className="w-full py-3 mt-auto themed-button themed-button-shine rounded-lg font-semibold flex items-center justify-center gap-2">
                     {props.isGeneratingVideo ? '生成中...' : (props.isAnalyzingFrames ? '分析中...' : '生成影片')}
                </button>
            </>
        );
    };


    const renderContent = () => {
        switch (appMode) {
            case 'GENERATE': return renderGeneratePanel();
            case 'NIGHT_CITY_LEGENDS': return renderNightCityLegendsPanel();
            case 'REMOVE_BG': return renderRemoveBgPanel();
            case 'DRAW': return renderDrawPanel();
            case 'HISTORY': return <VersionInfo modifierKey={modifierKey} />;
            case 'VEO': return renderVeoPanel();
            default: return null;
        }
    };
    
    return (
        <aside className={`absolute md:relative inset-y-0 left-0 z-40 transform ${isControlPanelOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out themed-panel w-80 md:w-96 2xl:w-1/4 flex flex-col`}>
             <button onClick={() => setIsControlPanelOpen(false)} className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white z-50">
                <XIcon className="w-6 h-6" />
            </button>
            <div className="p-4 border-b border-fuchsia-500/20">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex flex-col">
                    <h1 className="text-lg font-bold themed-text-glow">鳥巢AI包娜娜 v0.4</h1>
                    <p className="text-xs text-cyan-200">Gemini AI 圖像生成與編輯應用</p>
                </div>
                <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-md">
                   <button onClick={() => setTheme('cyberpunk')} className={`px-2 py-1 text-xs rounded-md ${theme === 'cyberpunk' ? 'themed-button themed-active' : 'themed-button themed-button-secondary'}`}>
                       Cyberpunk
                   </button>
                   <button onClick={() => setTheme('classic')} className={`px-2 py-1 text-xs rounded-md ${theme === 'classic' ? 'themed-button themed-active' : 'themed-button themed-button-secondary'}`}>
                       經典
                   </button>
                </div>
              </div>
              <nav className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-lg">
                  <NavButton icon={MagicIcon} label="AI生成" title={!isMobile ? `AI生成 (${modifierKey}+Alt+1)` : 'AI生成'} isActive={appMode === 'GENERATE'} onClick={() => setAppMode('GENERATE')} />
                  <NavButton icon={UserCircleIcon} label="夜城傳奇" title={!isMobile ? `夜城傳奇 (${modifierKey}+Alt+2)` : '夜城傳奇'} isActive={appMode === 'NIGHT_CITY_LEGENDS'} onClick={() => setAppMode('NIGHT_CITY_LEGENDS')} />
                  <NavButton icon={EraseIcon} label="背景移除" title={!isMobile ? `背景移除 (${modifierKey}+Alt+3)` : '背景移除'} isActive={appMode === 'REMOVE_BG'} onClick={() => setAppMode('REMOVE_BG')} />
                  <NavButton icon={PaintBrushIcon} label="塗鴉板" title={!isMobile ? `塗鴉板 (${modifierKey}+Alt+4)` : '塗鴉板'} isActive={appMode === 'DRAW'} onClick={() => setAppMode('DRAW')} />
                  <NavButton icon={HistoryIcon} label="歷史紀錄" title={!isMobile ? `歷史紀錄 (${modifierKey}+Alt+5)` : '歷史紀錄'} isActive={appMode === 'HISTORY'} onClick={() => setAppMode('HISTORY')} />
                  <NavButton icon={VideoCameraIcon} label="生Veo2" title="影片生成" isActive={appMode === 'VEO'} onClick={() => setAppMode('VEO')} />
              </nav>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto p-4">
                 {renderContent()}
            </div>
        </aside>
    );
};