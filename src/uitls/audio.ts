// Helper function to encode WAV from an AudioBuffer
const encodeToWavBuffer = (
  audioBuffer: AudioBuffer,
  numChannels = 1,
  targetSampleRate = 16000
) => {
  const length = audioBuffer.length * numChannels * 2 + 44; // 16-bit PCM + WAV header

  //creates an empty array buffer
  const wavBuffer = new ArrayBuffer(length);

  //Utlize DataView to help in populating the empty ArrayBuffer
  const view = new DataView(wavBuffer);

  //Inputting WAV file header
  writeString(view, 0, "RIFF"); //WAV file indicator
  view.setUint32(4, 36 + audioBuffer.length * numChannels * 2, true);
  writeString(view, 8, "WAVE"); //WAVE format indicator
  writeString(view, 12, "fmt "); //Start of format chunk
  view.setUint32(16, 16, true); //Format chunk size
  view.setUint16(20, 1, true); // Specifies PCM audio (uncompressed)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * numChannels * 2, true); //byte rate
  view.setUint16(32, numChannels * 2, true); //bytes per sample across all channels
  view.setUint16(34, 16, true); //bits per sample
  writeString(view, 36, "data"); //Start of data chunk
  view.setUint32(40, audioBuffer.length * numChannels * 2, true); //audio data size in bytes

  // Create a separate buffer for raw L16 data
  const l16Buffer = new Int16Array(audioBuffer.length * numChannels);

  //Inputting PCM audio data
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const clampedSample = Math.max(-1, Math.min(1, sample));

      //convert to 16 bit integer
      const int16Sample =
        clampedSample < 0 ? clampedSample * 0x8000 : clampedSample * 0x7fff;

      // Add to WAV buffer
      view.setInt16(offset, int16Sample, true);
      offset += 2;

      // Add to L16 buffer
      l16Buffer[i * numChannels + channel] = int16Sample;
    }
  }

  return { wavBuffer, l16Buffer };
};

// Helper function to write strings to DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export const convertWebmToWav = async (
  webmBlob: Blob,
  numChannels = 1,
  targetSampleRate = 16000
) => {
  //Convert WebM blob as an ArrayBuffer
  const arrayBuffer = await webmBlob.arrayBuffer();

  // Decode the audio data using AudioContext
  const audioContext = new AudioContext({ sampleRate: targetSampleRate });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Encode the audio buffer into a WAV file
  const { wavBuffer, l16Buffer } = encodeToWavBuffer(
    audioBuffer,
    numChannels,
    targetSampleRate
  );
  return {
    wavBlob: new Blob([wavBuffer], { type: "audio/wav" }),
    l16Blob: new Blob([l16Buffer], { type: "audio/l16" }),
  };
};
