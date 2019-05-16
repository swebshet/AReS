import { Injectable } from "@angular/core";
import { fromEvent, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { variableLabels } from './appData'
import { objOf, merge } from 'ramda'

@Injectable({
    providedIn: 'root'
})
export class PresetOptionsService {

    load(file: File): Observable<Object> {
        const fileReader = new FileReader()
        fileReader.readAsText(file)
        return fromEvent(fileReader, 'loadend').pipe(map(event => JSON.parse(event.srcElement['result'])))
    }

    readonly presets = [
        {
            title: "ILRI Yearly List of Publications by Type",
            description: "Standardized export – ILRI Yearly List of Publications by Type",
            filters: merge(objOf(variableLabels.Affiliation, ['International Livestock Research Institute']), objOf(variableLabels.Year, ['2018'])),
            sortBy: variableLabels.Type
        },
        {
            title: "ICARDA Yearly List of Publications by Type",
            description: "Standardized export – ICARDA Yearly List of Publications by Type",
            filters: merge(objOf(variableLabels.Affiliation, ['International Center for Agricultural Research in the Dry Areas']), objOf(variableLabels.Year, ['2018'])),
            sortBy: variableLabels.Type
        },
        {
            title: "ILRI Yearly List of Publications by Subject",
            description: "Standardized export – ILRI Yearly List of Publications by Subject",
            filters: merge(objOf(variableLabels.Affiliation, ['International Livestock Research Institute']), objOf(variableLabels.Year, ['2018'])),
            sortBy: variableLabels.Subject
        },
        {
            title: "ICARDA Yearly List of Publications by Subject",
            description: "Standardized export – ICARDA Yearly List of Publications by Subject",
            filters: merge(objOf(variableLabels.Affiliation, ['International Center for Agricultural Research in the Dry Areas']), objOf(variableLabels.Year, ['2018'])),
            sortBy: variableLabels.Subject
        }
    ]

}