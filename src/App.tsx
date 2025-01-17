import { AudioRecorder } from "react-audio-voice-recorder";
import { convertWebmToWav } from "./uitls/audio";
import { useState } from "react";

const App = () => {
  const [blob, setBlob] = useState<Blob | null>(null);

  const addAudioElement = async (blob: Blob) => {
    const { wavBlob, l16Blob } = await convertWebmToWav(blob);
    setBlob(l16Blob);
  };

  const sendAudioBlobToApi = async () => {
    if (!blob) return;
    try {
      const formData = new FormData();
      formData.append("audioFile", blob);

      const response = await fetch("url", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${"token"}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("File uploaded successfully:", result);
      } else {
        console.error("Upload failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Error while sending the Blob:", error);
    }
  };

  return (
    <div className="container">
      <AudioRecorder
        onRecordingComplete={addAudioElement}
        audioTrackConstraints={{
          noiseSuppression: true,
          echoCancellation: true,
        }}
        downloadOnSavePress={false}
        downloadFileExtension="webm"
      />
      {blob && (
        <>
          <audio src={URL.createObjectURL(blob)} controls={true} />
          <button onClick={async () => await sendAudioBlobToApi()}>
            Send To REST API
          </button>
        </>
      )}
    </div>
  );
};

export default App;
