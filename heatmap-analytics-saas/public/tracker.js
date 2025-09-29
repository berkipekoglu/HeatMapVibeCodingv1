(function () {
  "use strict";

  const currentScript = document.currentScript;
  const websiteId = currentScript ? currentScript.dataset.websiteId : null;
  const API_ENDPOINT = "http://localhost:3000/api/track"; // Bu URL production'da değiştirilmeli

  if (!websiteId) {
    console.error("Heatmap Tracker: data-website-id attribute is missing.");
    return;
  }

  // --- Session Management ---
  function getSessionId() {
    let sessionId = sessionStorage.getItem("heatmap_session_id");
    if (!sessionId) {
      // Basit bir UUID benzeri ID oluştur
      sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      sessionStorage.setItem("heatmap_session_id", sessionId);
    }
    return sessionId;
  }

  const sessionId = getSessionId();
  const normalizedUrl = window.location.origin + window.location.pathname;

  // --- Buffering and Throttling for Mouse Movements ---
  let moveBuffer = [];
  let lastSendTime = Date.now();
  const SEND_INTERVAL = 2000; // Send data every 2 seconds
  const BUFFER_LIMIT = 50; // or when buffer reaches 50 points

  /**
   * Sends buffered mouse movement data to the server.
   */
  function sendMoveData() {
    if (moveBuffer.length === 0) {
      return;
    }

    const normalizedUrl = window.location.origin + window.location.pathname;

    const dataToSend = {
      type: "mousemove",
      payload: {
        points: moveBuffer,
        url: normalizedUrl,
        websiteId: websiteId,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: window.innerHeight,
      },
    };

    sendData(dataToSend);

    // Clear buffer and reset timer
    moveBuffer = [];
    lastSendTime = Date.now();
  }

  /**
   * Captures mouse movement events and adds them to a buffer.
   * @param {MouseEvent} event
   */
  function captureMove(event) {
    moveBuffer.push({
      x: event.pageX,
      y: event.pageY,
    });

    const now = Date.now();
    if (
      moveBuffer.length >= BUFFER_LIMIT ||
      now - lastSendTime > SEND_INTERVAL
    ) {
      sendMoveData();
    }
  }

  /**
   * Captures click events.
   * @param {MouseEvent} event
   */
  function captureClick(event) {
    const normalizedUrl = window.location.origin + window.location.pathname;
    const clickData = {
      type: "click",
      payload: {
        x: event.pageX,
        y: event.pageY,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: window.innerHeight,
        url: normalizedUrl,
        websiteId: websiteId,
      },
    };
    sendData(clickData);
  }

  /**
   * Generic function to send data to the API endpoint.
   * @param {object} data - The data object to send.
   */
  function sendData(data) {
    // Ensure any buffered move data is sent first to maintain order
    if (data.type !== "mousemove" && moveBuffer.length > 0) {
      sendMoveData();
    }

    // Add sessionId and userAgent to every payload before sending
    data.payload.sessionId = sessionId;
    data.payload.userAgent = navigator.userAgent;

    fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch((error) => console.error("Error sending tracking data:", error));
  }

  // --- Event Listeners ---
  document.addEventListener("click", captureClick, true);
  document.addEventListener("mousemove", captureMove, { passive: true });

  // Send any remaining data when the user leaves the page
  window.addEventListener("beforeunload", sendMoveData);

  console.log("Heatmap Tracker is active for website:", websiteId, "Session:", sessionId);
})();
