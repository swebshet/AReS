let _ = require("underscore");

module.exports = {
    keys: {
        // "dc.date": "dc.date.issued",
        // "dc.creator": "dc.contributor.author",
        // "dc.contributor": "dc.contributor.author",
        // "cg.contributor.funder": "dc.description.sponsorship",
        // "lsdc.identifier.status": "cg.identifier.status",
    },
    values: {
        //"Western Africa": "WEST AFRICA",
        // "Southern Asia" : "SOUTH ASIA"
    },
    hardvalues: {
        "Western Africa": "WEST AFRICA",
        // "Southern Asia" : "SOUTH ASIA"
    },
    fixValue(key, value) {
        if (this.values[key+ '.keyword'] != undefined && this.values[key+ '.keyword'][value] != undefined) {
            value = this.values[key + '.keyword'][value]
        }
        return value;
    },
    fixKey(key) {
        if (this.keys[key] != undefined)
            key = this.keys[key]
        key = this.replaceAll(key, ".", "_")
        return key;
    },
    replaceAll(target, search, replacement) {
        return target.split(search).join(replacement); //target.replace(new RegExp(search, 'g'), replacement);
    },
    format(json, keys, valuesP) {
        this.keys = keys;
        this.values = valuesP;
        var values = { bitstreams: {} };
        var tobearray = [];
        _.each(json, (item, index) => {



            if (index == 'metadata') {
                item.forEach(element => {
                    element.key = this.fixKey(element.key);
                    if (tobearray.indexOf(element.key) == -1) {
                        values[element.key] = this.fixValue(element.key, element.value)
                        tobearray.push(element.key)
                    }
                    else {
                        if (!_.isArray(values[element.key])) {
                            var array = [];
                            array.push(values[element.key])
                            array.push(this.fixValue(element.key, element.value))
                            values[element.key] = array;

                        } else {
                            values[element.key].push(this.fixValue(element.key, element.value));
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
            values[this.fixKey(index)] = this.fixValue(this.fixKey(index), value);

        })

        return values;
    }


}