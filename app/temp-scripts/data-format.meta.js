let _ = require("underscore");

module.exports = {
    keys: {
        "dc.date": "dc.date.issued",
        "dc.creator": "dc.contributor.author",
        "dc.contributor": "dc.contributor.author",
        "cg.contributor.funder": "dc.description.sponsorship",
        "dc.identifier.status": "cg.identifier.status",
        "mel.ISO3166/MA": "cg.coverage.country"
    },
    fixKey(key) {
        return key;
    },
    replaceAll(target, search, replacement) {
        return target.split(search).join(replacement); //target.replace(new RegExp(search, 'g'), replacement);
    },
    format(json) {
        var values = { bitstreams: {} };
        var tobearray = [];
        _.each(json, (item, index) => {



            if (index == 'metadata') {
                item.forEach(element => {
                    element.key = this.fixKey(element.key);
                    if (tobearray.indexOf(element.key) == -1) {
                        values[element.key] = element.value
                        tobearray.push(element.key)
                    }
                    else {
                        if (!_.isArray(values[element.key])) {
                            var array = [];
                            array.push(values[element.key])
                            array.push(element.value)
                            values[element.key] = array;

                        } else {
                            values[element.key].push(element.value);
                        }

                    }




                });
            } else if (index == 'bitstreams') {

                // console.log(item);
                if (item)
                    item.forEach(element => {

                        values['bitstreams'][element.bundleName] = element.name;

                    });
            } else
                values[index] = item



            var value = values[index]
            delete values[index];
            values[this.fixKey(index)] = value;

        })

        return values;
    }


}