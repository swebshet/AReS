import { Client as elasticsearch } from 'elasticsearch'
import * as config from '../../../../../config/index.json';
function cnf() {
    return { host: config.elasticsearch.host };
}
const es_client = new elasticsearch(cnf())

const nodeClient = require('node-rest-client');
const Client = new nodeClient.Client();

export function DownloadsAndViews(link: string) {


    return new Promise((resolve, reject) => {
        const cgspacenumbersUrl = link + '/rest/statistics/items';
        const limit = 100;
      
        indexing(0)
        function indexing(page: number) {
            let toUpdateIndexes: Array<any> = [];
            Client.get(`${cgspacenumbersUrl}?page=${page}&limit=${limit}`, (stats: any) => {
                if (stats.statistics && stats.statistics.length > 0) {
                    stats.statistics.forEach((stat: any) => {
                        const numbers = {
                            views: parseInt(stat.views),
                            downloads: parseInt(stat.downloads),
                            score: parseInt(stat.views) + parseInt(stat.downloads)
                        };
                        toUpdateIndexes.push({ update: { _index: config.temp_index, _type: config.index_type, _id: "CGSPACE_" + stat.id } });
                        toUpdateIndexes.push({ "doc": { numbers } })
                    });
                    es_client.bulk({
                        refresh: 'wait_for',
                        body: toUpdateIndexes
                    }).then((currentResult: any) => {
                        currentResult.items.forEach((element: any) => {
                            if (element.update.status != 200)
                                console.log(element.update.error.reason);
                        });
                        indexing(page + 1)
                    }).catch((e: any) => {
                        indexing(page + 1)
                        console.log(e)
                    })
                }
                else {
                    resolve("Done updating downloads and views");
                }
            });
        }
    })
}

