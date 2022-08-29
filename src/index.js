const listenForChange = () => {
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
        .then(update);
    })
    .catch(console.log);

  slider.addEventListener("input", (e) => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs.length) {
          const volume = e.target.value;
          update(volume);
          browser.tabs.sendMessage(tabs[0].id, {
            command: "setVolume",
            volume,
          });
        }
      })
      .catch(console.log);
  });
};

browser.tabs
  .executeScript({ file: "/src/content.js" })
  .then(listenForChange)
  .catch(console.log);
