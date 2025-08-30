(function() {
    'use strict';

    const currentScript = document.currentScript;
    const websiteId = currentScript ? currentScript.dataset.websiteId : null;
    const API_ENDPOINT = 'http://localhost:3000/api/track';

    if (!websiteId) {
        console.error('Heatmap Tracker: data-website-id attribute is missing.');
        return;
    }

    // --- Buffering and Throttling for Mouse Movements ---
    let moveBuffer = [];
    let lastSendTime = Date.now();
    const SEND_INTERVAL = 2000; // Send data every 2 seconds
    const BUFFER_LIMIT = 50;   // or when buffer reaches 50 points

    /**
     * Sends buffered mouse movement data to the server.
     */
    function sendMoveData() {
        if (moveBuffer.length === 0) {
            return;
        }

        const dataToSend = {
            type: 'mousemove',
            payload: {
                points: moveBuffer,
                url: window.location.href,
                websiteId: websiteId,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
            }
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
            y: event.pageY
        });

        const now = Date.now();
        if (moveBuffer.length >= BUFFER_LIMIT || now - lastSendTime > SEND_INTERVAL) {
            sendMoveData();
        }
    }

    /**
     * Captures click events.
     * @param {MouseEvent} event
     */
    function captureClick(event) {
        const clickData = {
            type: 'click',
            payload: {
                x: event.pageX,
                y: event.pageY,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                url: window.location.href,
                websiteId: websiteId
            }
        };
        console.log('Click captured:', clickData);
        sendData(clickData);
    }

    /**
     * Generic function to send data to the API endpoint.
     * @param {object} data - The data object to send.
     */
    function sendData(data) {
        // Ensure any buffered move data is sent first to maintain order
        if (data.type !== 'mousemove' && moveBuffer.length > 0) {
            sendMoveData();
        }
        
        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true 
        }).catch(error => console.error('Error sending tracking data:', error));
    }

    // --- Event Listeners ---
    document.addEventListener('click', captureClick, true);
    document.addEventListener('mousemove', captureMove, { passive: true });

    // Send any remaining data when the user leaves the page
    window.addEventListener('beforeunload', sendMoveData);

    console.log('Heatmap Tracker is active for website:', websiteId);

})();
