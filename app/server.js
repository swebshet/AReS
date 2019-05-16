const cluster = require('cluster')
const os = require('os')
cluster.schedulingPolicy = cluster.SCHED_NONE

if (cluster.isMaster)  // Start several instances of the app.
    os.cpus().forEach(() => cluster.fork())
else {
    const express = require('express');
    const port = 3000;
    const _ = require("underscore");
    const bodyParser = require('body-parser');
    const cors = require('cors')
    const compression = require('compression');
    const app = express();

    app.use(cors());
    app.use(bodyParser.json());
    app.use(compression());
    var elasticsearch = require('elasticsearch');
    var es_client = new elasticsearch.Client({
        host: 'localhost:9200'
    });
    app.es_client = es_client

    const server = app.listen(port, () => console.log("Server is running on port " + port + ", woker ID: " + cluster.worker.id));
    server.setTimeout(300000)

    app.express = express
    const exporting = require('./exporting')
    exporting(app)

    app.post('/keys', (req, res) => {
        es_client.index({
            index: "metakeys",
            type: "keys",
            body: req.body,
        }).then((data) => {
            res.json(data);
        }).catch((e) => {
            res.statusCode = 500;
            res.json(e);
        })
    });

    app.get('/values', (req, res) => {
        es_client.search({
            size: 10000,
            index: 'metavalues',
            type: "values",
        }).then(keys => res.json(keys.hits.hits));
    });

    app.get('/keys', (req, res) => {
        es_client.search({
            size: 10000,
            index: 'metakeys',
            type: "keys",
        }).then(keys => res.json(keys.hits.hits));
    });

    app.post('/values', (req, res) =>
        es_client.index({
            index: "metavalues",
            type: "values",
            body: req.body,
        })
            .then((data) => res.json(data))
            .catch((e) => {
                res.statusCode = 500;
                res.json(e);
            }))

    const defaultAggs = {
        "dc_contributor_author.keyword": {
            "terms": {
                "field": "dc_contributor_author.keyword",
                "size": 2147483647
            }
        },
        "dc_type.keyword": {
            "terms": {
                "field": "dc_type.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "cg_coverage_country.keyword": {
            "terms": {
                "field": "cg_coverage_country.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "year.keyword": {
            "terms": {
                "field": "year.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "cg_contributor_crp.keyword": {
            "terms": {
                "field": "cg_contributor_crp.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "cg_identifier_status.keyword": {
            "terms": {
                "field": "cg_identifier_status.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "cg_coverage_region.keyword": {
            "terms": {
                "field": "cg_coverage_region.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "dc_subject.keyword": {
            "terms": {
                "field": "dc_subject.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "dc_description_sponsorship.keyword": {
            "terms": {
                "field": "dc_description_sponsorship.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "parentCollection.name.keyword": {
            "terms": {
                "field": "parentCollection.name.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "cg_contributor_affiliation.keyword": {
            "terms": {
                "field": "cg_contributor_affiliation.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "repo.keyword": {
            "terms": {
                "field": "repo.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "dc_language.keyword": {
            "terms": {
                "field": "dc_language.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        "cg_isijournal.keyword": {
            "terms": {
                "field": "cg_isijournal.keyword",
                "size": 2147483647,
                "order": {
                    "_term": "asc"
                }
            }
        },
        'types_sorted_by_count': {
            'terms': {
                "field": "dc_type.keyword",
                "size": 2147483647,
            }
        },
        "top_authors": {
            "terms":{
                "field": "dc_contributor_author.keyword",
                "size": 10
            }
        }
    }

    app.post('/', (req, res) => {
        req.body.aggs = defaultAggs
        es_client.search({
            index: 'publication',
            type: "report",
            body: req.body
        }).then((publications) =>
            res.json(publications))
            .catch((err) => {
                res.statusCode = err.statusCode;
                res.send(err);
            });
    })

    app.post('/search', (req, res) => {
        if (req.body) {
            es_client.search({
                index: 'publication',
                type: 'report',
                body: req.body,
                scroll: req.query.scroll ? '1m' : undefined
            })
                .then(result => res.send(result))
                .catch((err) => {
                    res.statusCode = err.statusCode;
                    res.send(err);
                })
        } else {
            res.statusCode = 400
            res.json(new Error('Bad request, no query specified.'))
        }
    })

    app.post('/scroll', (req, res) => {
        if (req.body && req.body.scroll_id)
            es_client.scroll({ scrollId: req.body.scroll_id, scroll: '1m' })
                .then(batch => res.send(batch))
    })

}