import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ResultPanel } from './components/ResultPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { Lightbox } from './components/Lightbox';
import { DrawingCanvas } from './components/DrawingCanvas';
import { VeoPanel } from './components/VeoPanel';
import type {
    AppMode,
    AspectRatio,
    GeneratedImage,
    HistoryItem,
    LightboxConfig,
    Toast,
    UploadedImage,
    DrawTool,
    DrawingCanvasRef,
    VeoParams,
    VeoHistoryItem,
    VeoAspectRatio,
} from './types';
import * as geminiService from './services/geminiService';
import { dataURLtoFile, getFileSizeFromBase64, getImageDimensions, createPlaceholderImage, downloadImage, getAspectRatio, cropImageToAspectRatio } from './utils';
import { API_SUPPORTED_ASPECT_RATIOS, UNIFIED_DIRECTOR_STYLES, ASPECT_RATIOS, NIGHT_CITY_LEGENDS_SCENES, NIGHT_CITY_SCENE_PROMPTS, NIGHT_CITY_MISSIONS, DYNAMIC_ACTION_PROMPTS, IMMERSIVE_QUALITY_PROMPTS } from './constants';

const App: React.FC = () => {
    // --- Core State ---
    const [appMode, setAppMode] = useState<AppMode>('GENERATE');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [isControlPanelOpen, setIsControlPanelOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [modifierKey, setModifierKey] = useState<'Ctrl' | '⌘'>('Ctrl');
    const [theme, setTheme] = useState<'cyberpunk' | 'classic'>('cyberpunk');

    // --- Toast State ---
    const [toasts, setToasts] = useState<Toast[]>([]);

    // --- Generate Mode State ---
    const [promptText, setPromptText] = useState('');
    const [inspiredPromptPart, setInspiredPromptPart] = useState('');
    const [referenceImages, setReferenceImages] = useState<UploadedImage[]>([]);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSuggestingEdit, setIsSuggestingEdit] = useState(false);
    const prevRefImagesCount = useRef(0);

    // --- Night City Legends State ---
    const [characterImage, setCharacterImage] = useState<UploadedImage | null>(null);
    const [customWeaponImages, setCustomWeaponImages] = useState<UploadedImage[]>([]);
    const [customCompanionImages, setCustomCompanionImages] = useState<UploadedImage[]>([]);
    const [selectedWeapon, setSelectedWeapon] = useState<string>('不裝備');
    const [selectedVehicle, setSelectedVehicle] = useState<string>('不駕駛');
    const [selectedCompanion, setSelectedCompanion] = useState<string>('單獨行動');
    const [hairStyle, setHairStyle] = useState('從掃描檔中自動偵測');
    const [hairColor, setHairColor] = useState('從掃描檔中自動偵測');
    const [expression, setExpression] = useState('從掃描檔中自動偵測');
    const [headwear, setHeadwear] = useState('不指定');
    const [outerwear, setOuterwear] = useState('不指定');
    const [innerwear, setInnerwear] = useState('不指定');
    const [legwear, setLegwear] = useState('不指定');
    const [footwear, setFootwear] = useState('不指定');
    const [faceCyberware, setFaceCyberware] = useState('不指定');
    const [bodyCyberware, setBodyCyberware] = useState('不指定');
    const [lifePath, setLifePath] = useState('不指定'); // Renamed from 'background' for clarity
    const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
    const [selectedDirector, setSelectedDirector] = useState<string>('隨機導演');
    const [selectedMission, setSelectedMission] = useState<string>('隨機任務');
    const [nclPlaceholderImage, setNclPlaceholderImage] = useState<UploadedImage | null>(null);
    const [isCinematicRealism, setIsCinematicRealism] = useState(false);
    const prevCharImage = useRef<UploadedImage | null>(null);


    // --- Remove BG Mode State ---
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
    const [addGreenScreen, setAddGreenScreen] = useState(false);

    // --- Draw Mode State ---
    const drawCanvasRef = useRef<DrawingCanvasRef>(null);
    const [drawTool, setDrawTool] = useState<DrawTool>('brush');
    const [brushSize, setBrushSize] = useState(10);
    const [fillColor, setFillColor] = useState('transparent');
    const [strokeColor, setStrokeColor] = useState('#FFFFFF');
    const [drawAspectRatio, setDrawAspectRatio] = useState<AspectRatio | null>(null);
    const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#808080');
    const [drawBackgroundImage, setDrawBackgroundImage] = useState<string | null>(null);


    // --- History Mode State ---
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // --- VEO Mode State ---
    const [veoPrompt, setVeoPrompt] = useState('');
    const [startFrame, setStartFrame] = useState<UploadedImage | null>(null);
    const [endFrame, setEndFrame] = useState<UploadedImage | null>(null);
    const [veoAspectRatio, setVeoAspectRatio] = useState<VeoAspectRatio | null>(null);
    const [videoDuration, setVideoDuration] = useState(5);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [veoHistory, setVeoHistory] = useState<VeoHistoryItem[]>([]);
    const [currentVeoVideo, setCurrentVeoVideo] = useState<VeoHistoryItem | null>(null);
    const [lastVeoSuccessParams, setLastVeoSuccessParams] = useState<VeoParams | null>(null);
    const [isAnalyzingFrames, setIsAnalyzingFrames] = useState(false);
    const [selectedVeoDirector, setSelectedVeoDirector] = useState<string>('隨機導演');


    // --- Lightbox State ---
    const [lightboxConfig, setLightboxConfig] = useState<LightboxConfig>(null);
        
    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
        }, 5000); // Increased duration for important messages
    }, []);

    // --- UI Handlers ---
    const onAspectRatioSelect = useCallback((ratio: AspectRatio) => {
        setSelectedAspectRatio(ratio);
        setDrawAspectRatio(ratio);
    
        const [w, h] = ratio.split(':').map(Number);
        const placeholderImage: UploadedImage = {
            src: createPlaceholderImage(ratio, '#808080'),
            file: dataURLtoFile(createPlaceholderImage(ratio, '#808080'), `placeholder-${ratio}.png`),
            isPlaceholder: true,
            width: w * 100,
            height: h * 100,
        };
        
        setNclPlaceholderImage(placeholderImage);
    
        if (appMode === 'GENERATE') {
            const existingNonPlaceholder = referenceImages.filter(img => !img.isPlaceholder);
            setReferenceImages([placeholderImage, ...existingNonPlaceholder]);
        }
    }, [appMode, referenceImages]);

    // --- Effects ---
    
    // Theme manager
    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme') || 'cyberpunk';
        setTheme(savedTheme as 'cyberpunk' | 'classic');
    }, []);

    useEffect(() => {
        document.body.classList.remove('cyber-bg', 'classic-bg');
        if (theme === 'cyberpunk') {
            document.body.classList.add('cyber-bg');
        } else {
            document.body.classList.add('classic-bg');
        }
        localStorage.setItem('app-theme', theme);
    }, [theme]);


    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('image-gen-history');
            if (savedHistory) {
                setHistoryItems(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to load history from localStorage", e);
        }
        
        if (navigator.userAgent.indexOf("Mac") !== -1) {
            setModifierKey("⌘");
        }

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Save history to localStorage when it changes
    useEffect(() => {
        try {
            const historyToSave = historyItems.slice(0, 25); // Ensure we don't save more than the limit
            localStorage.setItem('image-gen-history', JSON.stringify(historyToSave));
        } catch (e)
        {
            console.error("Failed to save history to localStorage", e);
             if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                addToast('儲存空間已滿！請至歷史紀錄頁面手動清除部分紀錄。', 'error');
            }
        }
    }, [historyItems, addToast]);

    // AI Editing Advisor Effect
    useEffect(() => {
        const handleSuggestion = async () => {
            if (appMode === 'GENERATE' && referenceImages.length > prevRefImagesCount.current) {
                const newImage = referenceImages[referenceImages.length - 1];
                if (newImage && !newImage.isPlaceholder) {
                    setIsSuggestingEdit(true);
                    addToast("AI改圖顧問分析中...", "info");
                    try {
                        const { analysis_prompt, suggestion } = await geminiService.getEditingSuggestion(newImage.file);
                        setPromptText(p => {
                            const currentPrompt = p ? p.trim() + "\n\n" : "";
                            const newContent = `${analysis_prompt}\n\n${suggestion}`;
                            addToast(`AI顧問已為您生成提示與改圖建議！`, "success");
                            return currentPrompt + newContent;
                        });
                    } catch (err) {
                        const message = err instanceof Error ? err.message : '未知錯誤';
                        addToast(`建議獲取失敗: ${message}`, "error");
                    } finally {
                        setIsSuggestingEdit(false);
                    }
                }
            } else if (appMode === 'NIGHT_CITY_LEGENDS' && characterImage && characterImage !== prevCharImage.current) {
                 const newImage = characterImage;
                 if (newImage && !newImage.isPlaceholder) {
                    setIsSuggestingEdit(true);
                    addToast("AI角色分析中...", "info");
                     try {
                        const suggestion = await geminiService.getNCLCharacterDescription(newImage.file);
                        setPromptText(suggestion);
                        addToast(`已為您自動生成角色描述！`, "success");
                    } catch (err) {
                        const message = err instanceof Error ? err.message : '未知錯誤';
                        addToast(`角色分析失敗: ${message}`, "error");
                    } finally {
                        setIsSuggestingEdit(false);
                    }
                 }
            }
            prevRefImagesCount.current = referenceImages.length;
            prevCharImage.current = characterImage;
        };
        handleSuggestion();
    }, [referenceImages, characterImage, appMode, addToast]);


    // --- Utility Functions ---
    const addToHistory = useCallback(async (newImages: (Omit<GeneratedImage, 'width' | 'height' | 'size'> | GeneratedImage)[]) => {
        const newHistoryItems: HistoryItem[] = [];
        for(const image of newImages) {
            try {
                // If dimensions are already calculated, don't re-calculate
                if ('width' in image && image.width && 'height' in image && image.height && 'size' in image && image.size) {
                    const historyItem = image as HistoryItem;
                    if (!historyItem.aspectRatio) {
                        historyItem.aspectRatio = getAspectRatio(historyItem.width, historyItem.height);
                    }
                    newHistoryItems.push(historyItem);
                    continue;
                }
                const { width, height } = await getImageDimensions(image.src);
                const size = getFileSizeFromBase64(image.src);
                const aspectRatio = image.aspectRatio || getAspectRatio(width, height);
                newHistoryItems.push({ ...image, width, height, size, analysis: null, aspectRatio });
            } catch (err) {
                 console.error("Could not get image metadata", err);
                 newHistoryItems.push({ ...image, width: undefined, height: undefined, size: undefined, analysis: null, aspectRatio: image.aspectRatio });
            }
        }
        setHistoryItems(prev => [...newHistoryItems, ...prev].slice(0, 25)); // Limit history size
    }, []);
    
    // --- API Handlers ---

    const handleGenerate = useCallback(async (options?: { scenes?: string[], overridePrompt?: string }) => {
        if (!selectedAspectRatio) {
            addToast("請先選擇畫布比例", "error");
            setError("請先選擇畫布比例");
            return;
        }

        const scenesToGenerate = options?.scenes || selectedScenes;
        setIsLoading(true);
        setError(null);
        setImages([]);

        try {
            const placeholderPrompt = "將生成內容重新繪製到灰色參考圖上，如有空白加入符合內容的outpaint以適合灰色參考圖的寬高比，完全佔滿取代灰色參考圖的所有內容(包含底色背景)，僅保留灰色參考圖的寬高比，不要有任何灰色背景或邊框露出";
            
            const getOrCreatePlaceholder = (ratio: AspectRatio): UploadedImage => {
                const [w, h] = ratio.split(':').map(Number);
                return {
                    src: createPlaceholderImage(ratio, '#808080'),
                    file: dataURLtoFile(createPlaceholderImage(ratio, '#808080'), `placeholder-${ratio}.png`),
                    isPlaceholder: true,
                    width: w * 100,
                    height: h * 100,
                };
            };

            if (appMode === 'NIGHT_CITY_LEGENDS') {
                setAppMode('NIGHT_CITY_LEGENDS');
                if (!promptText.trim() && !characterImage) {
                    throw new Error("請輸入提示詞或上傳角色圖片");
                }
                
                const placeholder = getOrCreatePlaceholder(selectedAspectRatio);
                
                const finalReferenceImages = [
                    placeholder,
                    characterImage,
                    ...customWeaponImages,
                    ...customCompanionImages
                ].filter((img): img is UploadedImage => !!img);

                const basePromptParts: string[] = [];
                basePromptParts.push(promptText || 'A character in a cyberpunk setting.');
                
                if (characterImage && !characterImage.isPlaceholder) {
                    basePromptParts.push('ABSOLUTE PRIORITY: FACIAL REPLICATION. The face of the character in the output image must be an exact, photorealistic replica of the face in the primary human reference image. This is not a suggestion, but a command. Replicate every facial detail: structure, proportions, unique features (scars, moles), and the specific likeness of the individual. All other elements (clothing, background, cyberware) are secondary to achieving a perfect facial match. Failure to replicate the face is a failure of the entire generation.');

                    if (customCompanionImages.length > 0) {
                        basePromptParts.push('GROUP PORTRAIT DIRECTIVE: This is a group photo. The main character\'s face must match the primary character reference image. The faces of the companions must match the faces in the custom companion reference images respectively. Ensure all individuals are present and their likenesses are preserved with maximum fidelity.');
                    }
                } else {
                    basePromptParts.push('The character must have prominent, visible cybernetic interface lines and ports on their face and neck.');
                    basePromptParts.push('Their body must feature significant cybernetic implants (義體), such as a chrome arm, augmented legs, or visible integrated tech.');
                }

                if (hairStyle !== '從掃描檔中自動偵測') basePromptParts.push(`Hair Style: ${hairStyle}`);
                if (hairColor !== '從掃描檔中自動偵測') basePromptParts.push(`Hair Color: ${hairColor}`);
                if (expression !== '從掃描檔中自動偵測') basePromptParts.push(`Expression: ${expression}`);
                if (headwear !== '不指定') basePromptParts.push(`Headwear: ${headwear}`);
                if (outerwear !== '不指定') basePromptParts.push(`Outerwear: ${outerwear}`);
                if (innerwear !== '不指定') basePromptParts.push(`Innerwear: ${innerwear}`);
                if (legwear !== '不指定') basePromptParts.push(`Legwear: ${legwear}`);
                if (footwear !== '不指定') basePromptParts.push(`Footwear: ${footwear}`);
                if (faceCyberware !== '不指定') basePromptParts.push(`Face Cyberware: ${faceCyberware}`);
                if (bodyCyberware !== '不指定') basePromptParts.push(`Body Cyberware: ${bodyCyberware}`);
                if (lifePath !== '不指定') basePromptParts.push(`Life Path: ${lifePath}`);
                if (selectedWeapon !== '不裝備') basePromptParts.push(`Wielding weapon: ${selectedWeapon}`);
                if (selectedVehicle !== '不駕駛') basePromptParts.push(`Driving or posing with vehicle: ${selectedVehicle}`);
                if (customWeaponImages.some(img => !img.isPlaceholder)) basePromptParts.push(`The character is equipped with the custom weapon(s) shown in the reference images.`);
                if (selectedCompanion !== '單獨行動') basePromptParts.push(`With companion: ${selectedCompanion}`);
                if (customCompanionImages.length > 0 && !characterImage) basePromptParts.push(`The character is accompanied by the custom companion(s) shown in the reference images.`);
                
                const cinematicPrompt = '8K 超寫實 Path-tracing ,UE 5 超逼真質感, 電影光線氛圍, ultra realistic, 8K Ray-tracing HDR Hyper-Realistic RTX-5090';
                if(isCinematicRealism) {
                    basePromptParts.push(cinematicPrompt);
                }

                basePromptParts.push('The character must have realistic, well-proportioned human anatomy. Avoid exaggerated features like a large head or small body.');
                basePromptParts.push('Negative prompt: deformed, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blurry, mutated hands, fingers, out of focus, long neck, long body, nsfw, hentai, child, childish');
                const dynamicAction = DYNAMIC_ACTION_PROMPTS[Math.floor(Math.random() * DYNAMIC_ACTION_PROMPTS.length)];
                const qualityEnhancer = IMMERSIVE_QUALITY_PROMPTS[Math.floor(Math.random() * IMMERSIVE_QUALITY_PROMPTS.length)];

                let basePrompt = basePromptParts.join(', ');
                basePrompt += `. Action: ${dynamicAction}. Visuals: ${qualityEnhancer}.`;
                basePrompt = `${placeholderPrompt}, ${basePrompt}`;

                if (scenesToGenerate.length > 0) {
                    const allGeneratedImages: GeneratedImage[] = [];
                    addToast(`準備生成 ${scenesToGenerate.length} 個場景...`, 'info');
                    for (const scene of scenesToGenerate) {
                        const sceneDescription = (NIGHT_CITY_SCENE_PROMPTS as Record<string, string>)[scene] || `A scene in ${scene}.`;
                        
                        let missionPrompt = '';
                        if (selectedMission === '隨機任務') {
                            const allMissions = NIGHT_CITY_MISSIONS.flatMap(cat => cat.options);
                            missionPrompt = allMissions[Math.floor(Math.random() * allMissions.length)];
                        } else {
                            missionPrompt = selectedMission;
                        }

                        let scenePrompt = `${basePrompt}. The character is in this scene: ${sceneDescription}. Narrative Focus: ${missionPrompt}.`;
                        
                        let directorStylePrompt = '';
                        const actualDirector = selectedDirector === '隨機導演'
                            ? UNIFIED_DIRECTOR_STYLES.filter(d => d.name !== '隨機導演')[Math.floor(Math.random() * (UNIFIED_DIRECTOR_STYLES.length -1))]
                            : UNIFIED_DIRECTOR_STYLES.find(d => d.name === selectedDirector);
                        
                        if (actualDirector) {
                           directorStylePrompt = actualDirector.prompt;
                        }
                        scenePrompt += ` ${directorStylePrompt}`;
                        
                        const metadataParts = [];
                        if (selectedWeapon !== '不裝備') metadataParts.push(`武器: ${selectedWeapon}`);
                        if (selectedVehicle !== '不駕駛') metadataParts.push(`載具: ${selectedVehicle}`);
                        if (selectedCompanion !== '單獨行動') metadataParts.push(`夥伴: ${selectedCompanion}`);
                        metadataParts.push(`導演: ${selectedDirector === '隨機導演' ? `隨機 (${actualDirector?.name.split(' ')[0]})` : selectedDirector.split(' ')[0]}`);
                        metadataParts.push(`任務: ${selectedMission === '隨機任務' ? `隨機` : selectedMission.substring(0, 10)}`);

                        const altText = `${scene} | ${metadataParts.join(' | ')}`;

                        addToast(`正在生成場景: ${scene}`, 'info');
                        const result = await geminiService.generateImages(scenePrompt, selectedAspectRatio, finalReferenceImages, 1);
                        if (result.length > 0) {
                            const imageWithScene: GeneratedImage = { ...result[0], alt: altText, prompt: scenePrompt, aspectRatio: selectedAspectRatio };
                            allGeneratedImages.push(imageWithScene);
                            setImages(prev => [...prev, imageWithScene]); // Progressive update
                        }
                    }
                    if (allGeneratedImages.length === 0) throw new Error("所有場景生成失敗。");
                    setImages(allGeneratedImages); // Final update
                    addToHistory(allGeneratedImages);
                    addToast(`已完成 ${allGeneratedImages.length} 個場景的生成！`, 'success');
                } else {
                     let finalPrompt = options?.overridePrompt || basePrompt;
                     if (!options?.overridePrompt) {
                         let directorStylePrompt = '';
                         if (selectedDirector !== '隨機導演') {
                             const director = UNIFIED_DIRECTOR_STYLES.find(d => d.name === selectedDirector);
                             directorStylePrompt = director ? director.prompt : '';
                         } else {
                             const actualDirectors = UNIFIED_DIRECTOR_STYLES.filter(d => d.name !== '隨機導演');
                             const randomDirector = actualDirectors[Math.floor(Math.random() * actualDirectors.length)];
                             if (randomDirector) {
                                directorStylePrompt = randomDirector.prompt;
                             }
                         }
                         finalPrompt += ` ${directorStylePrompt}`;
                     }
                    const result = await geminiService.generateImages(finalPrompt, selectedAspectRatio, finalReferenceImages, options?.overridePrompt ? 1 : 4);
                    const imagesWithAR = result.map(img => ({ ...img, prompt: finalPrompt, aspectRatio: selectedAspectRatio }));
                    setImages(imagesWithAR);
                    addToHistory(imagesWithAR);
                }
            } else { // Handle 'GENERATE' mode
                setAppMode('GENERATE');
                if (!promptText.trim() && !referenceImages.some(img => img && !img.isPlaceholder)) {
                    throw new Error("請輸入提示詞或上傳圖片");
                }
                
                const placeholder = getOrCreatePlaceholder(selectedAspectRatio);
                
                const finalReferenceImagesForGenerate = [
                    placeholder,
                    ...referenceImages.filter(img => !img.isPlaceholder),
                ];

                const finalPrompt = `${placeholderPrompt}, ${promptText}`;

                const result = await geminiService.generateImages(finalPrompt, selectedAspectRatio, finalReferenceImagesForGenerate, 4);
                const imagesWithAR = result.map(img => ({ ...img, aspectRatio: selectedAspectRatio }));
                setImages(imagesWithAR);
                addToHistory(imagesWithAR);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : '發生未知錯誤';
            setError(message);
            addToast(`生成失敗: ${message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [
        promptText, selectedAspectRatio, referenceImages, appMode, addToast, addToHistory, selectedScenes,
        characterImage, customWeaponImages, customCompanionImages, selectedWeapon, selectedVehicle, selectedCompanion,
        hairStyle, hairColor, expression, headwear, outerwear, innerwear, legwear, footwear, faceCyberware, bodyCyberware,
        lifePath, selectedDirector, selectedMission, isCinematicRealism
    ]);

    const handleUe5Upgrade = useCallback(async (imageToUpgrade: GeneratedImage) => {
        const isNCLPrompt = imageToUpgrade.prompt && (
            imageToUpgrade.prompt.includes('cyberpunk setting') ||
            imageToUpgrade.prompt.includes('FACIAL REPLICATION') ||
            imageToUpgrade.prompt.includes('Night City')
        );
    
        if (!isNCLPrompt) {
            addToast('此功能僅適用於夜城傳奇模式生成的圖片', 'error');
            return;
        }
        
        // Switch to NCL mode
        setAppMode('NIGHT_CITY_LEGENDS');
        setLightboxConfig(null); // Close lightbox if it's open
    
        // Setup the panel for upgrade
        const file = dataURLtoFile(imageToUpgrade.src, 'upgrade-ref.png');
        const uploaded: UploadedImage = { src: imageToUpgrade.src, file, width: imageToUpgrade.width, height: imageToUpgrade.height };
        setCharacterImage(uploaded);
        
        const cinematicPrompt = '8K 超寫實 Path-tracing ,UE 5 超逼真質感, 電影光線氛圍, ultra realistic, 8K Ray-tracing HDR Hyper-Realistic RTX-5090';
        const upgradedPrompt = imageToUpgrade.prompt ? `${imageToUpgrade.prompt}, ${cinematicPrompt}` : cinematicPrompt;
        setPromptText(upgradedPrompt);
    
        if (imageToUpgrade.aspectRatio && ASPECT_RATIOS.includes(imageToUpgrade.aspectRatio as AspectRatio)) {
            onAspectRatioSelect(imageToUpgrade.aspectRatio as AspectRatio);
        }
        
        // Clear other NCL settings to avoid confusion
        setCustomWeaponImages([]);
        setCustomCompanionImages([]);
        setSelectedWeapon('不裝備');
        setSelectedVehicle('不駕駛');
        setSelectedCompanion('單獨行動');
        setSelectedDirector('隨機導演');
        setSelectedMission('隨機任務');
        setIsCinematicRealism(true); // check the box
        setSelectedScenes([]);
    
        addToast('已為您載入升級設定！請確認後點擊「改裝腦機」。', 'success');
    }, [addToast, onAspectRatioSelect]);

    const handleRandomSceneGeneration = useCallback(async () => {
        if (!characterImage && !promptText) {
            addToast("請先設定角色", "error");
            return;
        }
    
        const allScenes = [...NIGHT_CITY_LEGENDS_SCENES.nightCity, ...NIGHT_CITY_LEGENDS_SCENES.dogtown];
        const shuffled = allScenes.sort(() => 0.5 - Math.random());
        const randomScenes = shuffled.slice(0, 5);
        
        setSelectedScenes(randomScenes);
        addToast(`已隨機選擇5個場景，開始生成幻夢...`, 'info');
        await handleGenerate({ scenes: randomScenes });

    }, [promptText, characterImage, handleGenerate, addToast]);

    const handleRemoveBackground = useCallback(async () => {
        if (!uploadedImage) {
            addToast("請先上傳圖片", "error");
            return;
        }
        setIsLoading(true);
        setError(null);
        setImages([]);

        try {
            const resultBase64 = await geminiService.removeBackground(uploadedImage.file, addGreenScreen);
            const resultSrc = `data:image/png;base64,${resultBase64}`;
            const newImage: Omit<GeneratedImage, 'width'|'height'|'size'> = {
                id: crypto.randomUUID(),
                src: resultSrc,
                alt: `${uploadedImage.file.name} - background removed`,
                prompt: `Remove background from original image, green screen: ${addGreenScreen}`
            };
            setImages([newImage]);
            addToHistory([newImage]);
        } catch (err) {
            const message = err instanceof Error ? err.message : '發生未知錯誤';
            setError(message);
            addToast(`去背失敗: ${message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [uploadedImage, addGreenScreen, addToast, addToHistory]);

    const handleOptimizePrompt = useCallback(async () => {
        const currentPrompt = appMode === 'VEO' ? veoPrompt : promptText;
        if (!currentPrompt.trim()) {
            addToast("請先輸入要優化的提示詞", "error");
            return;
        }
        setIsOptimizing(true);
        try {
            const optimized = await geminiService.optimizePrompt(currentPrompt);
            if (appMode === 'VEO') {
                setVeoPrompt(optimized);
            } else {
                setPromptText(optimized);
            }
            addToast("提示詞已優化", "success");
        } catch (err) {
            addToast(`優化失敗: ${err instanceof Error ? err.message : '未知錯誤'}`, 'error');
        } finally {
            setIsOptimizing(false);
        }
    }, [promptText, veoPrompt, appMode, addToast]);

    // --- VEO Handlers ---
    const handleGenerateVeo = useCallback(async (paramsOverride?: VeoParams) => {
        const paramsToUse = paramsOverride || { prompt: veoPrompt, startFrame, endFrame, aspectRatio: veoAspectRatio, duration: videoDuration };
        
        if (!paramsToUse.prompt.trim()) {
            addToast("請輸入影片提示詞", "error");
            return;
        }
        if (!paramsToUse.aspectRatio) {
            addToast("請先選擇影片寬高比", "error");
            return;
        }

        setIsGeneratingVideo(true);
        setError(null);
        
        try {
            const director = UNIFIED_DIRECTOR_STYLES.find(d => d.name === selectedVeoDirector);
            const directorPrompt = director ? director.prompt : '';

            // If a random director is selected, pick one from the list
            let finalDirectorPrompt = directorPrompt;
            if (selectedVeoDirector === '隨機導演') {
                 const actualDirectors = UNIFIED_DIRECTOR_STYLES.filter(d => d.name !== '隨機導演');
                 const randomDirector = actualDirectors[Math.floor(Math.random() * actualDirectors.length)];
                 finalDirectorPrompt = randomDirector.prompt;
            }
            
            const paramsWithDirector = {
                ...paramsToUse,
                prompt: `${paramsToUse.prompt} ${finalDirectorPrompt}`.trim(),
            };

            const result = await geminiService.generateVeoVideo(paramsWithDirector, addToast);
            const newHistory = [result, ...veoHistory];
            setVeoHistory(newHistory);
            setCurrentVeoVideo(result);
            setLastVeoSuccessParams(paramsWithDirector);
            addToast("影片生成成功！", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : '發生未知錯誤';
            setError(message);
            addToast(`影片生成失敗: ${message}`, 'error');
        } finally {
            setIsGeneratingVideo(false);
        }
    }, [veoPrompt, startFrame, endFrame, veoAspectRatio, videoDuration, addToast, veoHistory, selectedVeoDirector]);

    const handleVeoImageChange = useCallback(async (
        newStartFrame: UploadedImage | null,
        newEndFrame: UploadedImage | null
    ) => {
        if (!newStartFrame && !newEndFrame) return;

        setIsAnalyzingFrames(true);
        addToast("AI導演分析中...", "info");
        try {
            let directorPrompt = '';
            if (newStartFrame && newEndFrame) {
                directorPrompt = await geminiService.createDirectorScript(newStartFrame.file, newEndFrame.file);
            } else if (newStartFrame || newEndFrame) {
                const imageFile = (newStartFrame || newEndFrame)!.file;
                directorPrompt = await geminiService.describeImageForVideo(imageFile);
            }
            setVeoPrompt(directorPrompt);
            addToast("提示詞已自動生成！", "success");
        } catch (err) {
            addToast(`AI導演分析失敗: ${err instanceof Error ? err.message : '未知錯誤'}`, 'error');
        } finally {
            setIsAnalyzingFrames(false);
        }
    }, [addToast]);

    const handleStartFrameChange = useCallback((image: UploadedImage | null) => {
        setStartFrame(image);
        handleVeoImageChange(image, endFrame);
    }, [endFrame, handleVeoImageChange]);

    const handleEndFrameChange = useCallback((image: UploadedImage | null) => {
        setEndFrame(image);
        handleVeoImageChange(startFrame, image);
    }, [startFrame, handleVeoImageChange]);

    const handleVeoRegenerate = useCallback(() => {
        const paramsToRegen = currentVeoVideo || lastVeoSuccessParams;
        if (paramsToRegen) {
            handleGenerateVeo(paramsToRegen);
        } else {
            addToast("沒有可再生成的設定", "info");
        }
    }, [currentVeoVideo, lastVeoSuccessParams, handleGenerateVeo, addToast]);

    const handleVeoUseText = useCallback(() => {
        if (currentVeoVideo) {
            setVeoPrompt(currentVeoVideo.prompt);
            setStartFrame(null);
            setEndFrame(null);
            addToast("已使用影片文字並清除圖片", "success");
            setCurrentVeoVideo(null); // Clear video to reflect change
        } else {
             addToast("沒有可使用的文字", "info");
        }
    }, [currentVeoVideo, addToast]);

    const handleVeoRestore = useCallback(() => {
        const paramsToRestore = currentVeoVideo || lastVeoSuccessParams;
        if (paramsToRestore) {
            setVeoPrompt(paramsToRestore.prompt);
            setStartFrame(paramsToRestore.startFrame);
            setEndFrame(paramsToRestore.endFrame);
            if (paramsToRestore.aspectRatio) {
              setVeoAspectRatio(paramsToRestore.aspectRatio);
            }
            setVideoDuration(paramsToRestore.duration);
            addToast("已還原設定", "success");
        } else {
            addToast("沒有可還原的設定", "info");
        }
    }, [currentVeoVideo, lastVeoSuccessParams, addToast]);

    const handleVeoDelete = (id: string) => {
        if (currentVeoVideo?.id === id) {
            const currentIndex = veoHistory.findIndex(item => item.id === id);
            if (veoHistory.length > 1) {
                const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                setCurrentVeoVideo(veoHistory[nextIndex] || null);
            } else {
                 setCurrentVeoVideo(null);
            }
        }
        setVeoHistory(h => h.filter(item => item.id !== id));
    };

    const handleSendImageToVeo = useCallback(async (item: GeneratedImage, frame: 'start' | 'end') => {
        const file = dataURLtoFile(item.src, `veo-frame-${frame}.png`);
        const uploadedImage: UploadedImage = { 
            src: item.src, 
            file, 
            width: item.width, 
            height: item.height 
        };
        
        if (frame === 'start') {
            handleStartFrameChange(uploadedImage);
        } else {
            handleEndFrameChange(uploadedImage);
        }
        
        setAppMode('VEO');
        setLightboxConfig(null);
        addToast(`圖片已傳送至 ${frame === 'start' ? '首幀' : '尾幀'}`, 'success');
    }, [addToast, handleStartFrameChange, handleEndFrameChange]);

    // --- UI Handlers ---

    const handleCustomImageUpload = useCallback(async (newImages: UploadedImage[], type: 'weapon' | 'companion') => {
        const setImageState = type === 'weapon' ? setCustomWeaponImages : setCustomCompanionImages;
        
        const imagesWithProcessing = newImages.map(img => ({ ...img, isProcessing: true }));
        setImageState(prev => [...prev, ...imagesWithProcessing].slice(0, 8));

        for (const image of imagesWithProcessing) {
            if (!image.id) continue;
            try {
                const resultBase64 = await geminiService.removeBackground(image.file, false);
                const finalSrc = `data:image/png;base64,${resultBase64}`;
                const file = dataURLtoFile(finalSrc, `processed-${image.file.name}`);
                const { width, height } = await getImageDimensions(finalSrc);

                setImageState(prev => prev.map(p => 
                    p.id === image.id 
                        ? { ...p, src: finalSrc, file, width, height, isProcessing: false, isPlaceholder: false } 
                        : p
                ));
            } catch (err) {
                console.error('Auto background removal failed:', err);
                addToast(`自動去背失敗: ${image.file.name}`, 'error');
                setImageState(prev => prev.map(p => p.id === image.id ? { ...p, isProcessing: false, hasError: true } : p));
            }
        }
    }, [addToast]);

    const onClearSettings = useCallback(() => {
        setPromptText('');
        setReferenceImages([]);
        setSelectedAspectRatio(null);
        setInspiredPromptPart('');
        setSelectedScenes([]);
        // NCL state
        setCharacterImage(null);
        setCustomWeaponImages([]);
        setCustomCompanionImages([]);
        setSelectedWeapon('不裝備');
        setSelectedVehicle('不駕駛');
        setSelectedCompanion('單獨行動');
        setHairStyle('從掃描檔中自動偵測');
        setHairColor('從掃描檔中自動偵測');
        setExpression('從掃描檔中自動偵測');
        setHeadwear('不指定');
        setOuterwear('不指定');
        setInnerwear('不指定');
        setLegwear('不指定');
        setFootwear('不指定');
        setFaceCyberware('不指定');
        setBodyCyberware('不指定');
        setLifePath('不指定');
        setSelectedDirector('隨機導演');
        setSelectedMission('隨機任務');
        setNclPlaceholderImage(null);
        setIsCinematicRealism(false);
        addToast("設定已清除");
    }, [addToast]);
    
    const onClearVeoSettings = useCallback(() => {
        setVeoPrompt('');
        setStartFrame(null);
        setEndFrame(null);
        setVeoAspectRatio(null);
        setVideoDuration(5);
        setSelectedVeoDirector('隨機導演');
        addToast("Veo 設定已清除");
    }, [addToast]);
    
    const onInspirePrompt = useCallback(async () => {
        setIsOptimizing(true); // Reuse optimizing state for loading indicator
        try {
            const inspired = await geminiService.inspirePrompt();
            
            const updater = (currentPrompt: string) => {
                if (inspiredPromptPart && currentPrompt.includes(inspiredPromptPart)) {
                    return currentPrompt.replace(inspiredPromptPart, inspired);
                }
                return currentPrompt ? `${currentPrompt.trim()}\n\n${inspired}` : inspired;
            };

            if (appMode === 'VEO') {
                setVeoPrompt(updater);
            } else {
                setPromptText(updater);
                setInspiredPromptPart(inspired);
            }
        } catch(err) {
            addToast(`靈感獲取失敗: ${err instanceof Error ? err.message : '未知錯誤'}`, 'error');
        } finally {
            setIsOptimizing(false);
        }
    }, [appMode, addToast, inspiredPromptPart]);
    
    const onUseImage = useCallback((image: GeneratedImage, action: 'reference' | 'remove_bg' | 'draw_bg') => {
        const file = dataURLtoFile(image.src, `used-${image.id}.png`);
        const uploaded: UploadedImage = { src: image.src, file, width: image.width, height: image.height };
    
        switch(action) {
            case 'reference':
                // Always send to generic generate mode's reference images
                setReferenceImages(prev => [...prev.filter(i => !i.isPlaceholder), uploaded].slice(0, 8));
                
                // NEW: Update the main aspect ratio selector to match the used image
                if (image.aspectRatio && ASPECT_RATIOS.includes(image.aspectRatio as AspectRatio)) {
                    onAspectRatioSelect(image.aspectRatio as AspectRatio);
                }
                
                setAppMode('GENERATE');
                addToast("圖片已添加至參考圖", "success");
                break;
            case 'remove_bg':
                setUploadedImage(uploaded);
                setAppMode('REMOVE_BG');
                break;
            case 'draw_bg':
                setDrawBackgroundImage(image.src);
                setAppMode('DRAW');
                addToast("圖片已設為畫布背景", "success");
                break;
        }
        setLightboxConfig(null);
    }, [addToast, onAspectRatioSelect]);
    
    const onUseHistoryImage = useCallback((item: HistoryItem, targetMode: AppMode) => {
        const file = dataURLtoFile(item.src, `history-img.png`);
        const uploaded: UploadedImage = { src: item.src, file, width: item.width, height: item.height };

        if (targetMode === 'REMOVE_BG') {
            setUploadedImage(uploaded);
            setAppMode('REMOVE_BG');
        } else if (targetMode === 'DRAW') {
            setDrawBackgroundImage(item.src);
            setAppMode('DRAW');
        } else if (targetMode === 'GENERATE') {
             setReferenceImages(prev => [...prev, uploaded].slice(0, 8));
             setAppMode('GENERATE');
        } else if (targetMode === 'NIGHT_CITY_LEGENDS') {
            if (!characterImage) setCharacterImage(uploaded);
            setAppMode('NIGHT_CITY_LEGENDS');
        }
    }, [characterImage]);

    const onUpscale = useCallback(async (src: string) => {
        setIsLoading(true);
        setError(null);
        setImages([]);
        setAppMode('GENERATE');
        setLightboxConfig(null);

        try {
            const file = dataURLtoFile(src, 'upscale.png');
            const resultBase64 = await geminiService.upscaleImage(file);
            const resultSrc = `data:image/png;base64,${resultBase64}`;
            const newImage: Omit<GeneratedImage, 'width'|'height'|'size'> = {
                id: crypto.randomUUID(),
                src: resultSrc,
                alt: 'Upscaled image',
                prompt: 'Upscaled image'
            };
            setImages([newImage]);
            addToHistory([newImage]);
            addToast("圖片畫質已提升", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : '未知錯誤';
            setError(message);
            addToast(`提升畫質失敗: ${message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast, addToHistory]);

    const onZoomOut = useCallback(async (item: GeneratedImage) => {
        setIsLoading(true);
        setError(null);
        setImages([]);
        setAppMode('GENERATE');
        setLightboxConfig(null);

        try {
            const file = dataURLtoFile(item.src, 'zoomout.png');
            const resultBase64 = await geminiService.zoomOutImage(file);
            const resultSrc = `data:image/png;base64,${resultBase64}`;
            const newImage: Omit<GeneratedImage, 'width'|'height'|'size'> = {
                id: crypto.randomUUID(),
                src: resultSrc,
                alt: 'Zoomed out image',
                prompt: item.prompt
            };
            setImages([newImage]);
            addToHistory([newImage]);
            addToast("圖片已擴圖", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : '未知錯誤';
            setError(message);
            addToast(`擴圖失敗: ${message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast, addToHistory]);

    const handlePromptSelect = (p: string) => {
        setPromptText(p);
        setAppMode('GENERATE');
    };
    
    const handleUseDrawing = useCallback(async () => {
        if (!drawCanvasRef.current) return;
        if (!drawAspectRatio) {
            addToast("請先選擇畫布比例", "error");
            return;
        }
        const dataUrl = drawCanvasRef.current.exportImage();
        const file = dataURLtoFile(dataUrl, 'drawing.png');
        const { width, height } = await getImageDimensions(dataUrl);
        const uploaded = { src: dataUrl, file, width, height };
        if (appMode === 'NIGHT_CITY_LEGENDS') {
            if (!characterImage) setCharacterImage(uploaded);
        } else {
            setReferenceImages([uploaded]);
        }
        setAppMode(appMode === 'NIGHT_CITY_LEGENDS' ? 'NIGHT_CITY_LEGENDS' : 'GENERATE');
        addToast("畫布已作為參考圖", "success");
    }, [addToast, appMode, characterImage, drawAspectRatio]);

    const handleDownloadDrawing = useCallback(() => {
        if (!drawCanvasRef.current) return;
        const dataUrl = drawCanvasRef.current.exportImage();
        downloadImage(dataUrl, 'drawing.png');
        addToast("畫布已下載", "success");
    }, [addToast]);

    const handleHistorySelect = useCallback(async (item: HistoryItem) => {
        setSelectedHistoryItem(item);
        if (item.analysis) return; // Don't re-analyze

        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const analysisResult = await geminiService.analyzeImage(dataURLtoFile(item.src, 'analysis.png'));
            const updatedHistory = historyItems.map(h => h.id === item.id ? { ...h, analysis: analysisResult } : h);
            setHistoryItems(updatedHistory);
            setSelectedHistoryItem(prev => prev ? { ...prev, analysis: analysisResult } : null);
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : '分析失敗');
        } finally {
            setIsAnalyzing(false);
        }
    }, [historyItems]);
    
     // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
             const key = e.key.toLowerCase();
             const isMod = e.ctrlKey || e.metaKey;

             if (isMod && key === 'enter') {
                 e.preventDefault();
                 if (appMode === 'GENERATE' || appMode === 'NIGHT_CITY_LEGENDS') handleGenerate();
                 else if (appMode === 'REMOVE_BG') handleRemoveBackground();
                 else if (appMode === 'DRAW') handleUseDrawing();
                 else if (appMode === 'VEO') handleGenerateVeo();
             }
             if (isMod && key === 'o') { e.preventDefault(); handleOptimizePrompt(); }
             if (isMod && key === 'i') { e.preventDefault(); onInspirePrompt(); }
             if (isMod && key === 'backspace') {
                 e.preventDefault();
                 if (appMode === 'VEO') {
                    onClearVeoSettings();
                 } else {
                    onClearSettings();
                 }
             }
             
             if (appMode === 'DRAW') {
                if (isMod && key === 'z') { e.preventDefault(); drawCanvasRef.current?.undo(); }
                if (key === '[') setBrushSize(s => Math.max(1, s-1));
                if (key === ']') setBrushSize(s => Math.min(100, s+1));
             }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [appMode, handleGenerate, handleRemoveBackground, handleUseDrawing, handleOptimizePrompt, onInspirePrompt, onClearSettings, handleGenerateVeo, onClearVeoSettings]);
    
    // --- Paste from clipboard ---
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const targetRatio = appMode === 'DRAW' ? drawAspectRatio : (appMode === 'VEO' ? veoAspectRatio : selectedAspectRatio);
            if (!targetRatio) {
                addToast('請先選擇長寬比例再貼上圖片', 'error');
                e.preventDefault();
                return;
            }

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                            const src = event.target?.result as string;
                            const croppedSrc = await cropImageToAspectRatio(src, targetRatio);
                            const croppedFile = dataURLtoFile(croppedSrc, file.name);
                            const { width, height } = await getImageDimensions(croppedSrc);

                            const uploaded: UploadedImage = { src: croppedSrc, file: croppedFile, width, height, id: crypto.randomUUID() };
                            if (appMode === 'REMOVE_BG') {
                                setUploadedImage(uploaded);
                            } else if (appMode === 'GENERATE') {
                                setReferenceImages(prev => [...prev, uploaded].slice(0, 8));
                            } else if (appMode === 'NIGHT_CITY_LEGENDS') {
                                if (!characterImage) {
                                    setCharacterImage(uploaded);
                                } else {
                                     handleCustomImageUpload([uploaded], customWeaponImages.length < 8 ? 'weapon' : 'companion');
                                }
                            } else if (appMode === 'VEO') {
                                if (!startFrame) {
                                    handleStartFrameChange(uploaded);
                                } else if (!endFrame) {
                                    handleEndFrameChange(uploaded);
                                }
                            }
                            addToast('圖片已從剪貼簿貼上並裁切', 'success');
                        };
                        reader.readAsDataURL(file);
                    }
                    e.preventDefault();
                    return;
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [appMode, addToast, startFrame, endFrame, characterImage, customWeaponImages, customCompanionImages, handleStartFrameChange, handleEndFrameChange, handleCustomImageUpload, selectedAspectRatio, drawAspectRatio, veoAspectRatio]);
    
    // --- Render Logic ---

    const renderMainPanel = () => {
        switch (appMode) {
            case 'HISTORY':
                return <HistoryPanel
                    history={historyItems}
                    selectedItem={selectedHistoryItem}
                    onSelectItem={handleHistorySelect}
                    isAnalyzing={isAnalyzing}
                    analysisError={analysisError}
                    onDeleteHistoryItem={(id) => {
                        setHistoryItems(h => h.filter(item => item.id !== id));
                        if(selectedHistoryItem?.id === id) setSelectedHistoryItem(null);
                    }}
                    onClearHistory={() => setHistoryItems([])}
                    onSetLightboxConfig={(images, startIndex) => setLightboxConfig({ images, startIndex })}
                    addToast={addToast}
                    onUseImage={onUseHistoryImage}
                    onUpscale={onUpscale}
                    onZoomOut={(item) => onZoomOut(item)}
                    onSendImageToVeo={handleSendImageToVeo}
                    onUe5Upgrade={handleUe5Upgrade}
                />;
            case 'DRAW':
                return <main className="flex-1 flex flex-col p-2 md:p-4 bg-transparent min-w-0"><DrawingCanvas 
                    ref={drawCanvasRef}
                    tool={drawTool}
                    brushSize={brushSize}
                    fillColor={fillColor}
                    strokeColor={strokeColor}
                    backgroundColor={canvasBackgroundColor}
                    aspectRatio={drawAspectRatio}
                    backgroundImage={drawBackgroundImage}
                /></main>
            case 'VEO':
                return <VeoPanel 
                    history={veoHistory}
                    onDelete={handleVeoDelete}
                    isLoading={isGeneratingVideo}
                    currentVideo={currentVeoVideo}
                    onPlay={setCurrentVeoVideo}
                    onRegenerate={handleVeoRegenerate}
                    onUseText={handleVeoUseText}
                    onRestore={handleVeoRestore}
                    addToast={addToast}
                />;
            default:
                return <ResultPanel
                    appMode={appMode}
                    images={images}
                    isLoading={isLoading}
                    error={error}
                    onPromptSelect={handlePromptSelect}
                    onUpscale={onUpscale}
                    onZoomOut={onZoomOut}
                    onSetLightboxConfig={(images, startIndex) => setLightboxConfig({ images, startIndex })}
                    onUseImage={onUseImage}
                    onSendImageToVeo={handleSendImageToVeo}
                    onUe5Upgrade={handleUe5Upgrade}
                />;
        }
    };
    
    const controlPanelProps = {
        appMode, setAppMode, onGenerate: handleGenerate, onRemoveBackground: handleRemoveBackground,
        isLoading, uploadedImage, setUploadedImage,
        prompt: promptText, setPrompt: setPromptText, selectedAspectRatio, onAspectRatioSelect: onAspectRatioSelect, isOptimizing,
        onOptimizePrompt: handleOptimizePrompt, onInspirePrompt, onClearSettings, addGreenScreen, setAddGreenScreen,
        drawTool, setDrawTool, brushSize, onBrushSizeChange: setBrushSize, fillColor, setFillColor, strokeColor, setStrokeColor,
        drawAspectRatio, setDrawAspectRatio, canvasBackgroundColor, setCanvasBackgroundColor,
        onClearCanvas: () => drawCanvasRef.current?.clear(),
        onUndoCanvas: () => drawCanvasRef.current?.undo(),
        onDownloadCanvas: handleDownloadDrawing,
        onUseDrawing: handleUseDrawing,
        onDrawBackgroundUpload: (file: File | null) => {
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => setDrawBackgroundImage(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                setDrawBackgroundImage(null);
            }
        },
        drawBackgroundImage,
        isControlPanelOpen, setIsControlPanelOpen, isMobile, modifierKey,
        isSuggestingEdit,
        theme, setTheme,
        addToast,
        // Generic Generate Mode Props (now used by non-NCL generate)
        referenceImages, setReferenceImages,
        onRemoveReferenceImage: (index: number) => setReferenceImages(imgs => imgs.filter((_, i) => i !== index)),
        // Night City Legends Props
        characterImage, setCharacterImage,
        customWeaponImages, setCustomWeaponImages,
        customCompanionImages, setCustomCompanionImages,
        handleCustomImageUpload,
        selectedWeapon, setSelectedWeapon,
        selectedVehicle, setSelectedVehicle,
        selectedCompanion, setSelectedCompanion,
        hairStyle, setHairStyle,
        hairColor, setHairColor,
        expression, setExpression,
        headwear, setHeadwear,
        outerwear, setOuterwear,
        innerwear, setInnerwear,
        legwear, setLegwear,
        footwear, setFootwear,
        faceCyberware, setFaceCyberware,
        bodyCyberware, setBodyCyberware,
        lifePath, setLifePath,
        selectedScenes, setSelectedScenes, onRandomSceneGenerate: handleRandomSceneGeneration,
        selectedDirector, setSelectedDirector,
        selectedMission, setSelectedMission,
        nclPlaceholderImage, isCinematicRealism, setIsCinematicRealism,
        // VEO Props
        veoPrompt, setVeoPrompt, startFrame, onStartFrameChange: handleStartFrameChange, endFrame, onEndFrameChange: handleEndFrameChange,
        veoAspectRatio, setVeoAspectRatio, videoDuration, setVideoDuration, onGenerateVeo: handleGenerateVeo, isGeneratingVideo, isAnalyzingFrames,
        selectedVeoDirector, setSelectedVeoDirector
    };

    return (
        <div className="h-screen bg-transparent text-white flex overflow-hidden">
            <ControlPanel {...controlPanelProps} />
            <div className="flex-1 flex flex-col relative min-w-0 main-content-area">
                {!isControlPanelOpen && (
                    <button onClick={() => setIsControlPanelOpen(true)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800/80 rounded-md">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                )}
                {renderMainPanel()}
            </div>

            {lightboxConfig && (
                <Lightbox
                    config={lightboxConfig}
                    onClose={() => setLightboxConfig(null)}
                    onUpscale={onUpscale}
                    onZoomOut={onZoomOut}
                    onUseImage={onUseImage}
                    onSendImageToVeo={handleSendImageToVeo}
                    onUe5Upgrade={handleUe5Upgrade}
                />
            )}
            
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] space-y-2">
                {toasts.map(toast => (
                    <div key={toast.id} className={`themed-panel border-2 px-4 py-2 rounded-md text-sm font-semibold shadow-lg animate-fade-in-out ${
                        toast.type === 'success' ? 'border-green-400 text-green-300' :
                        toast.type === 'error' ? 'border-red-500 text-red-300' : 'border-cyan-400 text-cyan-300'
                    }`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;