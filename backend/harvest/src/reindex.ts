
import { Client } from 'elasticsearch';
import * as config from '../../config/index.json'

function cnf() {
    return { host: config.elasticsearch.host, requestTimeout: 100000 };
}
const es_client = new Client(cnf())

/*
    This script moves all indexed items from the index "items-temp" to config.final_index.
    In the process, the "items" alias will point to "items-temp", and when the re-indexing is done, 
    "items" will point back to config.final_index.
*/

function connect(resolve: any, reject: any) {
    es_client.ping({
        maxRetries: 50,
        // ping usually has a 3000ms timeout
        requestTimeout: 3000,
    }).then(async () => {

        try {
            let exitstTemp = await es_client.indices.exists({ index: config.final_index }).catch(e => false)
            if (!exitstTemp) {
                await es_client.indices.create({ index: config.final_index })
                console.log("created index final")
            }

            let existFinal = await es_client.indices.exists({ index: "items-temp" }).catch(e => false)
            if (!existFinal) {
                await es_client.indices.create({ index: "items-temp" })
                console.log("created index temp")
            }
            resolve(true)
        } catch (e) {
            reject(e)
        }

    }).catch((e) => {
        setTimeout(() => {
            connect(resolve, reject);
        }, 2000);

        console.log("reconnect")
    });
}

export function makeIndexesIfNotExist() {
    return new Promise((resolve, reject) => {
        connect(resolve, reject);
    });

}


export function reindex() {

    es_client.indices.updateAliases({
        body: {
            actions: [
                { remove: { index: config.final_index, alias: 'items' } },
                { add: { index: config.temp_index, alias: 'items' } }
            ]
        }
    })
        .catch((err: Error) => console.error('Could not add alias "items" to index "items-temp", ', err))
        .then(() => es_client.deleteByQuery({
            refresh: 'wait_for',
            index: config.final_index,
            type: config.index_type,
            body: { query: { match_all: {} } }
        }))
        .then(() => console.log('Cleared items-final.'))
        .then(() => es_client.reindex({
            waitForCompletion: true,
            body: {
                source: { index: config.temp_index },
                dest: { index: config.final_index }
            }
        }))
        .then(() => console.log('Reindexing complete.'))
        .then(() => es_client.deleteByQuery({
            refresh: 'wait_for',
            index: config.temp_index,
            type: config.index_type,
            body: { query: { match_all: {} } }
        }))
        .then(() => console.log('Cleared items-temp.'))
        .then(() => es_client.search({ index: config.temp_index, type: config.index_type, body: { query: { match_all: {} } } }).then((res: any) => console.log('total in items-temp after clearing: ', res.hits.total)))
        .then(() => es_client.indices.updateAliases({
            body: {
                actions: [
                    { remove: { index: config.temp_index, alias: 'items' } },
                    { add: { index: config.final_index, alias: 'items' } }
                ]
            }
        }))
        .then(() => console.log('Switched alias pointer back to index config.final_index.'))

}