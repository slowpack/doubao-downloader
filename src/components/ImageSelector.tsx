import { useIsMobile } from "@/hooks/use-mobile";
import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import { VirtuosoGrid } from "react-virtuoso";

// 单个图片项组件，使用 memo 优化性能
const ImageItem = memo(({
  image,
  isDownloaded,
  isSelected,
  onToggle
}: {
  image: string;
  isDownloaded: boolean;
  isSelected: boolean;
  onToggle: (img: string) => void;
}) => {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-all duration-300 hover:shadow-lg"
      onClick={() => onToggle(image)}
    >
      <div className="aspect-square relative overflow-hidden">
        <img
          src={image}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
          loading="lazy"
        />

        {/* 已下载标记 */}
        {isDownloaded && (
          <div className="absolute w-fit top-2 right-2 bg-green-500 px-2 py-1 rounded-full text-xs font-medium shadow-md text-center gap-1">
            <span className="text-white p-3">已下载</span >
          </div>
        )}

        {/* 选中标记 */}
        {isSelected && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ImageItem.displayName = 'ImageItem';

export const ImageSelector = ({
  images,
  downloadedImages = new Set(),
  selectedUrls = [],
  onSelectChange,
  columns = {
    mobile: 2,
    desktop: 6,
  },
}: {
  images: string[];
  downloadedImages?: Set<string>;
  selectedUrls?: string[];
  onSelectChange: (selectedImages: string[]) => void;
  columns?: { mobile: number; desktop: number };
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedUrls);

  // 当外部传入的 selectedUrls 改变时，更新内部状态
  useEffect(() => {
    setSelectedIds(selectedUrls);
  }, [selectedUrls]);

  // 使用 useCallback 优化 toggleSelection 函数
  const toggleSelection = useCallback((img: string) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(img)
        ? prev.filter((itemId) => itemId !== img)
        : [...prev, img];

      // 直接在这里调用 onSelectChange，避免额外的 useEffect
      onSelectChange(newSelected);
      return newSelected;
    });
  }, [onSelectChange]);

  const isMobile = useIsMobile();
  const cols = isMobile ? columns.mobile : columns.desktop;

  // 使用 useMemo 缓存 itemContent 函数
  const itemContent = useCallback((index: number) => {
    const image = images[index];
    const isDownloaded = downloadedImages.has(image);
    const isSelected = selectedIds.includes(image);

    return (
      <ImageItem
        key={image}
        image={image}
        isDownloaded={isDownloaded}
        isSelected={isSelected}
        onToggle={toggleSelection}
      />
    );
  }, [images, downloadedImages, selectedIds, toggleSelection]);

  // 自定义组件样式
  const gridComponents = useMemo(() => ({
    List: React.forwardRef<HTMLDivElement>((props: any, ref) => (
      <div
        ref={ref}
        {...props}
        className="grid gap-4"
        style={{
          ...props.style,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      />
    )),
    Item: (props: any) => (
      <div {...props} style={{ ...props.style }} />
    ),
  }), [cols]);

  return (
    <div className="w-full h-full px-4 py-6">
      <VirtuosoGrid
        style={{ height: '100%' }}
        totalCount={images.length}
        components={gridComponents}
        itemContent={itemContent}
        overscan={200}
      />
    </div>
  );
};
