export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function mergeArrayBuffersToWav(buffers) {
  if (!buffers.length) {
    throw new Error("Nenhum áudio recebido para mesclagem.");
  }

  const audioContext = new AudioContext();
  try {
    const decodedBuffers = await Promise.all(
      buffers.map((buffer) => decodeBuffer(audioContext, buffer))
    );

    const sampleRate = decodedBuffers[0].sampleRate;
    const channelCount = decodedBuffers[0].numberOfChannels;
    const totalLength = decodedBuffers.reduce((sum, audioBuffer) => sum + audioBuffer.length, 0);
    const outputBuffer = audioContext.createBuffer(channelCount, totalLength, sampleRate);

    let offset = 0;
    decodedBuffers.forEach((audioBuffer) => {
      for (let channel = 0; channel < channelCount; channel += 1) {
        const outputData = outputBuffer.getChannelData(channel);
        const channelData = audioBuffer.getChannelData(Math.min(channel, audioBuffer.numberOfChannels - 1));
        outputData.set(channelData, offset);
      }
      offset += audioBuffer.length;
    });

    const wavBlob = audioBufferToWav(outputBuffer);
    return { blob: wavBlob, duration: totalLength / sampleRate };
  } finally {
    audioContext.close();
  }
}

function decodeBuffer(audioContext, buffer) {
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(
      buffer.slice(0),
      (decoded) => resolve(decoded),
      (error) => reject(error)
    );
  });
}

function audioBufferToWav(buffer) {
  const numOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const channelData = [];
  for (let channel = 0; channel < numOfChannels; channel += 1) {
    channelData.push(buffer.getChannelData(channel));
  }

  const interleaved = interleave(channelData, buffer.length, numOfChannels);
  const bufferLength = 44 + interleaved.length * 2;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + interleaved.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChannels * (bitDepth / 8), true);
  view.setUint16(32, numOfChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, interleaved.length * 2, true);

  floatTo16BitPCM(view, 44, interleaved);

  return new Blob([view], { type: "audio/wav" });
}

function interleave(channels, length, numOfChannels) {
  const result = new Float32Array(length * numOfChannels);
  for (let sampleIndex = 0; sampleIndex < length; sampleIndex += 1) {
    for (let channel = 0; channel < numOfChannels; channel += 1) {
      result[sampleIndex * numOfChannels + channel] = channels[channel][sampleIndex] ?? 0;
    }
  }
  return result;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i += 1) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(view, offset, data) {
  for (let i = 0; i < data.length; i += 1) {
    let sample = Math.max(-1, Math.min(1, data[i]));
    sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, sample, true);
    offset += 2;
  }
}
