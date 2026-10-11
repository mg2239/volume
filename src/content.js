(() => {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  const hostname = window.location.hostname;
  const connected = new WeakSet();
  let volume = 1;
  let audioCtx = null;
  let gainNode = null;

  // The audio graph is only created once the volume differs from 100%, so
  // pages we never touch keep their normal audio pipeline.
  const ensureAudioGraph = () => {
    if (audioCtx) {
      return;
    }
    audioCtx = new AudioContext();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioCtx.destination);
  };

  // Media routed through a suspended AudioContext is silent, and contexts
  // start suspended without a user gesture, so resume whenever we can.
  const resume = () => {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
  };

  const connect = (element) => {
    if (!audioCtx || connected.has(element)) {
      return;
    }
    connected.add(element);
    try {
      audioCtx.createMediaElementSource(element).connect(gainNode);
    } catch (err) {
      console.log(err);
    }
  };

  const findAndConnect = () => {
    document.querySelectorAll("audio, video").forEach(connect);
  };

  const setVolume = (newVolume, smooth = true) => {
    volume = Number(newVolume);
    if (volume !== 1) {
      ensureAudioGraph();
    }
    if (!audioCtx) {
      return;
    }
    findAndConnect();
    resume();
    if (smooth) {
      gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.015);
    } else {
      gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      gainNode.gain.value = volume;
    }
  };

  // `play` doesn't bubble, but a capturing listener on the document still
  // sees it, which catches media elements whenever they are added.
  document.addEventListener(
    "play",
    (e) => {
      if (e.target instanceof HTMLMediaElement) {
        connect(e.target);
        resume();
      }
    },
    true
  );
  ["pointerdown", "keydown"].forEach((type) => {
    document.addEventListener(type, resume, true);
  });

  const ready = browser.storage.local
    .get(hostname)
    .then((storage) => {
      if (hostname in storage) {
        const savedVolume = Number(storage[hostname]);
        setVolume(savedVolume, false);
        browser.runtime.sendMessage({ volume: savedVolume });
      }
    })
    .catch(console.log);

  browser.runtime.onMessage.addListener((message) => {
    switch (message.command) {
      case "getVolume":
        return ready.then(() => volume);
      case "setVolume":
        setVolume(message.volume);
        browser.runtime.sendMessage({ volume });
        break;
      default:
        break;
    }
  });
})();
