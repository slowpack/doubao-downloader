import { useState } from "react";
import { Indicator } from "./components/Indicator";
import { Home } from ".//Home";
import { useCreation } from "./hooks/use-creation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import downloadImagesAsZip from "./utils/download";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const download = async (urls: string[]) => {
    await downloadImagesAsZip(urls, {
      zipName: document.title,
      onProgress: (current, total) => {
        console.log(`已下载${current}张图片，总共${total}张`);
      },
      onError: (url, error) => {
        console.error(`下载图片${url}失败:`, error);
      },
    });
  };

  useCreation((urls) => {
    const newImages = urls.filter((url) => !images.includes(url));
    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      toast("🎉 有新图片", {
        description: `获取到${newImages.length}张图片`,
        action: {
          label: "一键下载",
          onClick: () => {
            download(newImages);
          },
        },
      });
    }
  });

  return (
    <div>
      <Indicator onClick={() => setIsOpen(!isOpen)} />
      <Home
        urls={images}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onDownload={download}
      ></Home>
      <Toaster />
    </div>
  );
}

export default App;
