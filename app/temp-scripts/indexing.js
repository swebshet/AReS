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


const Agenda = require('agenda');
const { MongoClient } = require('mongodb');

async function run() {
    const db = await MongoClient.connect('mongodb://localhost:27017/agenda');

    // Agenda will use the given mongodb connection to persist data, so jobs
    // will go in the "agendatest" database's "jobs" collection.
    const agenda = new Agenda().mongo(db, 'jobs');

    // Define a "job", an arbitrary function that agenda can execute


    agenda.define('Indexing CGspace', { priority: 'high', concurrency: 1 }, (job, done) => {
        var offset = job.attrs.data.page * 20;
        client.get("http://cgspace.cgiar.org/rest/items?expand=all&limit=20&offset=" + offset, function (data, response) {
            var finaldata = [];
            job.attrs.data['res']=data;
            data.forEach(element => {
                let formated = formater.format(element)
                finaldata.push({ index: { _index: 'publication', _type: 'report', _id: formated.id } });
                finaldata.push(formated);
            });

            es_client.bulk({
                body: finaldata
            }, function (err, resp) {
                if (err)
                    done(err);
                else
                    done();
            });
        });
    });
    agenda.define('Indexing CGspace Altmetrics', { priority: 'high', concurrency: 5 }, (job, done) => {
        var page = job.attrs.data.page
        client.get("https://api.altmetric.com/v1/citations/at?num_results=100&handle_prefix=" + job.attrs.data.handle_prefix + "&page=" + page, function (data, response) {
            var finaldata = [];
                data.results.forEach(element => {
                    element['handle_prefix'] = job.attrs.data.handle_prefix;
                    finaldata.push({ index: { _index: 'altmetric', _type: 'report', _id: element.altmetric_id } });
                    finaldata.push(element);
                });
                es_client.bulk({
                    body: finaldata
                }, function (err, resp) {
                    if (err)
                        done(err);
                    else
                        done();
                });
            
          
        });
    });

    // Wait for agenda to connect. Should never fail since connection failures
    // should happen in the `await MongoClient.connect()` call.
    await new Promise(resolve => agenda.once('ready', resolve));

    // Schedule a job for 1 second from now and persist it to mongodb.
    // Jobs are uniquely defined by their name, in this case "hello"
    //for (let index = 0; index < 1100; index++)
    //agenda.schedule(new Date(Date.now() + 1000), 'Indexing CGspace', { "page": index});

   
//"total": 6049,10568
    for (let index = 1; index < 100; index++)
        agenda.schedule(new Date(Date.now() + 1000), 'Indexing CGspace Altmetrics', { "page": index,handle_prefix:  10568 });

    agenda.start();
}

run().catch(error => {
    console.error(error);
    process.exit(-1);
});