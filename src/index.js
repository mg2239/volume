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

  // ========== VOLUME ==========
  const text = document.getElementById("text");
  const slider = document.getElementById("slider");

  const update = (volume) => {
    text.textContent = `Volume: ${Math.round(volume * 100)}%`;
    slider.value = volume;
  };

  queryActiveTab().then(({ id }) => {
    browser.tabs
      .sendMessage(id, {
        command: "getVolume",
      })
      .then((volume) => {
        slider.removeAttribute("disabled");
        update(volume);
        browser.tabs.sendMessage(id, {
          command: "setVolume",
          volume,
          tabId: id,
        });
      })
      .catch(() => {
        slider.setAttribute("disabled", "");
      });
  });

  const handleChangeVolume = (volume) => {
    queryActiveTab().then(({ id }) => {
      update(volume);
      browser.tabs.sendMessage(id, {
        command: "setVolume",
        volume,
        tabId: id,
      });
    });
  };

  slider.addEventListener("input", (e) => {
    handleChangeVolume(e.target.value);
  });

  // document.addEventListener("keydown", (e) => {
  //   const { key } = e;
  //   if (Number(key) <= 5) {
  //     handleChangeVolume(key);
  //   }
  // });

  // ========== SETTINGS ==========
  const settingsButton = document.getElementById("settingsButton");
  const settingsContainer = document.getElementById("settingsContainer");
  const defaultVolumeInput = document.getElementById("defaultVolumeInput");
  const rememberVolumeCheckbox = document.getElementById(
    "rememberVolumeCheckbox"
  );

  browser.storage.local.get("defaultVolume").then(({ defaultVolume }) => {
    if (defaultVolume) {
      defaultVolumeInput.value = defaultVolume;
    }
  });

  settingsButton.addEventListener("click", () => {
    settingsContainer.hidden = !settingsContainer.hidden;
    browser.storage.local.get().then(console.log);
  });

  defaultVolumeInput.addEventListener("change", (e) => {
    let defaultVolume = parseInt(e.target.value);

    if (isNaN(defaultVolume)) {
      defaultVolume = 100;
    }
    if (defaultVolume < 0) {
      defaultVolume = 0;
    }
    if (defaultVolume > 500) {
      defaultVolume = 500;
    }

    defaultVolumeInput.value = defaultVolume;
    browser.storage.local.set({ defaultVolume });
  });

  rememberVolumeCheckbox.addEventListener("change", (e) => {
    queryActiveTab().then((tab) => {
      const { checked } = e.target;
      const { hostname } = new URL(tab.url);
      if (checked) {
        browser.storage.local.set({
          [hostname]: checked,
        });
      } else {
        browser.storage.local.remove(hostname);
      }
    });
  });
};

browser.tabs
  .executeScript({ file: "/src/content.js" })
  .then(listenForChange)
  .catch(console.log);
