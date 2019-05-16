const es = require('elasticsearch')
const es_client = new es.Client({
    host: 'localhost:9200'
})

/**
 * Updates all records that don't have the isijournal
 *  value of "ISI Journal" to have the isijournal value "Non-ISI Journal".
 * 
 * NOTE: This might result in a Request timeout.
 */

es_client.updateByQuery({
    index: 'publication',
    type: 'report',
    body: {
        script: {
            source: "ctx._source.cg_isijournal = 'Non-ISI Journal'"
        },
        query: {
            bool: {
                must_not: [
                    {
                        match: {
                            "cg_isijournal": "ISI Journal"
                        }
                    }
                ]
            }
        }
    }
})
    .then(updateResponse => console.log('isijournal updated successfully: ', updateResponse))
    .catch(err => console.error('Failed while updating isijournal: ', err.message))