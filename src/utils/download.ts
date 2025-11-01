import pLimit from "p-limit";
import streamSaver from "streamsaver";
import { saveAs } from "file-saver";
import createZipWriter from "@/lib/zip-stream";

// 配置 StreamSaver mitm URL (用于支持旧浏览器)
if (typeof window !== "undefined") {
  streamSaver.mitm =
    "https://jimmywarting.github.io/StreamSaver.js/mitm.html?version=2.0.0";
}

const downloadImage = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error(`下载图片 ${url} 失败:`, error);
    throw error;
  }
};

// 从URL提取文件名
const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split("/").pop() || "image";
    return fileName;
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
 * streamsaver + zip-stream
 * @param imageUrls 图片列表
 * @param zipName 压缩包名称
 * @param onProgress 进度回调
 * @param onError 错误回调
 */
const createZipStreamWithZipStreamLib = async (
  imageUrls: string[],
  zipName: string,
  onProgress: (current: number, total: number) => void,
  onError: (url: string, error: Error) => void
): Promise<void> => {
  const total = imageUrls.length;
  let completed = 0;

  const fileStream = streamSaver.createWriteStream(`${zipName}.zip`);
  const writer = fileStream.getWriter();

  const zipReadableStream = createZipWriter({
    async start(zipWriter) {
      
      const concurrency = 5;
      const limit = pLimit(concurrency);

      const downloadPromises = imageUrls.map((url) =>
        limit(async () => {
          try {
            const blob = await downloadImage(url);
            const fileName = getFileNameFromUrl(url);
            return { url, fileName, blob, success: true as const };
          } catch (error) {
            onError(url, error as Error);
            return { url, fileName: "", blob: null, success: false as const };
          }
        })
      );

      const downloadResults = await Promise.all(downloadPromises);

      for (const result of downloadResults) {
        if (result.success && result.blob) {
          const imageStream = result.blob.stream();

          zipWriter.enqueue({
            name: result.fileName,
            lastModified: Date.now(),
            directory: false,
            stream: () => imageStream,
          });

          completed++;
          onProgress(completed, total);
        }
      }

      zipWriter.close();
    },
  });

  try {
    const reader = zipReadableStream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writer.write(value);
    }

    await writer.close();
  } catch (error) {
    console.error("ZIP打包或下载失败:", error);
    await writer.abort();
    throw error;
  }
};

const downloadImagesAsZip = async (
  imageUrls: string[],
  options: DownloadOptions = {}
): Promise<void> => {
  const {
    zipName = "images",
    onProgress = () => {},
    onError = () => {},
  } = options;

  if (!imageUrls.length) {
    console.warn("没有需要下载的图片");
    return;
  }

  // 单张图片直接用file-saver下载
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

  // 多张图片使用streamsaver+zip-stream打包下载
  try {
    await createZipStreamWithZipStreamLib(
      imageUrls,
      zipName,
      onProgress,
      onError
    );
  } catch (error) {
    console.error("批量下载失败:", error);
    throw error;
  }
};

export default downloadImagesAsZip;
