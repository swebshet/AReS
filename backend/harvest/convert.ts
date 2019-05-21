import * as values from '../config/values.json'
let json: any = {}
values.values.forEach(element => {
    json[element.search] = element.replace
});


var fs = require('fs');
fs.writeFile('./myjsonfile.json', JSON.stringify(json), 'utf8', () => {
    console.log("done")
});