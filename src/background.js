browser.runtime.onMessage.addListener(({ volume }, sender) => {
  let text = String(Math.round(volume * 100));
  if (Number(volume) === 1) {
    text = "";
  }
  if (sender.tab && sender.tab.id) {
    browser.browserAction.setBadgeText({ text, tabId: sender.tab.id });
  }
});
