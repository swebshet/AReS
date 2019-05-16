import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { PublicationCountry } from '../types/publication';
import * as appData from '../appData';

@Component({
  selector: 'app-publications-map',
  templateUrl: './publications-map.component.html',
  styleUrls: ['./publications-map.component.css']
})
export class PublicationsMapComponent implements OnChanges {

  @Input() countryData: PublicationCountry[];
  chart: any

  @Output() empty = new EventEmitter<boolean>()

  ngOnChanges() {
    if (!this.countryData || this.countryData.length === 0) this.empty.emit(true)
    else this.empty.emit(false)
    if (this.chart)
      this.chart.update({
        series: {
          data: this.countryData
        }
      }, true, true)
  }

  chartOptions = {
    chart: {
      margin: 2,
    },
    title: {
      text: ''
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: true
    },
    colorAxis: {
      min: 1,
      type: 'logarithmic',
      minColor: '#acf992',
      maxColor: '#427730',
      stops: [
        [0, '#acf992'],
        [0.67, '#5c7753'],
        [1, '#427730']
      ]
    },
    mapNavigation: {
      enabled: true,
      buttonOptions: {
        verticalAlign: 'bottom'
      }
    },
    tooltip: {
      pointFormat: '{point.name}: <b>{point.value} Publications</b><br/>',
    },
    series: [{
      animation: true,
      data: [],
      mapData: appData.geoMapData,
      joinBy: ['iso-a2', 'code'],
      name: 'Publications',
      allowPointSelect: true,
      states: {
        hover: {
          color: '#427730'
        },
        select: {
          color: '#427730',
          borderColor: 'black',
          dashStyle: 'shortdot'
        }
      }
    }]
  }

  // Required to get native chart object
  saveNativeInstance(instance) {
    if (typeof this.chart === typeof undefined) {
      this.chart = instance
    }
  }

}
