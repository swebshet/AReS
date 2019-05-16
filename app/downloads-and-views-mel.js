const es = require('elasticsearch')
const es_client = new es.Client({
    host: 'localhost:9200'
})
const nodeClient = require('node-rest-client')
const Client = new nodeClient.Client()

const melStateletsUrl = 'https://mel.cgiar.org/dspace/getdspaceitemsvisits/dspace_item_ids/'

const updateMelStats = publicationsToUpdate => {
    try {
        const statRequest = Client.get(
            melStateletsUrl + publicationsToUpdate.map(p => p._source.id).join(','),
            { headers: { 'Content-Type': 'application/json' }, timeout: 120000 },
            stats => {
                if (stats && stats.data && stats.data.length > 0)
                    stats.data.forEach((stat) => {
                        let dspace_id = publicationsToUpdate.find(p => p._source.id == stat.dspace_item_id)._id;
                        if (dspace_id) {
                            es_client.update({
                                index: 'publication',
                                type: 'report',
                                id: dspace_id,
                                body: { doc: { statelets: { views: stat.views, downloads: stat.downloads, score: stat.views + stat.downloads } } }
                            })
                                .catch(err => console.error('Failed while updating stats for MEL record, ', err.message));
                        } else {
                            console.log('could not map item ID: ' + stat.dspace_item_id)
                        }
                    })
            })
        statRequest.on('error', err => console.log('Failed while fetching MEL stats, ', err.message))
    } catch (err) {
        console.error('Failed while processing MEL stats, ', err.message)
    }
}
const getNextBatch = scrollId => es_client.scroll({ scroll: '5m', scrollId })
es_client.search({
    index: 'publication',
    scroll: '5m',
    body: { size: 20, query: { match: { 'repo.keyword': 'MELSPACE' } } }
})
    .then(melInitBatch => {
        const scrollId = melInitBatch._scroll_id
        const timer = setInterval(async () => {
            const batch = await getNextBatch(scrollId)
            if (batch.hits.hits.length === 0) {
                clearInterval(timer)
                console.log('Done updating MEL stats.')
            }
            else updateMelStats(batch.hits.hits)
        }, 500)
    })