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
      gainNode.gain.setTargetAtTime(defaultVolume, audioCtx.currentTime, 0.015);
    }
    return gainNode.gain.value;
  };

  const setVolume = (volume) => {
    gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.015);
  };

  // Auto-apply saved volume on page load
  const hostname = new URL(window.location.href).hostname;
  browser.storage.local.get(hostname).then((storage) => {
    if (!(hostname in storage)) return;

    const savedVolume = storage[hostname];

    // Set initial volume and update badge
    initVolume(savedVolume);
    browser.runtime.sendMessage({ volume: savedVolume });

    // Watch for new media elements being added to the page
    const observer = new MutationObserver(findAndConnect);

    const setupMediaWatcher = () => {
      findAndConnect();
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    };

    // Wait for DOM to be ready before connecting media elements
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupMediaWatcher);
    } else {
      setupMediaWatcher();
    }
  });

  browser.runtime.onMessage.addListener((message) => {
    switch (message.command) {
      case "initVolume":
        return Promise.resolve(initVolume(message.defaultVolume));
      case "setVolume":
        findAndConnect();
        setVolume(message.volume);
        browser.runtime.sendMessage({
          volume: message.volume,
        });
        break;
      default:
        break;
    }
  });
})();
