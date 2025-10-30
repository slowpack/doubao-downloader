declare module 'streamsaver' {
  interface StreamSaver {
    createWriteStream: (filename: string, options?: {
      size?: number;
      writableStrategy?: QueuingStrategy;
      readableStrategy?: QueuingStrategy;
    }) => WritableStream;
    mitm?: string;
    WritableStream: typeof WritableStream;
  }

  const streamSaver: StreamSaver;
  export default streamSaver;
}

