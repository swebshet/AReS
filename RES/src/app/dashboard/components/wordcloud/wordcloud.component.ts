import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import { ChartTypes } from 'src/configs/generalConfig.interface';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';

@Component({
  selector: 'app-wordcloud',
  templateUrl: './wordcloud.component.html',
  styleUrls: ['./wordcloud.component.scss'],
  providers: [ChartMathodsService]
})
export class WordcloudComponent extends ParentChart implements OnInit {
  constructor(cms: ChartMathodsService) {
    super(cms);
  }

  ngOnInit(): void {
    this.init(ChartTypes.wordcloud);
    this.buildOptions.subscribe(() => (this.chartOptions = this.setOptions()));
  }

  private setOptions(): any {
    return {
      chart: {
        type: 'wordcloud',
        animation: true
      },
      plotOptions: {
        wordcloud: {
          tooltip: {
            pointFormat: ' <b>{point.weight}</b>',
            headerFormat: '{point.key}:'
          } as Highcharts.TooltipOptions,
          rotation: 90,
          cursor: 'pointer',
          allowPointSelect: false
        } as Highcharts.PlotWordcloudOptions
      },
      series: this.chartOptions.series,
      ...this.cms.commonProperties()
    };
  }
}
