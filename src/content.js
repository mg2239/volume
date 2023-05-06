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
        if (identifier in ids === false) {
          ids[identifier] = 1;
          audioCtx.createMediaElementSource(element).connect(gainNode);
        }
      });
    });
  };

  findAndConnect();

  gainNode.connect(audioCtx.destination);

  const initVolume = (defaultVolume) => {
    if (defaultVolume != null) {
      gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.015);
    }
    return gainNode.gain.value;
  };

  const setVolume = (volume) => {
    gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.015);
  };

  browser.runtime.onMessage.addListener((message) => {
    switch (message.command) {
      case "initVolume":
        return Promise.resolve(initVolume(message.defaultVolume));
      case "setVolume":
        findAndConnect();
        setVolume(message.volume);
        browser.runtime.sendMessage({
          tabId: message.tabId,
          volume: message.volume,
        });
        break;
      default:
        break;
    }
  });
})();
