let Client = require('node-rest-client').Client;
import * as _ from 'underscore'
let client = new Client();
import { Client as elasticsearch, SearchResponse } from 'elasticsearch'
import * as config from '../../../../../config/index.json';
function cnf() {
    return { host: config.elasticsearch.host };
}
const es_client = new elasticsearch(cnf())

export function altmetric(mainhandle: string) {


    return new Promise(async (resolve, reject) => {
        let handlesIds: any = await generateCache()
        let Allindexing: Array<any> = []
        indexing(1, mainhandle);
        function indexing(page: number, prefix: string) {
            client.get("https://api.altmetric.com/v1/citations/at?num_results=100&handle_prefix=" + prefix + "&page=" + page, function (data: any) {
                if (data.results) {
                    data.results.forEach((element: any) => {
                        let altmetric = {
                            score: element.score,
                            readers: element.readers_count,
                            mentions: element.cited_by_accounts_count
                        }
                        if (handlesIds[element.handle]) {
                            Allindexing.push({ update: { _index: config.temp_index, _type: config.index_type, _id: handlesIds[element.handle] } });
                            Allindexing.push({ "doc": { altmetric } });
                        }
                    });

                    es_client.bulk({
                        refresh: 'wait_for',
                        body: Allindexing
                    }).then((currentResult: any) => {
                        currentResult.items.forEach((element: any) => {
                            if (element.update.status != 200)
                                console.log(element.update.error.reason);
                        });
                        if (page < Math.ceil(parseInt(data.query.total) / 100))
                            indexing(page + 1, prefix);
                        else
                            resolve("altmetric done => "+prefix);
                    }).catch((e: any) => {
                        indexing(page + 1, prefix);
                        console.log(e)
                    })
                }
            });
        }
    })
}

function generateCache() {
    return new Promise((resolve, reject) => {
        let allRecords: any = [];
        let total = 0;

        let elastic_data = {
            index: config.temp_index,
            type: config.index_type,
            body: {
                size: 500,
                _source: ["handle"],
                query: {
                    "exists": { "field": "handle" }
                }
            },
            scroll: '10m'
        };

        es_client.search(elastic_data, function getMoreUntilDone(error, response: SearchResponse<any>) {
            if (error == null) {
                let handleID = response.hits.hits.map((d: any) => {

                    if (d._source.handle) {
                        let obj: any = {};
                        obj[d._source.handle] = d._id
                        return obj
                    }

                })
                allRecords = [...allRecords, ...handleID];
                if (total === 0) {
                    total = response.hits.total;
                }
                if (response.hits.total !== allRecords.length) {
                    es_client.scroll({
                        scrollId: <string>response._scroll_id,
                        scroll: '10m'
                    }, getMoreUntilDone);
                } else {
                    let finalobj: any = {};
                    allRecords.forEach((element: any) => {
                        finalobj[Object.keys(element)[0]] = Object.values(element)[0]
                    });

                    resolve(finalobj)
                }
            } else {
                reject(error);
            }
        });
    });
}
