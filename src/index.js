const listenForChange = () => {
  // VOLUME

  const text = document.getElementById("text");
  const slider = document.getElementById("slider");

  const update = (volume) => {
    text.textContent = `Volume: ${Math.round(volume * 100)}%`;
    slider.value = volume;
  };

  browser.tabs
    .query({ active: true, currentWindow: true })
    .then((tabs) => {
      browser.tabs
        .sendMessage(tabs[0].id, {
          command: "getVolume",
        })
        .then((volume) => {
          slider.removeAttribute("disabled");
          update(volume);
        })
        .catch(() => {
          slider.setAttribute("disabled", "");
        });
    })
    .catch(console.log);

  const handleChangeVolume = (volume) => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs.length) {
          update(volume);
          browser.tabs.sendMessage(tabs[0].id, {
            command: "setVolume",
            volume,
            tabId: tabs[0].id,
          });
        }
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

  // SETTINGS

  const settingsButton = document.getElementById("settingsButton");
  settingsButton.addEventListener("click", () => {
    const settingsContainer = document.getElementById("settingsContainer");
    settingsContainer.hidden = !settingsContainer.hidden;
  });
};

browser.tabs
  .executeScript({ file: "/src/content.js" })
  .then(listenForChange)
  .catch(console.log);
