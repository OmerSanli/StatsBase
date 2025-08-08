let sessionId = null;

function applyRule() {
  const rule = sessionId
    ? [{
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [{ header: "X-Session-ID", operation: "set", value: sessionId }]
        },
        condition: {
          urlFilter: "https://www.instagram.com/",
          resourceTypes: ["xmlhttprequest"]
        }
      }]
    : [];

  chrome.declarativeNetRequest.updateDynamicRules(
    { removeRuleIds: [1], addRules: rule },
    () => {}
  );
}

function updateSessionId() {
  chrome.cookies.get({ url: "https://www.instagram.com/", name: "sessionid" }, (cookie) => {
    sessionId = cookie ? cookie.value : null;
    applyRule();
  });
}

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie.domain.includes("instagram.com") && changeInfo.cookie.name === "sessionid") {
    updateSessionId();
  }
});

updateSessionId();
