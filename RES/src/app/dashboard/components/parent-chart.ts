import { EventEmitter } from '@angular/core';
import {
  ComponentDashboardConfigs,
  ChartTypes
} from 'src/configs/generalConfig.interface';
import { ChartMathodsService } from './services/chartCommonMethods/chart-mathods.service';
import { Bucket } from 'src/app/filters/services/interfaces';
import { getCountryCode } from './services/countryList.helper';
import { ParentComponent } from 'src/app/parent-component.class';

export class ParentChart extends ParentComponent {
  chartOptions: Highcharts.Options;
  private type: string;
  protected buildOptions: EventEmitter<any>;
  constructor(public readonly cms: ChartMathodsService) {
    super();
    this.buildOptions = new EventEmitter();
    this.chartOptions = {};
  }

  protected init(type: string) {
    this.type = type;
    this.cms.init(type, this.componentConfigs as ComponentDashboardConfigs);
    this.cms.goBuildDataSeries.subscribe((bu: Bucket[]) =>
      this.buildDataSeries(bu).buildOptions.emit(bu)
    );
  }

  /**
   * the default value is just for safe checking,
   * so if there is no buckets, no errors will be
   * logged to the console
   */
  private buildDataSeries(bu: Bucket[] = []): ParentChart {
    const { title } = this.componentConfigs as ComponentDashboardConfigs;
    const series = [
      {
        name: title,
        data: [],
        type: this.type,
        allowPointSelect: true
      }
    ];
    this.expandOrStay(bu.length);
    this.buildSeriesBasedOnType(series, bu);
    return this;
  }

  private buildSeriesBasedOnType(series: any, bu: Bucket[]): void {
    if (this.type === ChartTypes.wordcloud) {
      bu.forEach((b: Bucket) =>
        series[0].data.push({
          name: b.key,
          weight: b.doc_count
        })
      );
    } else if (this.type === ChartTypes.pie) {
      bu.forEach((b: Bucket) =>
        series[0].data.push({
          name: b.key,
          y: b.doc_count
        })
      );
    } else if (this.type === ChartTypes.map) {
      bu.forEach((b: Bucket) =>
        series[0].data.push([getCountryCode(b.key), b.doc_count])
      );
    }
    this.chartOptions.series = series;
  }

  private expandOrStay(length: number): void {
    this.cms.setExpanded = length >= 1;
  }
}
