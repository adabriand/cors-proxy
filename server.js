var express = require('express'),
    request = require('request'),
    bodyParser = require('body-parser'),
    app = express();

var myLimit = typeof(process.argv[2]) != 'undefined' ? process.argv[2] : '100kb';
console.log('Using limit: ', myLimit);

// parse various different custom JSON types as JSON
app.use(bodyParser.json({ type: 'application/*+json' }))

// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'audio/webm' }))

// parse an HTML body into a string
app.use(bodyParser.text({ type: 'text/html' }))

function buildAuthHeader(user, pass) {
    return 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
}

app.all('*', function (req, res, next) {

    // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));
    res.header("Access-Control-Expose-Headers", "x-voud-user-token");

    if (req.method === 'OPTIONS') {
        // CORS Preflight
        res.send();
    } else {
        var targetURL = req.header('Target-URL');
        var targetProxyHost = req.header('Target-Proxy-Host');
        var targetProxyPort = req.header('Target-Proxy-Port');
        var targetProxyUsername = req.header('Target-Proxy-Username');
        var targetProxyPassword = req.header('Target-Proxy-Password');
        
        if (!targetURL) {
            res.send(500, { error: 'There is no Target-Endpoint header in the request' });
            return;
        }

        var headers = {};
        if (req.header('Content-Type')) headers['Content-Type'] = req.header('Content-Type');
        if (req.header('X-VOUD-USER-TOKEN')) headers['X-VOUD-USER-TOKEN'] = req.header('X-VOUD-USER-TOKEN');
        if (req.header('X-VOUD-CHANNEL')) headers['X-VOUD-CHANNEL'] = req.header('X-VOUD-CHANNEL');
        if (req.header('X-VOUD-BUILD-NUMBER')) headers['X-VOUD-BUILD-NUMBER'] = req.header('X-VOUD-BUILD-NUMBER');
        if (targetProxyUsername && targetProxyPassword) headers['Proxy-Authorization'] = buildAuthHeader(targetProxyUsername, targetProxyPassword);
        
        var options = { 
            url: targetURL + req.url, 
            method: req.method, 
            body: req.body,
            headers: headers,
        };
        
//         if (targetProxyHost) options['host'] = targetProxyHost;
        if (targetProxyPort) options['proxy] = https://[targetProxyUsername]:[targetProxyPassword]@[targetProxyHost]:[targetProxyPort];
        
        console.log(options);
        console.log(headers);
        
        request(options,
        function (error, response, body) {
            if (error) {
                console.error('error: ' + response.statusCode)
            }
           console.log(body);
        }).pipe(res);
    }
});

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function () {
    console.log('Proxy server listening on port ' + app.get('port'));
});
