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

  const setVolume = (volume) => {
    const scalar = volume / 100;
    gainNode.gain.value = scalar;
    console.log(gainNode.gain);
  };

  browser.runtime.onMessage.addListener((message) => {
    console.log(message);
    switch (message.command) {
      case "setVolume":
        setVolume(message.volume);
        break;
      default:
        console.log("No action");
    }
  });
})();
