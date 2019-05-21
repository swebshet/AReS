import { Component, OnInit } from '@angular/core';
import { ChartTypes } from 'src/configs/generalConfig.interface';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import * as Highcharts from 'highcharts';
import { ParentChart } from '../parent-chart';

@Component({
  selector: 'app-pie',
  templateUrl: './pie.component.html',
  styleUrls: ['./pie.component.scss'],
  providers: [ChartMathodsService]
})
export class PieComponent extends ParentChart implements OnInit {
  constructor(cms: ChartMathodsService) {
    super(cms);
  }

  ngOnInit(): void {
    this.init(ChartTypes.pie);
    this.buildOptions.subscribe(() => (this.chartOptions = this.setOptions()));
  }

  private setOptions(): Highcharts.Options {
    return {
      chart: {
        type: ChartTypes.pie,
        animation: true
      },
      plotOptions: {
        pie: {
          cursor: 'pointer',
          showInLegend: true,
          tooltip: {
            pointFormat: ' <b>{point.y}</b>',
            headerFormat: '{point.key}:'
          },
          dataLabels: {
            enabled: false
          }
        }
      },
      series: this.chartOptions.series,
      ...this.cms.commonProperties()
    };
  }
}
