// this file has all code related to the Info Products by Type #50
import { Component, OnInit, Input, AfterViewInit, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'app-publication-types-piechart',
  templateUrl: './publication-types-piechart.component.html',
  styleUrls: ['./publication-types-piechart.component.css']
})
export class PublicationTypesPiechartComponent implements OnChanges {

  @Input() showLegend = false;
  @Input() set chartData(data: any[]) {
    this._chartData = data
    if (data) {
      this.chart.update({
        series: [{
          name: 'Type Values',
          colorByPoint: true,
          animation: true,
          data
        }]
      }, true, true);
    }
  }

  @Output() requestVariable = new EventEmitter<string>();
  @Output() empty = new EventEmitter<boolean>()

  chart: any;
  _chartData: any[]
  selectedVariable: string = 'types_sorted_by_count'

  chartOptions = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: true
    },
    title: {
      text: ''
    },
    tooltip: {
      formatter: function () {
        return this.key + ': <b>' + this.y + '</b>';
      }
    },
    plotOptions: {
      pie: {
        colors: this.getRandomColor(),
        cursor: 'pointer',
        dataLabels: {
          enabled: false,
        },
        showInLegend: true
      }
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'top',
      y: 15,
      navigation: {
        activeColor: '#3E576F',
        animation: true,
        arrowSize: 12,
        inactiveColor: '#CCC',
        style: {
          fontWeight: 'bold',
          color: '#333',
          fontSize: '12px'
        }
      }
    },
    series: []
  };

  // saves the chart native element for future native method access
  saveNativeInstance(instance) {
    if (typeof this.chart === typeof undefined) {
      this.chart = instance;
      this.requestVariable.emit(this.selectedVariable);
    }
  }

  ngOnChanges() {
    if (this.chart) {
      if (this.showLegend === true) {
        this.chart.update({
          plotOptions: {
            pie: {
              cursor: 'pointer',
              dataLabels: {
                enabled: false,
              },
              showInLegend: true
            }
          },
          legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            y: 15,
            navigation: {
              activeColor: '#3E576F',
              animation: true,
              arrowSize: 12,
              inactiveColor: '#CCC',
              style: {
                fontWeight: 'bold',
                color: '#333',
                fontSize: '12px'
              }
            }
          }
        }, true, true);
      } else {
        this.chart.update({
          plotOptions: {
            pie: {
              cursor: 'pointer',
              dataLabels: {
                enabled: false,
              },
              showInLegend: false
            }
          }
        }, true, true);
      }
      if (!this._chartData || this._chartData.length === 0) this.empty.emit(true)
      else this.empty.emit(false)
    }
  }

  getRandomColor() {
    return ['#427730', '#009673', '#0065bd', '#e1d219', '#762022', '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
      '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
      '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
      '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
      '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
      '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
      '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
      '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
      '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
      '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
  }

}
