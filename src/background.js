browser.runtime.onMessage.addListener(({ volume }, sender) => {
  let text = String(Math.round(volume * 100));
  if (Number(volume) === 1) {
    text = "";
  }
  if (sender.tab && sender.tab.id) {
    browser.browserAction.setBadgeText({ text, tabId: sender.tab.id });
  }
});

// Access to all sites is optional and only requested when the user turns on
// "Remember volume", so the content script is registered here instead of in
// the manifest. Registrations don't survive a restart, so this runs on startup
// too.
const ALL_SITES = { origins: ["<all_urls>"] };
let registration = null;
let syncing = Promise.resolve();

const syncContentScript = () => {
  syncing = syncing
    .then(() => browser.permissions.contains(ALL_SITES))
    .then((granted) => {
      if (granted && !registration) {
        return browser.contentScripts
          .register({
            matches: ALL_SITES.origins,
            js: [{ file: "/src/content.js" }],
            runAt: "document_start",
          })
          .then((r) => {
            registration = r;
          });
      }
      if (!granted && registration) {
        const r = registration;
        registration = null;
        return r.unregister();
      }
      return null;
    })
    .catch(console.log);
};

browser.permissions.onAdded.addListener(syncContentScript);
browser.permissions.onRemoved.addListener(syncContentScript);
syncContentScript();
