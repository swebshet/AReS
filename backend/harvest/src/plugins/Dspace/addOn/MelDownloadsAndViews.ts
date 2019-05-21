
import { Client as elasticsearch } from 'elasticsearch'
import { stringify } from 'querystring';
import * as config from '../../../../../config/index.json';
function cnf() {
    return { host: config.elasticsearch.host };
}
const es_client = new elasticsearch(cnf())

const NodeClient = require('node-rest-client')
const nodeClient = new NodeClient.Client();

const melnumbersUrl = 'https://mel.cgiar.org/dspace/getdspaceitemsvisits/dspace_item_ids/'


export function MelDownloadsAndViews() {



    return new Promise((resolve, reject) => {

        const updateMelStats = (publicationsToUpdate: any, scrollId: string) => {

            try {

                const statRequest = nodeClient.get(
                    melnumbersUrl + publicationsToUpdate.map((p: any) => p._source.id.split("_")[1]).join(','),
                    { headers: { 'Content-Type': 'application/json' }, timeout: 120000 },
                    (stats: any) => {
                        let finaldata: Array<any> = [];
                        if (stats && stats.data && stats.data.length > 0)
                            stats.data.forEach((stat: any) => {
                                let dspace_id = publicationsToUpdate.find((p: any) => p._source.id.split("_")[1] == stat.dspace_item_id)._id;

                                if (dspace_id) {
                                    finaldata.push(
                                        { "update": { "_id": dspace_id, "_type": config.index_type, "_index": config.temp_index } }
                                    )
                                    finaldata.push({ "doc": { numbers: { views: parseInt(stat.views), downloads: parseInt(stat.downloads), score: parseInt(stat.views) + parseInt(stat.downloads) } } })

                                } else {
                                    //console.log('could not map item ID: ' + stat.dspace_item_id)
                                }
                            })
                        else
                            setTimeout(() => {
                                updateMelStats(publicationsToUpdate, scrollId)
                            }, 1000);
                        es_client.bulk({
                            refresh: 'wait_for',
                            body: finaldata
                        }).then(async () => {
                            const batch = await getNextBatch(scrollId)
                            if (batch.hits.hits.length === 0) {
                                resolve('Done updating MEL stats.')
                            } else
                                updateMelStats(batch.hits.hits, scrollId);
                        }).catch(async (err: Error) => {
                            const batch = await getNextBatch(scrollId)
                            updateMelStats(batch.hits.hits, scrollId);
                        });
                    })
                statRequest.on('error', (err: Error) => reject(err.message))
            } catch (err) {
                reject(err.message)
            }
        }
        const getNextBatch = (scrollId: string) => es_client.scroll({ scroll: '5m', scrollId })
        es_client.search({
            index: config.temp_index,
            scroll: '5m',
            body: { size: 100, query: { match: { 'repo.keyword': 'MELSPACE' } } }
        }).then(async (melInitBatch: any) => {
            const scrollId = melInitBatch._scroll_id
            const batch = await getNextBatch(scrollId)
            updateMelStats(batch.hits.hits, scrollId);
        })

    })
}