let Client = require('node-rest-client').Client;
let formater = require('./data-format');
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

function indexing(page, keys, values) {
    offset = page * 100;
    let req = client.get("http://cgspace.cgiar.org/rest/items?expand=metadata,bitstreams,parentCollection&limit=100&offset=" + offset, function (data, response) {
        if (_.isEmpty(data))
            return;
        var finaldata = [];
        data.forEach(element => {

            let formated = formater.format(element, keys, values);

            if (formated.dc_date_issued != undefined && formated.dc_date_issued != '') {
                if (_.isArray(formated.dc_date_issued))
                    formated.dc_date_issued = formated.dc_date_issued[0];
                formated['year'] = formated.dc_date_issued.split("-")[0]
            }

            formated['repo'] = "CGSPACE";
            finaldata.push({ index: { _index: 'publication', _type: 'report', _id: formated.id } });
            finaldata.push(formated);
        });
        es_client.bulk({
            body: finaldata
        }, function (err, resp) {
            if (err)
                console.log('bulk error', err);
            //else
            // console.log(JSON.stringify(finaldata));
            console.log('indexing page finish ', page, offset)
            indexing(page + 1, keys, values);
        });
    });

    req.on('error', function (err) {
        console.log('request error', err);
    });


}
console.log('getting keys');
es_client.search({ index: 'metakeys', type: "keys", body: { from: 0, size: 10000 } }).then((data) => {
    keys = {},
        data.hits.hits.forEach((hits) => {
            keys[hits._source.base] = hits._source.replace;
        });
    console.log('getting keys done');
    console.log('getting values');
    es_client.search({ index: 'metavalues', type: "values", body: { from: 0, size: 10000 } }).then((data) => {
        console.log('getting values done');
        values = {},
            data.hits.hits.forEach((hits) => {
                if (values[hits._source.metakey] == undefined)
                    values[hits._source.metakey] = {}
                values[hits._source.metakey][hits._source.search] = hits._source.replace;
            });
        console.log('indexing started');
        indexing(1, keys, values);
    }).catch((e) => console.log(e));

}).catch((e) => console.log(e));;
