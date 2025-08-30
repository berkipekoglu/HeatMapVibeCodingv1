(function() {
    'use strict';

    // Get the script tag itself to read data attributes
    const currentScript = document.currentScript;
    const websiteId = currentScript ? currentScript.dataset.websiteId : null;

    // API endpoint for sending data
    const API_ENDPOINT = 'http://localhost:3000/api/track';

    if (!websiteId) {
        console.error('Heatmap Tracker: data-website-id attribute is missing from the script tag.');
        return; // Stop execution if websiteId is not available
    }

    /**
     * Tıklama olayını yakalar ve veriyi işler.
     * @param {MouseEvent} event - Tıklama olayı nesnesi.
     */
    function captureClick(event) {
        const clickData = {
            type: 'click',
            x: event.pageX,
            y: event.pageY,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            websiteId: websiteId // Use the dynamically retrieved websiteId
        };

        console.log('Click captured:', clickData);
        
        // Veriyi sunucuya gönder.
        sendData(clickData);
    }

    /**
     * Toplanan veriyi sunucuya gönderir.
     * @param {object} data - Gönderilecek veri.
     */
    function sendData(data) {
        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true // Sayfa kapanırken bile isteğin gitmesini sağlar
        }).catch(error => console.error('Error sending tracking data:', error));
    }

    // Sayfadaki tüm tıklama olaylarını dinle.
    document.addEventListener('click', captureClick, true);

    console.log('Heatmap Tracker is active for website:', websiteId);

})();