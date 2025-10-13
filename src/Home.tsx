import { useState } from "react";
import { ImageSelector } from "./components/ImageSelector";


export const Home = (props: { urls: string[]; isOpen: boolean, onClose: () => void, onDownload: (urls: string[]) => void }) => {
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const handleOnSelectChange = (selected: string[]) => {
    setSelectedUrls(selected);
  };

  const downloadSelected = async () => {
    await props.onDownload(selectedUrls)
  }

  const downloadAll = async () => {
    await props.onDownload(props.urls)
  }

  

  return (
    <div className={`dd-home ${props.isOpen ? "show" : ""}`}>
      <div onClick={props.onClose} className="dd-mask absolute opacity-50 top-0 h-full w-full inset-0 bg-black z-[88888]" />
      <div className="dd-home-content w-[80vw] h-[70vh] lg:w-[800px] lg:h-[600px] overflow-auto">
        <div className="dd-action-btns">
          <div className="flex items-center gap-2">
            <div>
              <button onClick={downloadAll} className="dd-btn primary">下载所有</button>
              <button onClick={downloadSelected} className="dd-btn orange" disabled={selectedUrls.length === 0}>
                下载选中
              </button>
            </div>
          </div>
        </div>
        <ImageSelector
          images={props.urls}
          onSelectChange={handleOnSelectChange}
        />
      </div>
    </div>
  );
};
