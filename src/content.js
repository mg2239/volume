(() => {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  const audioElts = document.querySelectorAll("audio");
  const videoElts = document.querySelectorAll("video");

  const audioCtx = new AudioContext();
  const gainNode = audioCtx.createGain();

  const connect = (elt) => {
    audioCtx.createMediaElementSource(elt).connect(gainNode);
  };

  audioElts.forEach(connect);
  videoElts.forEach(connect);

  gainNode.connect(audioCtx.destination);

  const getVolume = () => {
    return gainNode.gain.value;
  };

  const setVolume = (volume) => {
    gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.015);
  };

  browser.runtime.onMessage.addListener((message) => {
    switch (message.command) {
      case "getVolume":
        return Promise.resolve(getVolume());
      case "setVolume":
        setVolume(message.volume);
        break;
      default:
        break;
    }
  });
})();
