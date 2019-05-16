import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-publication-sun',
  templateUrl: './publication-sun.component.html',
  styleUrls: ['./publication-sun.component.css']
})
export class PublicationSunComponent implements OnChanges {

  @Input() chartData: any[]
  @Output() dataRequest = new EventEmitter<any>()
  @Output() empty = new EventEmitter<boolean>()

  chart: any

  ngOnChanges() {
    if (this.chart) {
      this.chart.update({
        series: {
          data: this.chartData
        }
      })
      if (this.chartData.length === 0) this.empty.emit(true)
      else this.empty.emit(false)
    }
  }

  chartOptions = {
    title: {
      text: ''
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: true
    },
    series: [{
      type: "sunburst",
      turboThreshold: 1000000,
      data: [],
      allowDrillToNode: true,
      cursor: 'pointer',
      dataLabels: {
        format: '{point.name}',
        filter: {
          property: 'innerArcLength',
          operator: '>',
          value: 16
        }
      },
      levels: [{
        level: 1,
        colorByPoint: true,
        levelIsConstant: false,
        dataLabels: {
          filter: {
            property: 'outerArcLength',
            operator: '>',
            value: 64
          }
        }
      }, {
        level: 2,
        colorVariation: {
          key: 'brightness',
          to: 0.2
        }
      }]

    }],
    tooltip: {
      headerFormat: "",
      pointFormat: '{point.name}</b>: <b>{point.value}</b>'
    }
  }

  // Required to get native chart object
  saveNativeChart(instance) {
    if (typeof this.chart === typeof undefined) {
      this.chart = instance
      this.dataRequest.emit(true)
    }
  }

}
