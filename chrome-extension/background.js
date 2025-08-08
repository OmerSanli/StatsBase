let sessionId = null;

function updateSessionId() {
  chrome.cookies.get({ url: "https://www.instagram.com/", name: "sessionid" }, (cookie) => {
    sessionId = cookie ? cookie.value : null;
  });
}

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie.domain.includes("instagram.com") && changeInfo.cookie.name === "sessionid") {
    updateSessionId();
  }
});

updateSessionId();

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (sessionId) {
      details.requestHeaders.push({ name: "X-Session-ID", value: sessionId });
      return { requestHeaders: details.requestHeaders };
    }
  },
  { urls: ["https://www.instagram.com/*"] },
  ["blocking", "requestHeaders"]
);
