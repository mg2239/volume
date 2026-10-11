const listenForChange = () => {
  // ========= UTIL =========
  // The popup closes whenever the active tab changes, so this only needs to be
  // looked up once.
  const activeTab = browser.tabs
    .query({ active: true, currentWindow: true })
    .then(([tab]) => {
      if (!tab) {
        throw new Error("No active tab");
      }
      return tab;
    });

  const hostnamePromise = activeTab.then((tab) => new URL(tab.url).hostname);

  // ========= ELEMENTS =========
  const text = document.getElementById("text");
  const slider = document.getElementById("slider");
  const resetButton = document.getElementById("resetButton");
  const rememberVolumeCheckbox = document.getElementById(
    "rememberVolumeCheckbox"
  );

  // ========= VOLUME =========
  const update = (volume) => {
    text.textContent = `Volume: ${Math.round(volume * 100)}%`;
    slider.value = volume;

    // Show/hide reset button based on volume
    resetButton.hidden = Math.round(volume * 100) === 100;
  };

  // Tabs that were open before the extension was installed don't have the
  // content script yet, so inject it and try again.
  const getTabVolume = (tab) => {
    const getVolume = () =>
      browser.tabs.sendMessage(tab.id, { command: "getVolume" });
    return getVolume().catch(() =>
      browser.tabs
        .executeScript(tab.id, { file: "/src/content.js" })
        .then(getVolume)
    );
  };

  // Controls stay disabled until the tab responds, so pages the extension
  // can't run on (about:, addons.mozilla.org, etc.) can't be changed or saved.
  let enabled = false;

  Promise.all([activeTab, hostnamePromise])
    .then(([tab, hostname]) =>
      Promise.all([
        getTabVolume(tab),
        hostname ? browser.storage.local.get(hostname) : null,
      ]).then(([volume, storage]) => {
        enabled = true;
        slider.disabled = false;
        resetButton.disabled = false;
        update(volume);
        // Pages without a hostname (e.g. file://) have nothing to save against
        if (storage) {
          rememberVolumeCheckbox.disabled = false;
          rememberVolumeCheckbox.checked = hostname in storage;
        }
      })
    )
    .catch(console.log);

  const handleChangeVolume = (value) => {
    if (!enabled) {
      return;
    }
    const volume = Number(value);
    update(volume);
    activeTab
      .then((tab) =>
        browser.tabs.sendMessage(tab.id, {
          command: "setVolume",
          volume,
        })
      )
      .catch(console.log);

    if (rememberVolumeCheckbox.checked) {
      hostnamePromise
        .then((hostname) => browser.storage.local.set({ [hostname]: volume }))
        .catch(console.log);
    }
  };

  slider.addEventListener("input", (e) => {
    handleChangeVolume(e.target.value);
  });

  resetButton.addEventListener("click", () => {
    handleChangeVolume(1);
  });

  document.addEventListener("keydown", (e) => {
    const { key } = e;
    if (/^[0-5]$/.test(key)) {
      handleChangeVolume(key);
    }
  });

  // ========= SETTINGS =========
  rememberVolumeCheckbox.addEventListener("change", (e) => {
    const { checked } = e.target;
    hostnamePromise
      .then((hostname) =>
        checked
          ? browser.storage.local.set({ [hostname]: Number(slider.value) })
          : browser.storage.local.remove(hostname)
      )
      .catch(console.log);
  });
};

listenForChange();
