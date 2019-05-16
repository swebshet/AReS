import { Component, Input, OnChanges, ViewChild, Output, EventEmitter } from '@angular/core';
import { Publication } from '../types/publication';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../data.service';
import { objOf, equals, invertObj } from 'ramda'
import { variableLabels } from '../appData';
import { UIBlockingService } from '../ui-blocking.service';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-publications-list',
  templateUrl: './publications-list.component.html',
  styleUrls: ['./publications-list.component.css']
})
export class PublicationsListComponent implements OnChanges {
  baseURL = environment.baseURL;
  @Input() publicationsCount: number
  @Input() query: any
  @Input() set externalSortBy(sort: any[]) {
    if (sort) {
      this.sortQueryArray = sort
      this.sortBy = Object.keys(sort[0] || {})[0]
      this.selectedSortBy = invertObj(this.sortOptions)[this.sortBy]
    }
  }

  @Output() newSortBy: EventEmitter<{ sort: any }> = new EventEmitter()
  @Output() empty = new EventEmitter<boolean>()

  constructor(private dataService: DataService, private blocker: UIBlockingService) { }

  shownPublications: BehaviorSubject<Publication[]> = new BehaviorSubject([])
  pageSize: number = 10
  currentPage: number = 1

  selectedSortBy: string
  sortBy: string
  descendingOrder = true
  sortQueryArray: any[] = []

  readonly sortOptions = {
    Date: 'dc_date_issued',
    Type: variableLabels.Type,
    Subject: variableLabels.Subject,
    'Altmetric: Mentions': 'altmetric.mentions',
    'Altmetric: Readers': 'altmetric.readers',
    Citation: 'dc_identifier_citation.keyword',
    'Altmetric Attention Score': 'altmetric.score',
    'Repository usage': 'statelets.score'
  }

  sortSelectionOptions = Object.keys(this.sortOptions)

  refreshTimeout: any

  ngOnChanges() {
    this.refreshPublications()
    if (this.publicationsCount === 0) this.empty.emit(true)
    else this.empty.emit(false)
  }

  refreshPublications() {
    this.blocker.unblockById('publicationsList')
    this.blocker.blockById('publicationsList')
    clearTimeout(this.refreshTimeout)
    this.refreshTimeout = setTimeout(() => this.dataService.search({
      from: this.pageSize * this.currentPage - this.pageSize,
      sort: this.sortQueryArray ? this.sortQueryArray : [],
      size: this.pageSize,
      _source: [
        'bitstreams',
        'handle',
        'mel_file_thumbnail',
        'dc_identifier_uri',
        'dc_title',
        'dc_identifier_citation',
        'dc_publisher',
        'dc_subject',
        'dc_type',
        'cg_identifier_status',
        'dc_date_issued',
        'cg_contributor_crp',
        'altmetric',
        'repo',
      ],
      query: {
        bool: this.query
      }
    })
      .subscribe(data => {
        this.blocker.unblockById('publicationsList')
        if (data.hits)
          this.shownPublications.next(data.hits.hits)
      }), 100)
  }

  setSortQueryArray(variable: string, order: 'desc' | 'asc') {
    this.sortQueryArray = this.sortBy && this.selectedSortBy ? [objOf(variable, { order, mode: 'max' })] : []
  }

  onSortSelect(selection) {
    this.sortBy = this.sortOptions[selection]
    this.setSortQueryArray(this.sortBy, this.descendingOrder ? 'desc' : 'asc')
    this.newSortBy.emit(this.sortQueryArray)
    this.refreshPublications()
  }

  onOrderButtonClick(event) {
    let target = event.target;
    if (event.target.nodeName === 'BUTTON') {
      target = event.target;
    } else if (event.target.parentElement.nodeName === 'BUTTON') {
      target = event.target.parentElement;
    } else {
      target = event.target.parentElement.parentElement;
    }
    if (this.descendingOrder) {
      target.innerHTML = '<i class="fa fa-arrow-down"></i>';
      this.descendingOrder = false;
    } else {
      target.innerHTML = '<i class="fa fa-arrow-up"></i>';
      this.descendingOrder = true;
    }
    this.setSortQueryArray(this.sortBy, this.descendingOrder ? 'desc' : 'asc')
    this.refreshPublications();
  }

}
