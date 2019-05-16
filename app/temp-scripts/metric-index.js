let Client = require('node-rest-client').Client;
let _ = require("underscore");
let client = new Client();
var elasticsearch = require('elasticsearch');
var es_client = new elasticsearch.Client({
    host: 'localhost:9200'
});
es_client.ping({
    // ping usually has a 3000ms timeout
    requestTimeout: 1000
}, function (error) {
    if (error) {
        console.trace('elasticsearch cluster is down!');
    } else {
        console.log('elasticsearch cluster is working fine');
    }
});

function indexing(page) {
    //offset = page * 20;
    let link = "https://api.altmetric.com/v1/citations/at?num_results=100&handle_prefix=10568&page=" + page;
    let req = client.get(link, function (data) {

        let finaldata = [];
        data.results.forEach(element => {
            element['handle_prefix'] = 10568;
            finaldata.push({ index: { _index: 'altmetric', _type: 'report', _id: element.altmetric_id } });
            finaldata.push(element);
        });


        es_client.bulk({
            body: finaldata
        }, function (err, resp) {
            if (err)
                console.log('bulk error', err);
            //else
            // console.log(JSON.stringify(finaldata));
            console.log('indexing page finish ', page, link)
            if (page <= 61)
                indexing(page + 1);
        });

    });
    req.on('error', function (err) {
        console.log('request error', err);
    });
}

indexing(1);







