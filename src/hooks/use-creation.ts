import { findAllKeysInJson } from "../utils/json";
import type { Creation } from "../types";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useCreation(callback: (urls: string[]) => void) {
  const prevUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const _parse = JSON.parse;
    JSON.parse = function (data) {
      let jsonData = _parse(data);
      if (!data.match("creations")) return jsonData;
      let creations = findAllKeysInJson(jsonData, "creations") as Creation[][];
      if (creations.length > 0) {
        const images: string[] = [];
        creations.forEach((creaetion) => {
          creaetion.map((item) => {
            const rawUrl = item.image.image_ori_raw.url;
            item.image.image_ori.url = rawUrl;
            item.image.image_preview.url = rawUrl;
            item.image.image_thumb.url = rawUrl;
            !images.includes(rawUrl) && images.push(rawUrl);
            return item;
          });
        });
        const uniqueNewUrls = images.filter(
          (url) => !prevUrls.current.has(url)
        );
        if (uniqueNewUrls.length > 0) {
          callback(uniqueNewUrls);
          prevUrls.current = new Set([...prevUrls.current, ...uniqueNewUrls]);
        }
      }
      return jsonData;
    };
    JSON.parse.toString() !== 'function Function() { [native code] }' && toast.success("💥 HOOK成功!");
  }, []);
}
