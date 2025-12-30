(() => {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  const audioCtx = new AudioContext();
  const gainNode = audioCtx.createGain();
  const ids = {};

  gainNode.connect(audioCtx.destination);

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
    console.log("🚀 ~ findAndConnect ~ ids:", ids);
  };

  const setVolume = (volume) => {
    console.log("🚀 ~ setVolume ~ ids:", ids);

    if (volume != null) {
      gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.015);
    }
    return gainNode.gain.value;
  };

  // Auto-apply saved volume on page load and URL changes (for SPAs like YouTube)
  const applySavedVolume = () => {
    const hostname = new URL(window.location.href).hostname;
    browser.storage.local.get(hostname).then((storage) => {
      if (!(hostname in storage)) return;

      const savedVolume = storage[hostname];

      // Set initial volume and update badge
      setVolume(savedVolume);
      browser.runtime.sendMessage({ volume: savedVolume });
    });
  };

  const handleMediaVolume = () => {
    findAndConnect();
    applySavedVolume();
  };

  const observer = new MutationObserver(handleMediaVolume);

  const setupMedia = () => {
    handleMediaVolume();
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  // Apply on initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupMedia);
  } else {
    setupMedia();
  }

  // Re-apply when URL changes (for SPAs like YouTube)
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      handleMediaVolume();
    }
  }).observe(document, { subtree: true, childList: true });

  browser.runtime.onMessage.addListener((message) => {
    switch (message.command) {
      case "initVolume":
        return Promise.resolve(setVolume(message.defaultVolume));
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
