const listenForChange = () => {
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

  // ========== ELEMENTS ==========
  const text = document.getElementById("text");
  const slider = document.getElementById("slider");
  const settingsButton = document.getElementById("settingsButton");
  const settingsContainer = document.getElementById("settingsContainer");
  const rememberVolumeCheckbox = document.getElementById(
    "rememberVolumeCheckbox"
  );

  // ========== VOLUME ==========
  const update = (volume) => {
    text.textContent = `Volume: ${Math.round(volume * 100)}%`;
    slider.value = volume;
  };

  queryActiveTab()
    .then((tab) => {
      browser.tabs
        .sendMessage(tab.id, {
          command: "getVolume",
        })
        .then((volume) => {
          slider.removeAttribute("disabled");
          update(volume);
        })
        .catch((err) => {
          console.log(err);
          slider.setAttribute("disabled", "");
        });
    })
    .catch(console.log);

  const handleChangeVolume = (volume) => {
    queryActiveTab()
      .then((tab) => {
        update(volume);
        browser.tabs.sendMessage(tab.id, {
          command: "setVolume",
          volume,
          tabId: tab.id,
        });
      })
      .catch(console.log);
  };

  slider.addEventListener("input", (e) => {
    handleChangeVolume(e.target.value);
  });

  document.addEventListener("keydown", (e) => {
    const { key } = e;
    if (Number(key) <= 5) {
      handleChangeVolume(key);
    }
  });

  // ========== SETTINGS ==========
  settingsButton.addEventListener("click", () => {
    settingsContainer.hidden = !settingsContainer.hidden;
    browser.storage.local.get().then(console.log);
  });
};

browser.tabs
  .executeScript({ file: "/src/content.js" })
  .then(listenForChange)
  .catch(console.log);
