import { Component, Input, Output, EventEmitter, AfterViewInit, ViewChild } from '@angular/core';
import * as appData from '../appData'
import * as R from 'ramda';

@Component({
  selector: 'app-publications-bar-chart',
  templateUrl: './publications-bar-chart.component.html',
  styleUrls: ['./publications-bar-chart.component.css']
})
export class PublicationsBarChartComponent implements AfterViewInit {

  private _chartData: { categoryNames: string[], series: any[] }
  /**
   * The data should be sorted based on both X and Y axis values.
  * name: the grouping variable of the data
  * total: the total sum of all values under the group (name)
  * series: a series of bar values to be desplayed for every (name) grouping
  */
  @Input() set chartData(data: { categoryNames: string[], series: any[] }) {
    this._chartData = data
    if (data.categoryNames.length > 0 || data.series.length > 0) {
      this.categoryOptions = data.categoryNames
      this.columnOptions = data.series.map(series => series.name)
      const defaultTypes = ['Journal Article', 'Report', 'Book', 'Book Chapter', 'Dataset']
      if (this.selectedXOption === 'Type' && R.all(type => this.categoryOptions.includes(type), defaultTypes))
        this.selectedCategories = defaultTypes
      else
        this.selectedCategories = R.take(5, this.categoryOptions)
      this.selectedColumns = R.take(5, this.columnOptions)
    }

    if (this.chart) this.updateChartData()

    if (!this._chartData ||
      !this._chartData.categoryNames ||
      !this._chartData.series ||
      this._chartData.categoryNames.length === 0 ||
      this._chartData.series.length === 0)
      this.empty.emit(true)
    else this.empty.emit(false)
  }

  get chartData() {
    return this._chartData
  }

  // Emits the selected (needed) X and Y axis variables
  @Output() dataRequest: EventEmitter<[string, string, { categories: string[], columns: string[] }]> = new EventEmitter()

  @Output() empty = new EventEmitter<boolean>()

  // Highcharts native chart element
  chart: any

  // The selected options' label
  selectedXOption: string = 'Type'
  selectedYOption: string = 'Year'

  // The selected X/Y variable
  variableX: string = 'dc_type.keyword'
  variableY: string = 'year.keyword'

  // rm 2 + others
  availableOptions = R.pick(['Type', 'Year', 'Author', 'CRP', 'Funder'], appData.variableLabels)
  // The available options for X/Y variable
  xOptions: string[] = R.keys(this.availableOptions)
  yOptions: string[] = R.keys(this.availableOptions)

  categoryOptions: string[] = []
  columnOptions: string[] = []
  selectedCategories: string[] = []
  selectedColumns: string[] = []

  ngAfterViewInit() {
    this.requestData()
  }

  requestData() {
    this.dataRequest.emit([this.variableX, this.variableY, {
      categories: this.selectedColumns,
      columns: this.selectedColumns,
    }])
  }

  onXChange(selection) {
    this.variableX = this.availableOptions[selection]
    this.requestData()
  }

  onYChange(selection) {
    this.variableY = this.availableOptions[selection]
    this.requestData()
  }

  onDisplayedSelection() {
    this.updateChartData()
  }

  updateChartData() {
    const filterColumns = R.filter(series => this.selectedColumns.includes(series.name))
    const filterCategories = R.map(series =>
      R.assoc('data', series.data.filter(col => this.selectedCategories.includes(col.name)), series))
    if (this.selectedColumns.length > 0 && this.selectedCategories.length > 0)
      this.chart.update({
        series: R.pipe(filterColumns, filterCategories)(this.chartData.series)
      }, true, true)
    else if (this.selectedColumns.length === 0 && this.selectedCategories.length > 0)
      this.chart.update({ series: filterCategories(this.chartData.series) }, true, true)
    else if (this.selectedCategories.length === 0 && this.selectedColumns.length > 0)
      this.chart.update({ series: filterColumns(this.chartData.series) }, true, true)
    else this.chart.update({ series: this.chartData[0] }, true, true)
  }

  chartOptions = {
    chart: {
      type: 'column'
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
    xAxis: {
      type: 'category',
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Publications'
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
        '<td style="padding:0"><b>{point.y}</b></td></tr>',
      footerFormat: '</table>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        borderRadius: 2.5
      }
    },
    series: []
  }

  // Required to get native chart object
  saveNativeChart(instance) {
    if (typeof this.chart === typeof undefined) {
      this.chart = instance
    }
  }

}
