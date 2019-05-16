let Client = require('node-rest-client').Client;
let _ = require("underscore");
let formater = require('./data-format');

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

indixing(1,"10568");
indixing(1,"20.500.11766");
function indixing(page,prefix) {
  console.log('start indixing page '+page);
    client.get("https://api.altmetric.com/v1/citations/at?num_results=100&handle_prefix="+prefix+"&page=" + page, function (data) {
	if(data.results){
        data.results.forEach(element => {
            //mentions = 0;
            // _.forEach(element, (value, index) => {
            //     if (index.indexOf('cited_by_') != -1)
            //         mentions = mentions + parseInt(value);
            // })
            addmetric({ score: element.score, readers: element.readers_count, mentions: element.cited_by_accounts_count }, element.handle)


        });

        if (page < Math.ceil(parseInt(data.query.total) / 100))
            indixing(page + 1,prefix);
}
    });
}



function addmetric(metrics, handle) {

    es_client.search({
        index: "publication",
        type: 'report',
        body: {
            query: {
                "constant_score": {
                    "filter": {
                        "bool": {
                            "must": [
                                { "term": { "handle.keyword": handle } },
                            ]
                        }
                    }
                }
            }
        }



    }).then((data) => {
        var hits = data.hits.hits[0];
        if (data.hits.total > 0) {
            hits._source['altmetric'] = metrics;
            es_client.update({
                index: hits._index,
                type: hits._type,
                id: hits._id,
                body: { doc: hits._source }
            }).then(() => {
                console.log(handle, ' => altmetric updated');
            });
        }

    })

}
