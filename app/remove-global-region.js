const es = require('elasticsearch')
const es_client = new es.Client({
    host: 'localhost:9200'
})

/**
 * This script changes all instances of "Global" region to be null. See issue #60
 */

es_client.updateByQuery({
    index: 'publication',
    type: 'report',
    body: {
        query: {
            bool: {
                must: [
                    { match: { 'cg_coverage_region.keyword': 'Global' } }
                ]
            }
        },
        script: {
            source: "ctx._source.cg_coverage_region = null"
        }
    }
})
    .then(() => console.log('Done updating "Global" region to null.'))
    .catch(err => console.error('Error while updating "Global" region to null, ', err))