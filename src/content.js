(() => {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  // ========== UTIL ==========
  const queryActiveTab = () => {
    return new Promise((resolve) => {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          if (tabs.length) {
            resolve(tabs[0]);
          }
        })
        .catch(console.log);
    });
  };

  const getHostname = () => {
    return queryActiveTab().then((tab) => {
      const { hostname } = new URL(tab.url);
      return hostname;
    });
  };

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

  const getVolume = async () => {
    const { defaultVolume } = await browser.storage.local.get("defaultVolume");
    const hostname = await getHostname();
    const res = await browser.storage.local.get(hostname);
    if (hostname in res) {
      return res.hostname;
    }
    if (defaultVolume) {
      return defaultVolume;
    }
    return gainNode.gain.value;
  };

  const setVolume = (volume) => {
    gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.015);
  };

  browser.runtime.onMessage.addListener((message) => {
    switch (message.command) {
      case "getVolume":
        return getVolume();
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
