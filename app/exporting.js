const JSZip = require('jszip')
const Docxtemplater = require('docxtemplater')
const fs = require('fs')
const toPdf = require('office-to-pdf')
const cron = require('node-cron')
const cluster = require('cluster')
const expressions = require('angular-expressions');
const path = require('path')

module.exports = app => {

    // Create directory for temporary .docx and .pdf files.
    const tempDir = './temp-exports'
    if (!fs.existsSync(tempDir))
        fs.mkdirSync(tempDir)

    app.use('/exports', app.express.static(tempDir))

    const docxTemplate = fs.readFileSync('./exports-template.docx', 'binary')
    const getExportsFileName = (extension, partNumber) =>
        `exports${(partNumber > 0 ? (' (' + partNumber) + ') ' : '')}-${new Date()}-${cluster.worker.id}${Math.floor(Math.random() * 100000)}.${extension}`

    const getPublications = query => app.es_client.search({
        index: 'publication',
        type: 'report',
        body: Object.assign({
            _source: [
                "id",
                "dc_title",
                "cg_identifier_status",
                "dc_identifier_citation",
                "dc_type",
                "dc_format",
                "dc_subject",
                "dc_date_issued",
                "cg_contributor_crp",
                "altmetric.score",
                "dc_identifier",
                "cg_identifier_url",
                "repo",
            ]
        }, query)
    })
        .then(data => data.hits.hits.map(p => p._source))
        .catch(err => console.error("Could not load export publications, ", err))

    const writeDocxExportsFile = (publicationsPromise, partNumber) => publicationsPromise.then(publications => {
        const angularParser = function (tag) {
            let return_value = {};
            if (tag === 'THIS') {
                return_value = {
                    get: function (s) {
                        return s;
                    }
                }
            } else if (tag === 'THIS.exists') {
                return_value = {
                    get: function (s) {
                        return typeof s !== 'object';
                    }
                }
            } else if (tag === 'cg_contributor_crp.join') {
                return_value = {
                    get: function (s) {
                        if (Array.isArray(s.cg_contributor_crp)) {
                            return s.cg_contributor_crp.join('; ')
                        } else {
                            return s.cg_contributor_crp;
                        }
                    }
                }
            } else if (tag === 'dc_subject.join') {
                return_value = {
                    get: function (s) {
                        if (Array.isArray(s.dc_subject)) {
                            return s.dc_subject.join('; ')
                        } else {
                            return s.dc_subject;
                        }
                    }
                }
            } else if (tag === 'isMELSPACE') {
                return_value = {
                    get: function (s) {
                        return s.repo === 'MELSPACE';
                    }
                }
            } else {
                return_value = { get: expressions.compile(tag) };
            }
            return return_value;
        };
        const templateZip = new JSZip(docxTemplate)
        const doc = new Docxtemplater()
        doc.loadZip(templateZip);
        doc.setOptions({ parser: angularParser });

        doc.setData({ publications, date: new Date() })
        doc.render()
        const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: "DEFLATE" })
        const docName = getExportsFileName('docx', partNumber)
        fs.writeFileSync(`${tempDir}/${docName}`, buffer)
        return docName
    }).catch(err => console.error('Failed to write .docx document, ', JSON.stringify(err)))

    app.post('/exporting/exports.docx/scroll', async (req, res) => {
        if (req.query.init === 'true') {
            const batch = app.es_client.search({
                scroll: '10m',
                body: req.body,
                index: 'publication'
            })
            const scrollId = (await batch)._scroll_id
            const publications = batch.then(b => b.hits.hits.map(p => p._source))
            writeDocxExportsFile(publications, req.query.partNumber).then(docName => res.send({ file: docName, scroll: scrollId }))
        } else {
            const batch = app.es_client.scroll({ scroll: '10m', scrollId: req.body.scrollId })
            const scrollId = (await batch)._scroll_id
            writeDocxExportsFile(batch.then(b => b.hits.hits.map(p => p._source)), req.query.partNumber)
                .then(docName => res.send({ file: docName, scroll: scrollId }))
        }
    })

    app.post('/exporting/exports.pdf/scroll', async (req, res) => {
        if (req.query.init === 'true') {
            const fileName = getExportsFileName('pdf')
            const batch = app.es_client.search({
                scroll: '10m',
                body: req.body,
                index: 'publication'
            })
            const scrollId = (await batch)._scroll_id
            const publications = batch.then(b => b.hits.hits.map(p => p._source))
            const docxFileName = await writeDocxExportsFile(publications, req.query.partNumber)
            const resPdf = await toPdf(fs.readFileSync(`${tempDir}/${docxFileName}`))
            fs.writeFile(`${tempDir}/${fileName}`, resPdf, (err) => {
                if (err) throw err
                res.send({ file: fileName, scroll: scrollId })
            })
        } else {
            const fileName = getExportsFileName('pdf')
            const batch = app.es_client.scroll({ scroll: '10m', scrollId: req.body.scrollId })
            const scrollId = (await batch)._scroll_id
            const docxFileName = await writeDocxExportsFile(batch.then(b => b.hits.hits.map(p => p._source)), req.query.partNumber)
            const resPdf = await toPdf(fs.readFileSync(`${tempDir}/${docxFileName}`))
            fs.writeFile(`${tempDir}/${fileName}`, resPdf, (err) => {
                if (err) throw err
                res.send({ file: fileName, scroll: scrollId })
            })
        }
    })

    // Delete temp files every day at 1AM
    cron.schedule('* 1 * * *', () => {
        try {
            if (cluster.worker.id === 1) {
                const dir = fs.readdirSync(tempDir)
                dir.forEach(file => {
                    try { fs.unlinkSync(path.resolve(tempDir + '/' + file)) }
                    catch (err) { console.error('Error while deleting file: ', err) }
                })
                console.log('Done deleting temp export files.')
            }
        } catch (err) {
            console.error('Could not delete temporarry export files in cron job, ', err)
        }
    })

}
