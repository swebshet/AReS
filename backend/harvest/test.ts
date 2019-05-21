import * as jsonData from '../config/testData.json'
import * as config from '../config/index.json'
import * as _ from 'underscore';
let schema: any = config.repositories[0].schema
//let json: any = jsonData.data[0]
let finalValues: any = {}

function getArrayOrValue(values: Array<any>) {
    if (values.length > 1)
        return values
    else
        return values[0]
}

_.each(jsonData.data, (json: any) => {
    _.each(schema, (item: any, index: string) => {
        if (json[index]) {
            if (_.isArray(item)) {
                _.each(item, (subItem: any, subIndex: string) => {
                    let values = json[index].
                        filter((d: any) => d[Object.keys(subItem.where)[0]] == subItem.where[Object.keys(subItem.where)[0]])
                        .map((d: any) => subItem.prefix ? subItem.prefix + d[Object.keys(subItem.value)[0]] : d[Object.keys(subItem.value)[0]])
                    if (values.length)
                        finalValues[subItem.value[Object.keys(subItem.value)[0]]] = getArrayOrValue(values)
                })
            }
            else if (_.isObject(item)) {
                if (_.isArray(json[index])) {

                    finalValues[<string>Object.values(item)[0]] = getArrayOrValue(json[index].map((d: any) => d[Object.keys(item)[0]]))

                }
            }
            else
                finalValues[index] = json[index]
        }
    })

    //console.log(finalValues);
})

