import { useEffect } from "react";

interface DownloadProgressProps {
  isOpen: boolean;
  current: number;
  total: number;
  onClose: () => void;
}

export const DownloadProgress = ({
  isOpen,
  current,
  total,
  onClose,
}: DownloadProgressProps) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = current === total && total > 0;

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={(e) => {
          e.stopPropagation();
          if (isComplete) onClose();
        }}
      />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-[90vw] max-w-md">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isComplete ? "下载完成" : "正在下载"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {current} / {total} 张图片
          </p>
        </div>

        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {percentage}%
          </p>
        </div>

        {isComplete && (
          <div className="flex items-center justify-center text-green-600">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">下载成功！</span>
          </div>
        )}

        {!isComplete && (
          <p className="text-xs text-gray-500 text-center">
            请勿关闭页面或重复点击下载按钮
          </p>
        )}
      </div>
    </div>
  );
};

