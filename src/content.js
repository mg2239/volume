(() => {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  const audioCtx = new AudioContext();
  const gainNode = audioCtx.createGain();
  const ids = {};

  const findAndConnect = () => {
    const tags = ["audio", "video"];

    tags.forEach((tag) => {
      document.querySelectorAll(tag).forEach((element) => {
        const identifier = element.id || element.className || element.src;
        console.log("found " + identifier);
        if (identifier in ids === false) {
          console.log("attached " + identifier);
          ids[identifier] = 1;
          audioCtx.createMediaElementSource(element).connect(gainNode);
        }
      });
    });
  };

  findAndConnect();

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
        findAndConnect();
        setVolume(message.volume);
        break;
      default:
        break;
    }
  });
})();
