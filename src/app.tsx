import { createResource, createSignal } from "solid-js";
import whiteNoiseURL from "./assets/white-noise.wav";

export const App = () => {
  const [audioArrayBuffer] = createResource(async () => {
    const response = await fetch(whiteNoiseURL, { mode: "cors" });
    const audioArrayBuffer = await response.arrayBuffer();
    return audioArrayBuffer;
  });
  const [ctx] = createResource(async () => {
    return new AudioContext;
  });

  return (
    <div class="container">
      {(ctx.error || audioArrayBuffer.error) && <div>Error</div>}
      {(ctx.loading || audioArrayBuffer.loading) && <div>Loading</div>}
      {ctx.state === "ready" && audioArrayBuffer.state === "ready" && (
        <SleepSoundPlayer ctx={ctx()} audioArrayBuffer={audioArrayBuffer()} />
      )}
    </div>
  );
};

const SleepSoundPlayer = ({
  ctx,
  audioArrayBuffer,
}: {
  ctx: AudioContext;
  audioArrayBuffer: ArrayBuffer;
}) => {
  const [srcNode, setSrcNode] = createSignal<AudioBufferSourceNode | null>(
    null
  );
  const toggle = async () => {
    const srcNode_ = srcNode();
    if (srcNode_) {
      setSrcNode(null);
      srcNode_.stop();
    } else {
      const audioData = copy(audioArrayBuffer);
      await ctx.decodeAudioData(audioData, (audioBuffer) => {
        const srcNode = ctx.createBufferSource(); // create audio source
        srcNode.buffer = audioBuffer; // use decoded buffer
        srcNode.connect(ctx.destination); // create output
        srcNode.loop = true; // takes care of perfect looping
        srcNode.start();
        setSrcNode(srcNode);
      });
    }
  };
  return <button onclick={toggle}>{srcNode() ? "Stop" : "Start"}</button>;
};

function copy(arrayBuffer: ArrayBuffer) {
  var newArrayBuffer = new ArrayBuffer(arrayBuffer.byteLength);
  new Uint8Array(newArrayBuffer).set(new Uint8Array(arrayBuffer));
  return newArrayBuffer;
}
