import { Component, OnInit } from '@angular/core';
import { ChartTypes } from 'src/configs/generalConfig.interface';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import * as Highcharts from 'highcharts';
import { ParentChart } from '../parent-chart';

@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  providers: [ChartMathodsService]
})
export class LineComponent extends ParentChart implements OnInit {
  constructor(cms: ChartMathodsService) {
    super(cms);
  }

  ngOnInit(): void {
    this.init(ChartTypes.line);
    this.buildOptions.subscribe((data) => (console.log(data)));
  }

  private setOptions(): any {
    return {
      chart: {
        type: ChartTypes.line,
        animation: true
      },
      xAxis: {
        categories: ['2010', '2011', '2012', '2013', '2014', '2015',
          '2016', '2017', '2018', '2019', '2020', '2021']
      },
      yAxis: {
        title: {
          text: 'Items'
        },
        labels: {
          formatter: function () {
            return this.value;
          }
        }
      },
      plotOptions: {
        line: {
          marker: {
            radius: .1,
            lineColor: '#666666',
            lineWidth: 1
          }
        }
      },
      tooltip: {
        crosshairs: true,
        shared: true
      },
      series: [{
        name: 'All Items',
        data: [43934, 52503, 57177, 69658, 97031, 119931, 137133, 154175, 52503]
      }, {
        name: 'Open Access',
        data: [24916, 24064, 29742, 29851, 32490, 30282, 38121, 40434, 29742]
      }, {
        name: 'Limited Access',
        data: [11744, 17722, 16005, 19771, 20185, 24377, 32147, 39387, 89387]
      }]
    };
  }
}
