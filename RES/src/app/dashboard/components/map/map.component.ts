import { Component, OnInit } from '@angular/core';
import { ChartTypes } from 'src/configs/generalConfig.interface';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
const mapWorld = require('@highcharts/map-collection/custom/world-robinson-highres.geo.json');
import * as Highcharts from 'highcharts';
import { axisColorForMap, selectMapColors } from 'src/configs/chartColors';
import { ParentChart } from '../parent-chart';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [ChartMathodsService]
})
export class MapComponent extends ParentChart implements OnInit {
  constructor(cms: ChartMathodsService) {
    super(cms);
  }

  ngOnInit(): void {
    this.init(ChartTypes.map);
    this.buildOptions.subscribe(() => (this.chartOptions = this.setOptions()));
  }

  private setOptions(): Highcharts.Options {
    const { data } = this.chartOptions.series[0] as Highcharts.SeriesMapOptions;
    return {
      chart: {
        map: mapWorld,
        animation: true
      },
      mapNavigation: {
        enabled: true,
        enableMouseWheelZoom: true,
        buttonOptions: {
          alignTo: 'spacingBox',
          verticalAlign: 'bottom'
        }
      },
      colorAxis: {
        min: 1,
        type: 'logarithmic',
        minColor: axisColorForMap.minColor,
        maxColor: axisColorForMap.maxColor,
        stops: [
          [0, axisColorForMap.minColor],
          [0.67, axisColorForMap.midColor],
          [1, axisColorForMap.maxColor]
        ]
      },
      series: [
        {
          data,
          mapData: mapWorld,
          showInLegend: true,
          showInNavigator: true,
          cursor: 'pointer',
          enableMouseTracking: true,
          allowPointSelect: true,
          tooltip: {
            pointFormat: '{point.name}: <b>{point.value} Publications</b><br/>'
          },
          animation: {
            duration: 1000
          },
          states: {
            hover: {
              color: selectMapColors.hover
            },
            select: {
              color: selectMapColors.select.color,
              borderColor: selectMapColors.select.borderColor
            }
          }
        }
      ],
      ...this.cms.commonProperties()
    } as Highcharts.Options;
  }
}
