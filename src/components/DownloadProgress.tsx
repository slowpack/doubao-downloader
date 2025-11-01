import { Spinner } from "./ui/spinner";


interface LoadingProps {
  text: string;
}

export const DownloadProgress = (props: LoadingProps) => {
  return (
    <div className="dd-loading absolute top-0 h-full w-full opacity-80 inset-0 flex items-center justify-center flex-col z-90001 bg-black">
      <Spinner className="size-8 text-blue-500" />
      <span className="ml-2 text-white">{props.text}</span>
    </div>
  );
};
