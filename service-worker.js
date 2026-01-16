chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "EXTRACTED_OPPORTUNITIES") {
    console.log("Received opportunities from tab", sender.tab?.id);
    console.table(message.payload);
  }
});
