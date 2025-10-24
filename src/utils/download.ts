import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const downloadImage = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error(`下载图片 ${url} 失败:`, error);
    throw error;
  }
};


const getFileNameFromUrl = (url: string): string => {
  // url template ../rc_gen_image/*********.jpeg~tplv-****-image_raw.png?rcl=....
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || 'image';
    return fileName
  } catch {
    return `image_${Date.now()}`;
  }
};


interface DownloadOptions {
  zipName?: string;
  onProgress?: (current: number, total: number) => void;
  onError?: (url: string, error: Error) => void;
}

/**
 * 下载图片列表并打包为ZIP，如果是单个图片，则直接下载
 * @param imageUrls 图片URL数组
 * @param options 下载配置
 */
const downloadImagesAsZip = async (
  imageUrls: string[],
  options: DownloadOptions = {}
): Promise<void> => {
  const {
    zipName = 'images',
    onProgress = () => {},
    onError = () => {}
  } = options;

  if (!imageUrls.length) {
    console.warn('没有需要下载的图片');
    return;
  }

  // 单张图片直接下载
  if (imageUrls.length === 1) {
    try {
      const url = imageUrls[0];
      const blob = await downloadImage(url);
      const fileName = getFileNameFromUrl(url);
      saveAs(blob, fileName);
      onProgress(1, 1);
    } catch (error) {
      onError(imageUrls[0], error as Error);
    }
    return;
  }

  const zip = new JSZip();
  const total = imageUrls.length;
  let completed = 0;

  const concurrency = 5; // 同时下载的图片数量
  const chunks: string[][] = [];
  
  for (let i = 0; i < total; i += concurrency) {
    chunks.push(imageUrls.slice(i, i + concurrency));
  }

  try {
    for (const chunk of chunks) {
      const promises = chunk.map(async (url) => {
        try {
          const blob = await downloadImage(url);
          const fileName = getFileNameFromUrl(url);
        
          zip.file(fileName, blob);
          
          completed++;
          onProgress(completed, total);
        } catch (error) {
          onError(url, error as Error);
        }
      });
      await Promise.all(promises);
    }

    const content = await zip.generateAsync(
      { type: 'blob' },
    );

    saveAs(content, `${zipName}.zip`);
  } catch (error) {
    console.error('打包ZIP失败:', error);
    throw error;
  }
};

export default downloadImagesAsZip;