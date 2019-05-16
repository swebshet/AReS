import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'underscore';
@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.css']
})
export class AdminPageComponent implements OnInit {
  keys = { base: "", replace: "" }
  keysList = [];
  metaKeysList = [];
  tempKeys = [];
  tempValues = [];
  selectedMetaKey;
  columnsMetavalues = [
    { prop: 'id', name: "#ID" },
    { prop: 'metakey', name: 'MetaData' },
    { prop: 'search', name: 'Search' },
    { prop: 'replace', name: 'Replace With' }

  ]
  columnsMetaKeys = [
    { prop: 'id', name: "#ID" },
    { prop: 'base', name: 'Search' },
    { prop: 'replace', name: 'Replace With' }
  ];
  items;
  valuesList = [];
  metaValues = [];
  selectedMetavalue = { search: undefined, replace: undefined, metakey: undefined }

  @ViewChild(DatatableComponent) table: DatatableComponent;

  constructor(private dataService: DataService) { }
  addKeys() {
    this.dataService.savekeys(this.keys).subscribe(() => {
      this.keys = { base: "", replace: "" };
      setTimeout(() => {
        this.getKeys();
      }, 1000);

    });

  }
  getValues() {
    this.dataService.getValues().subscribe((data: any) => {
      var array = []
      data.forEach(element => {
        element._source['id'] = element._id;
        element._source['metakey'] = element._source.metakey.split('_').join('.').replace('.keyword', '')
        array.push(element._source);

      });
      this.valuesList = array;
      this.tempValues = [...array];
    })

  }
  addValues() {
    this.dataService.saveValues(this.selectedMetavalue).subscribe(() => {
      this.selectedMetavalue.search = undefined;
      this.selectedMetavalue.replace = undefined;
      setTimeout(() => {
        this.getValuesOptions();
        this.getValues();

      }, 2000);

    });
  }
  getKeys() {
    this.dataService.getkeys().subscribe((data: any) => {
      var array = []
      data.forEach(element => {
        element._source['id'] = element._id;
        element._source['search'] = element._source.base;
        array.push(element._source);

      });
      this.keysList = array;

    })


  }

  getValuesOptions() {
    this.dataService.getDefaultData({ size: 10, query: { bool: { filter: {}, must: {} } } }).subscribe((items) => {
      let exclude = ['year', 'repo']
      let keysarray = [];
      this.items = items;
      console.log(this.items);
      _.each(items.aggregations, (element: any, index: string) => {
        let meta_key = index.split('_').join('.').replace('.keyword', '');
        if (exclude.indexOf(meta_key) == -1 && element.buckets.length > 0)
          keysarray.push({ id: index, name: meta_key });
      });
      this.metaKeysList = keysarray;
      if (this.selectedMetavalue.metakey != undefined)
        this.onChangeMetakey(this.selectedMetavalue.metakey);
    })
  }

  onChangeMetakey(metakey) {
    console.log('change', metakey);
    if (metakey != null)
      this.metaValues = this.items.aggregations[metakey].buckets
    else {
      this.metaValues = [];
      this.selectedMetavalue.search = undefined;
      this.selectedMetavalue.replace = undefined;
    }

  }
  ngOnInit() {

    this.getKeys();
    this.getValuesOptions();
    this.getValues();
  }

  updateFilter(event) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const temp = this.tempValues.filter(function (d) {
      return (d.metakey.toLowerCase().indexOf(val) !== -1||d.search.toLowerCase().indexOf(val) !== -1||d.replace.toLowerCase().indexOf(val) !== -1 ) || !val;
    });

    // update the rows
    this.valuesList = temp;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }


}
