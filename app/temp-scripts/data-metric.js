let Client = require('node-rest-client').Client;

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

indexing(1);
function indexing(page) {

    es_client.search({
        size: 100,
        from: (page * 100) - 100,
        index: "altmetric",
        type: 'report'
    }, (err, resp) => {
        if (err)
            console.log(err);
        else {
            resp.hits.hits.forEach(element => {

                es_client.search({
                    index: "publication",
                    type: 'report',
                    body: {
                        query: {
                            "constant_score": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            { "term": { "handle.keyword": element._source.handle } },
                                        ]
                                    }
                                }
                            }
                        }
                    }



                }, (err, resp) => {
                    if (err)
                        console.log(err);
                    else {
                        if (resp.hits.total) {
                            let src = resp.hits.hits[0]._source;
                            src["altmetric"] = element._source;
                            //src.name="updated";
                            es_client.bulk(
                                {
                                    body: [
                                        { update: { _index: "publication", _type: "report", _id: resp.hits.hits[0]._id, } },
                                        { doc:  src }
                                    ]
                                }).then((resp) => {
                                   // console.log(src.id, src.name)
                                    
                                }).catch((err) => {
                                    console.log(err);
                                })
                        }

                         else
                             console.log(element._source.handle, ' not exist');
                    }


                })

            });
            if(page=10)
            indexing(page +1) ;
        }
    });
}