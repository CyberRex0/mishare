chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.opType === 'checkToken') {
        var api_key = request.api_key;
        var host = request.host;
        fetch('https://' + host + '/api/i', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({i: api_key})
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            if (result.error) {
                sendResponse({success: false, error: result.error});
            }else{
                sendResponse({success: true, error: null});
            }
        })
        .catch(error => {
            sendResponse({success: false, error: {message: error.message}});
        });
        return true;
    }

    if (request.opType === 'sendNote') {
        var api_key = request.api_key;
        var host = request.host;
        var text = request.text;

        fetch('https://' + host + '/api/notes/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                i: api_key,
                text: text,
                visibility: request.visible ? request.visible : 'public'
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            if (result.error) {
                sendResponse({success: false, error: result.error});
            }else{
                sendResponse({success: true, error: null});
            }
        })
        .catch(error => {
            sendResponse({success: false, error: {message: error.message}});
        });
        return true;
    }

    if (request.opType === 'checkValidInstance') {
        var host = request.host;
        fetch('https://' + host + '/api/meta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                sendResponse(false);
            }else{
                sendResponse(true);
            }
        })
        .catch(error => {
            sendResponse(false);
        });
        return true;
    }
});