browser.runtime.onMessage.addListener(({ volume, tabId }) => {
  let text = String(Math.round(volume * 100));
  if (Number(volume) === 1) {
    text = "";
  }
  browser.browserAction.setBadgeText({ text, tabId });
});
