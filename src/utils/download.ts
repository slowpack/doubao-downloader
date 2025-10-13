import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const downloadImage = async (url: string): Promise<Blob> => {
  try {
    const timestamp = new Date().getTime();
    const requestUrl = url.includes('?') 
      ? `${url}&timestamp=${timestamp}` 
      : `${url}?timestamp=${timestamp}`;

    const response = await fetch(requestUrl, {
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
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || 'image';
    return fileName.split('.').slice(0, -1).join('.') || fileName;
  } catch {
    return `image_${Date.now()}`;
  }
};


const getImageExtension = (blob: Blob): string => {
  const type = blob.type;
  if (type.includes('jpeg')) return 'jpg';
  if (type.includes('png')) return 'png';
  if (type.includes('gif')) return 'gif';
  if (type.includes('webp')) return 'webp';
  if (type.includes('svg')) return 'svg';
  return 'jpg';
};

interface DownloadOptions {
  zipName?: string;
  onProgress?: (current: number, total: number) => void;
  onError?: (url: string, error: Error) => void;
}

/**
 * 下载图片列表并打包为ZIP
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
          const baseName = getFileNameFromUrl(url);
          const extension = getImageExtension(blob);
          const fileName = `${baseName}.${extension}`;
        
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