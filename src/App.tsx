import { AudioRecorder } from "react-audio-voice-recorder";
import { convertWebmToWav } from "./uitls/audio";
import { useRef, useState } from "react";

const App = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  const addAudioElement = async (blob: Blob) => {
    const convertedBlob = await convertWebmToWav(blob);
    setBlob(convertedBlob);
  };

  return (
    <div className="container" ref={containerRef}>
      <AudioRecorder
        onRecordingComplete={addAudioElement}
        audioTrackConstraints={{
          noiseSuppression: true,
          echoCancellation: true,
        }}
        downloadOnSavePress={false}
        downloadFileExtension="webm"
      />
      {blob && <audio src={URL.createObjectURL(blob)} controls={true} />}
    </div>
  );
};

export default App;
