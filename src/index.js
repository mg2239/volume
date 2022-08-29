const listenForChange = () => {
  const setText = (volume) => {
    document.getElementById("text").textContent = `Volume: ${volume}%`;
  };

  document.getElementById("slider").addEventListener("input", (e) => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs.length) {
          const volume = e.target.value;
          setText(volume);
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
