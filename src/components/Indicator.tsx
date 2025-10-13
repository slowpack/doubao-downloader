import { useState } from "react";
import logo from "../assets/logo.png";

export const Indicator = (props: {onClick:()=>void}) => {
  const [position, setPosition] = useState<{
    top: string;
  }>({
    top: localStorage.getItem("top") || "33%"
  });

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    const { clientY } = e;
    const top = `${clientY}px`;
    setPosition({
      top,
    });
  };



  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const { clientY } = e;
    localStorage.setItem("top", `${clientY}px`);
    setPosition({ top: `${clientY}px` });
  };



  return (
    <div
        onClick={props.onClick}
        onDrag={(e)=>handleDrag(e)}
        onDragEnd={(e)=>handleDragEnd(e)}
        draggable="true"
        className="dd-indicator flex items-center"
        style={{ top: position.top }}
    >
        <img
        className="dd-logo w-[26px] h-[26px]"
        style={{ marginLeft: "3px" }}
        src={logo}
        />
    </div>
  );
};
