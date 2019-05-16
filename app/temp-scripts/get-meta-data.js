
let Client = require('node-rest-client').Client;
let formater = require('./data-format.meta');
let _ = require("underscore");
let client = new Client();

let req = client.get("http://cgspace.cgiar.org/rest/items?expand=metadata,bitstreams,parentCollection&limit=100&offset=100", function (data, response) {
    metaData = [];

    data.forEach((element) => {
        let formated = formater.format(element)
        //console.log(JSON.stringify(formated));s
        _.each(formated, (value, key) => {
            if (metaData.indexOf(key) == -1) {
                metaData.push(key);
                console.log(key);

            }

        })
    });

});

req.on('error', function (err) {
    console.log('request error', err);
});









