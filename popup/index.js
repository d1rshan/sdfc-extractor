document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("extract").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    console.log("Sending message to tab", tab.id);

    chrome.tabs.sendMessage(tab.id, {
      type: "EXTRACT_CURRENT_OBJECT"
    });
  });
});
