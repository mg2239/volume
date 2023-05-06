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
  const update = (volume, tabId) => {
    text.textContent = `Volume: ${Math.round(volume * 100)}%`;
    slider.value = volume;

    console.log(rememberVolumeCheckbox.checked);

    if (rememberVolumeCheckbox.checked) {
      getHostname().then((hostname) => {
        browser.storage.local.set({ [hostname]: volume });
      });
    }

    browser.tabs.sendMessage(tabId, {
      command: "setVolume",
      volume,
      tabId,
    });
  };

  queryActiveTab().then(({ id }) => {
    browser.tabs
      .sendMessage(id, {
        command: "getVolume",
      })
      .then((volume) => {
        slider.removeAttribute("disabled");
        update(volume, id);
      })
      .catch(() => {
        slider.setAttribute("disabled", "");
      });
  });

  const handleChangeVolume = (volume) => {
    queryActiveTab().then(({ id }) => update(volume, id));
  };

  slider.addEventListener("input", (e) => {
    handleChangeVolume(e.target.value);
  });

  document.addEventListener("keydown", (e) => {
    const { key } = e;
    if (Number(key) <= 5 && settingsContainer.hidden) {
      handleChangeVolume(key);
    }
  });

  // ========== SETTINGS ==========
  settingsButton.addEventListener("click", () => {
    settingsContainer.hidden = !settingsContainer.hidden;
    browser.storage.local.get().then(console.log);
  });

  rememberVolumeCheckbox.addEventListener("change", (e) => {
    const { checked } = e.target;
    getHostname().then((hostname) => {
      if (checked) {
        browser.storage.local.set({ [hostname]: slider.value });
      } else {
        browser.storage.local.remove(hostname);
      }
    });
  });

  getHostname().then((hostname) => {
    browser.storage.local.get(hostname).then((res) => {
      if (hostname in res) {
        rememberVolumeCheckbox.checked = true;
      }
    });
  });
};

browser.tabs
  .executeScript({ file: "/src/content.js" })
  .then(listenForChange)
  .catch(console.log);
