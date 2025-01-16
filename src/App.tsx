import { AudioRecorder } from "react-audio-voice-recorder";
import { convertWebmToWav } from "./uitls/audio";
import { useRef, useState, useEffect } from "react";

const App = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create and open the WebSocket connection
    const ws = new WebSocket("wss://echo.websocket.org");
    websocketRef.current = ws;

    // On connection success
    ws.onopen = () => {
      console.log("WebSocket connection established.");
    };

    ws.onmessage = (event) => {
      console.log(`Received from server: ${event.data}`);
    };

    ws.onerror = (error) => {
      console.log("WebSocket error occurred.");
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  const addAudioElement = async (blob: Blob) => {
    const convertedBlob = await convertWebmToWav(blob);
    setBlob(convertedBlob);
  };

  const sendAudioBlob = () => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN &&
      blob
    ) {
      websocketRef.current.send(blob);
      console.log("Sending data");
    } else {
      console.log("WebSocket is not connected.");
    }
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
      {blob && (
        <>
          <audio src={URL.createObjectURL(blob)} controls={true} />
          <div className="action-container">
            <button onClick={sendAudioBlob}>Send To WS</button>
            <button>Send To REST API</button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
