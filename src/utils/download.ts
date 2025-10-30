import streamSaver from 'streamsaver';
import { saveAs } from 'file-saver';

// 配置 StreamSaver mitm URL (用于支持旧浏览器)
if (typeof window !== 'undefined') {
  streamSaver.mitm = 'https://jimmywarting.github.io/StreamSaver.js/mitm.html?version=2.0.0';
}

// CRC32 校验码计算 (ZIP 文件必需)
const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    table[i] = crc;
  }
  return table;
})();

const calculateCRC32 = (data: Uint8Array): number => {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crc32Table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

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
 * 使用 StreamSaver 创建 ZIP 文件流
 */
const createZipStream = async (
  imageUrls: string[],
  zipName: string,
  onProgress: (current: number, total: number) => void,
  onError: (url: string, error: Error) => void
): Promise<void> => {
  const total = imageUrls.length;
  let completed = 0;

  // 创建可写流
  const fileStream = streamSaver.createWriteStream(`${zipName}.zip`);
  const writer = fileStream.getWriter();

  try {
    // 简单的 ZIP 文件格式实现
    const encoder = new TextEncoder();
    // 修复内存泄漏: 只保存元数据,不保存完整图片数据
    // 添加 CRC32 到元数据中
    const files: Array<{ name: string; size: number; offset: number; crc32: number }> = [];
    let currentOffset = 0;

    // 下载所有图片并写入 ZIP
    // 修复: 并发下载但顺序写入,避免 writer 和 offset 的竞态条件
    const concurrency = 5;
    const chunks: string[][] = [];

    for (let i = 0; i < total; i += concurrency) {
      chunks.push(imageUrls.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      // 并发下载图片数据,但只保存必要信息
      const downloadPromises = chunk.map(async (url) => {
        try {
          const blob = await downloadImage(url);
          const fileName = getFileNameFromUrl(url);
          const arrayBuffer = await blob.arrayBuffer();
          const data = new Uint8Array(arrayBuffer);
          return { url, fileName, data, success: true as const };
        } catch (error) {
          onError(url, error as Error);
          return { url, fileName: '', data: null, success: false as const, error };
        }
      });

      // 等待当前批次下载完成
      const downloadResults = await Promise.all(downloadPromises);

      // 立即顺序写入并释放内存
      for (const result of downloadResults) {
        if (result.success && result.data) {
          const { fileName, data } = result;

          // 计算 CRC32 校验码
          const crc32 = calculateCRC32(data);

          // 写入本地文件头
          const fileNameBytes = encoder.encode(fileName);
          const localFileHeader = new Uint8Array(30 + fileNameBytes.length);

          // 本地文件头签名
          localFileHeader[0] = 0x50; // 'P'
          localFileHeader[1] = 0x4b; // 'K'
          localFileHeader[2] = 0x03;
          localFileHeader[3] = 0x04;

          // 版本
          localFileHeader[4] = 0x14;
          localFileHeader[5] = 0x00;

          // 通用位标志
          localFileHeader[6] = 0x00;
          localFileHeader[7] = 0x00;

          // 压缩方法 (0 = 不压缩)
          localFileHeader[8] = 0x00;
          localFileHeader[9] = 0x00;

          // CRC32 校验码 (修复解压错误)
          localFileHeader[14] = crc32 & 0xff;
          localFileHeader[15] = (crc32 >> 8) & 0xff;
          localFileHeader[16] = (crc32 >> 16) & 0xff;
          localFileHeader[17] = (crc32 >> 24) & 0xff;

          // 压缩大小
          const size = data.length;
          localFileHeader[18] = size & 0xff;
          localFileHeader[19] = (size >> 8) & 0xff;
          localFileHeader[20] = (size >> 16) & 0xff;
          localFileHeader[21] = (size >> 24) & 0xff;

          // 未压缩大小
          localFileHeader[22] = size & 0xff;
          localFileHeader[23] = (size >> 8) & 0xff;
          localFileHeader[24] = (size >> 16) & 0xff;
          localFileHeader[25] = (size >> 24) & 0xff;

          // 文件名长度
          localFileHeader[26] = fileNameBytes.length & 0xff;
          localFileHeader[27] = (fileNameBytes.length >> 8) & 0xff;

          // 文件名
          localFileHeader.set(fileNameBytes, 30);

          // 顺序写入,避免并发冲突
          await writer.write(localFileHeader);
          await writer.write(data);

          // 只保存元数据,不保存图片数据
          files.push({
            name: fileName,
            size: data.length,
            offset: currentOffset,
            crc32: crc32
          });

          currentOffset += localFileHeader.length + data.length;

          completed++;
          onProgress(completed, total);
        }
        // 写入后,data 会被垃圾回收,释放内存
      }
    }

    // 写入中央目录
    const centralDirStart = currentOffset;
    for (const file of files) {
      const fileNameBytes = encoder.encode(file.name);
      const centralDirHeader = new Uint8Array(46 + fileNameBytes.length);

      // 中央目录文件头签名
      centralDirHeader[0] = 0x50; // 'P'
      centralDirHeader[1] = 0x4b; // 'K'
      centralDirHeader[2] = 0x01;
      centralDirHeader[3] = 0x02;

      // 版本
      centralDirHeader[4] = 0x14;
      centralDirHeader[5] = 0x00;

      // 解压所需版本
      centralDirHeader[6] = 0x14;
      centralDirHeader[7] = 0x00;

      // 压缩方法
      centralDirHeader[10] = 0x00;
      centralDirHeader[11] = 0x00;

      // CRC32 校验码 (修复解压错误)
      const crc32 = file.crc32;
      centralDirHeader[16] = crc32 & 0xff;
      centralDirHeader[17] = (crc32 >> 8) & 0xff;
      centralDirHeader[18] = (crc32 >> 16) & 0xff;
      centralDirHeader[19] = (crc32 >> 24) & 0xff;

      // 压缩大小
      const size = file.size;
      centralDirHeader[20] = size & 0xff;
      centralDirHeader[21] = (size >> 8) & 0xff;
      centralDirHeader[22] = (size >> 16) & 0xff;
      centralDirHeader[23] = (size >> 24) & 0xff;

      // 未压缩大小 (使用保存的 size 而不是 data.length)
      centralDirHeader[24] = size & 0xff;
      centralDirHeader[25] = (size >> 8) & 0xff;
      centralDirHeader[26] = (size >> 16) & 0xff;
      centralDirHeader[27] = (size >> 24) & 0xff;

      // 文件名长度
      centralDirHeader[28] = fileNameBytes.length & 0xff;
      centralDirHeader[29] = (fileNameBytes.length >> 8) & 0xff;

      // 本地文件头偏移
      centralDirHeader[42] = file.offset & 0xff;
      centralDirHeader[43] = (file.offset >> 8) & 0xff;
      centralDirHeader[44] = (file.offset >> 16) & 0xff;
      centralDirHeader[45] = (file.offset >> 24) & 0xff;

      // 文件名
      centralDirHeader.set(fileNameBytes, 46);

      await writer.write(centralDirHeader);
      currentOffset += centralDirHeader.length;
    }

    const centralDirSize = currentOffset - centralDirStart;

    // 写入中央目录结束记录
    const endOfCentralDir = new Uint8Array(22);
    endOfCentralDir[0] = 0x50; // 'P'
    endOfCentralDir[1] = 0x4b; // 'K'
    endOfCentralDir[2] = 0x05;
    endOfCentralDir[3] = 0x06;

    // 文件总数
    endOfCentralDir[8] = files.length & 0xff;
    endOfCentralDir[9] = (files.length >> 8) & 0xff;
    endOfCentralDir[10] = files.length & 0xff;
    endOfCentralDir[11] = (files.length >> 8) & 0xff;

    // 中央目录大小
    endOfCentralDir[12] = centralDirSize & 0xff;
    endOfCentralDir[13] = (centralDirSize >> 8) & 0xff;
    endOfCentralDir[14] = (centralDirSize >> 16) & 0xff;
    endOfCentralDir[15] = (centralDirSize >> 24) & 0xff;

    // 中央目录偏移
    endOfCentralDir[16] = centralDirStart & 0xff;
    endOfCentralDir[17] = (centralDirStart >> 8) & 0xff;
    endOfCentralDir[18] = (centralDirStart >> 16) & 0xff;
    endOfCentralDir[19] = (centralDirStart >> 24) & 0xff;

    await writer.write(endOfCentralDir);
    await writer.close();

  } catch (error) {
    console.error('创建 ZIP 流失败:', error);
    await writer.abort();
    throw error;
  }
};

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
    onProgress = () => { },
    onError = () => { }
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

  // 多张图片使用 StreamSaver
  try {
    await createZipStream(imageUrls, zipName, onProgress, onError);
  } catch (error) {
    console.error('下载失败:', error);
    throw error;
  }
};

export default downloadImagesAsZip;