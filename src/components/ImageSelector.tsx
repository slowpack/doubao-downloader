import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

export const ImageSelector = ({
  images,
  onSelectChange,
  columns = {
    mobile: 2,
    desktop: 6,
  },
}: {
  images: string[];
  onSelectChange: (selectedImages: string[]) => void;
  columns?: { mobile: number; desktop: number };
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const selectedImages = images.filter((img) => selectedIds.includes(img));
    onSelectChange(selectedImages);
  }, [selectedIds, images]);

  const toggleSelection = (img: string) => {
    setSelectedIds((prev) =>
      prev.includes(img)
        ? prev.filter((itemId) => itemId !== img)
        : [...prev, img]
    );
  };

  const getColumnClasses = () => {
    const cols = useIsMobile() ? columns.mobile : columns.desktop;
    return `grid-cols-${cols}`;
  };

  return (
    <div className="w-full px-4 py-6">
      <div className={`grid gap-4 ${getColumnClasses()}`}>
        {images.map((image) => (
          <div
            key={image}
            className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-all duration-300 hover:shadow-lg"
            onClick={() => toggleSelection(image)}
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={image}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
                loading="lazy"
              />
              {selectedIds.includes(image) && (
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
        ))}
      </div>
    </div>
  );
};
