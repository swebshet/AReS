const es = require('elasticsearch')
const es_client = new es.Client({
    host: 'localhost:9200'
})
const nodeClient = require('node-rest-client')
const Client = new nodeClient.Client()

const cgspaceStateletsUrl = 'https://cgspace.cgiar.org/rest/statlets?handle='

const updateCgspaceStats = publication => {
    if (publication._source.handle) {
        const stateletsRequest = Client.get(cgspaceStateletsUrl + publication._source.handle, dataSets => {
            const targetMatrix = dataSets && dataSets[0] && dataSets[0].dataset ? dataSets[0].dataset.matrix : undefined
            const views = targetMatrix && targetMatrix[0] ? targetMatrix[0][0] || 0 : 0
            const downloads = targetMatrix && targetMatrix[0] ? targetMatrix[0][1] || 0 : 0
            const score = views + downloads
            const statsObject = { views, downloads, score }

            if (score > 0)
                es_client.update({
                    index: publication._index,
                    type: publication._type,
                    id: publication._id,
                    body: { doc: { statelets: statsObject } }
                })
                    .catch(err => console.error(`Could not update item of id ${publication._id} with value ${JSON.stringify(statsObject)}: `, err.message))
        })
        stateletsRequest.on('error', err => console.error('Network failure while updating statelets, ', err.message))
    }
}

const getNextBatch = scrollId => es_client.scroll({ scroll: '5m', scrollId })

es_client.search({
    index: 'publication',
    body: { size: 5, query: { match: { "repo.keyword": "CGSPACE" } } },
    scroll: '5m'
}).then(initBatch => { // Update CGSPACE publications
    const scrollId = initBatch._scroll_id
    const timer = setInterval(async () => {
        const batch = await getNextBatch(scrollId)
        if (batch.hits.hits.length === 0) {
            clearInterval(timer)
            console.log('Done updating views and downloads of CGSPACE publications.')
        }
        else batch.hits.hits.forEach(updateCgspaceStats)
    }, 200)
})