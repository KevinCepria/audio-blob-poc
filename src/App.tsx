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
    const { wavBlob, l16Blob } = await convertWebmToWav(blob);
    setBlob(wavBlob);
  };

  const sendAudioBlobToApi = async () => {
    if (!blob) return;
    try {
      // Create a FormData object and append the blob
      const formData = new FormData();
      formData.append("audioFile", blob);

      // Send the request to the API using fetch
      const response = await fetch("url", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${"token"}`, // Bearer Token in the Authorization header
        },
        body: formData, // Form data contains the Blob
      });

      // Handle the response
      if (response.ok) {
        const result = await response.json(); // Parse the response body as JSON
        console.log("File uploaded successfully:", result);
      } else {
        console.error("Upload failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Error while sending the Blob:", error);
    }
  };

  const sendAudioBlobToWS = () => {
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
            <button onClick={sendAudioBlobToWS}>Send To WS</button>
            <button onClick={async () => await sendAudioBlobToApi()}>
              Send To REST API
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
