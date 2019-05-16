import { Component, TemplateRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { DataService } from '../data.service';
import { Observable, BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { map, flatMap, first, delay, auditTime, tap } from 'rxjs/operators';
import * as  appData from '../appData'
import { Publication, Bucket, PublicationCountry } from '../types/publication';
import * as R from 'ramda';
import { UIBlockingService } from '../ui-blocking.service';
import { ExportsDownloadModalComponent } from '../exports-download-modal/exports-download-modal.component';
import { AdvancedSearchModalComponent } from '../advanced-search-modal/advanced-modal-search.component';
import { PresetOptionsService } from '../preset-options.service';
import { environment } from '../../environments/environment';
import { TourService } from 'ngx-tour-ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  publicationsData: Subject<any>
  publications: BehaviorSubject<Publication[]>
  allPublicationAggregations: Observable<any>
  filteredPublicationAggregations: Observable<any>
  totalPublicationCount: BehaviorSubject<number>

  publicationCountries: Observable<PublicationCountry[]>
  piechartData: Subject<any[]>
  sunChartData: Subject<any[]>
  journalsByLicenseChartData: Subject<any[]>

  searchTerm: string
  // Contains null when search bar is empty.
  matchQuery: BehaviorSubject<any | null>

  globalBoolQuery: BehaviorSubject<{ must?: any[], should?: any[] } | any>
  barChartData: BehaviorSubject<any>
  crpBuckets: Observable<Bucket[]>
  funderBuckets: Observable<Bucket[]>
  authorBuckets: Observable<Bucket[]>
  baseURL = environment.baseURL;
  windowWidth: BehaviorSubject<number>;
  isFiltering: BehaviorSubject<boolean>
  sideFilters: Observable<any[]>
  initSideFilters: Subject<any[]>
  selectedFilters: BehaviorSubject<any[]>
  sortByArray: BehaviorSubject<any[]>
  boolFilterQuery: BehaviorSubject<any>
  filtersBoolOperator: BehaviorSubject<'AND' | 'OR' | string>
  show_welcome_message: boolean
  filtersLoading: boolean = true
  queryDescription: BehaviorSubject<{ sort: string, search: string, filters: any[] }>

  @ViewChild('exportsModal') exportsDownloadModal: ExportsDownloadModalComponent
  @ViewChild('advancedSearchModal') advancedSearchModal: AdvancedSearchModalComponent

  @ViewChild('pieChartPopoverContent') pieChartPopoverContent: TemplateRef<any>;
  @ViewChild('mentionsChartPopoverContent') mentionsChartPopoverContent: TemplateRef<any>;
  @ViewChild('authorsListPopoverContent') authorsListPopoverContent: TemplateRef<any>;
  @ViewChild('journalsByLicensePopoverContent') journalsByLicensePopoverContent: TemplateRef<any>;
  @ViewChild('mapChartPopoverContent') mapChartPopoverContent: TemplateRef<any>;
  @ViewChild('barChartPopoverContent') barChartPopoverContent: TemplateRef<any>;
  @ViewChild('crpTagsPopoverContent') crpTagsPopoverContent: TemplateRef<any>;
  @ViewChild('funderTagsPopoverContent') funderTagsPopoverContent: TemplateRef<any>;
  @ViewChild('publicationsListPopoverContent') publicationsListPopoverContent: TemplateRef<any>;

  constructor(private dataService: DataService,
    private tour: TourService,
    private presetOptionsService: PresetOptionsService,
    private blocker: UIBlockingService,
    private cookieService: CookieService,
    private renderer: Renderer2) { }

  ngOnInit() {
    this.windowWidth = new BehaviorSubject(window.innerWidth);
    let self = this;
    window.onscroll = function (e) {
      if (typeof window['scroll_time_out'] !== typeof undefined) {
        clearTimeout(window['scroll_time_out']);
      }
      window['scroll_time_out'] = setTimeout(function () {
        const window_height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
        const current_scroll = (document.documentElement.scrollTop ? document.documentElement.scrollTop : window.pageYOffset) + 100;
        const nav_buttons = document.getElementsByClassName('nav-buttons');
        if (document.getElementsByClassName('current').length > 0) {
          document.getElementsByClassName('current')[0].classList.remove('current');
        }

        let page_buttom = (window_height + current_scroll + 50) > document.body.offsetHeight;
        let active_nav_button = null;
        for (let i = (nav_buttons.length - 1); i >= 0; --i) {
          if (!nav_buttons[i].classList.contains('inactive')) {
            const container = document.getElementById(nav_buttons[i].getAttribute('data-target'));
            active_nav_button = nav_buttons[i];
            if (container.offsetTop <= current_scroll || page_buttom) {
              active_nav_button.classList.add('current');
              active_nav_button = null;
              break;
            }
          }
        }
        if (active_nav_button !== null) {
          active_nav_button.classList.add('current');
        }
      }, 50);
    };

    window.onresize = function (e) {
      const navbar = document.querySelector('.nav-bar-parent:not(.hidden) .fixed-top-nav-bar:not(.fake-nav-to-make-padding)');
      if (navbar != null) {
        const navbar_height = navbar['offsetHeight'];
        document.querySelector('.navigation .btn-group-vertical')['style'].paddingTop = (navbar_height + 8) + 'px';
        document.querySelector('.btn-group-vertical.tools')['style'].top = (navbar_height - 72) + 'px';
        document.body['style'].paddingTop = (navbar_height) + 'px';
      }
      self.windowWidth.next(window.innerWidth);
    };

    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);

    ['pieChart', 'geoMap', 'publicationsList', 'crpsList', 'fundersList', 'authorsList', 'journalsByLicense']
      .forEach(container => this.blocker.blockById(container))

    this.publicationsData = new Subject()
    this.boolFilterQuery = new BehaviorSubject([])
    this.matchQuery = new BehaviorSubject(undefined)
    this.sortByArray = new BehaviorSubject([{ 'dc_date_issued': { order: 'desc' } }])
    this.filtersBoolOperator = new BehaviorSubject("AND")

    this.globalBoolQuery = new BehaviorSubject({})
    combineLatest(this.boolFilterQuery, this.matchQuery, this.filtersBoolOperator).pipe(auditTime(2000), map(q => {
      const [bool, match] = q
      // Remove search matching if there is no search term
      return R.objOf(this.filtersBoolOperator.getValue() === 'AND' ? 'must' : 'should', match ? R.append(match, bool) : bool)
    })).subscribe(this.globalBoolQuery)

    this.globalBoolQuery.pipe(flatMap(boolQueryObject => this.dataService.getDefaultData({
      query: {
        bool: {
          must: {},
          filter: {
            bool: boolQueryObject
          }
        }
      }
    }))).subscribe(this.publicationsData)

    this.publicationsData.subscribe(
      res => {
        ['pieChart', 'geoMap', 'publicationsList', 'crpsList', 'fundersList', 'authorsList', 'filters']
          .forEach(id => this.blocker.unblockById(id))
        this.filtersLoading = false
      },
      err => console.log('Error while loading data: ', err))

    this.publications = new BehaviorSubject([])
    this.publicationsData.pipe(map(data => data.hits.hits)).subscribe(this.publications)

    this.filteredPublicationAggregations = this.publicationsData.pipe(map(data => data.aggregations))
    this.allPublicationAggregations = this.filteredPublicationAggregations.pipe(first())

    this.totalPublicationCount = new BehaviorSubject(0)
    this.publicationsData.pipe(map(data => data.hits.total)).subscribe(this.totalPublicationCount)

    this.publicationCountries = this.getBuckets('cg_coverage_country.keyword').pipe(delay(100), map(buckets =>
      buckets.map(bucket =>
        ({ name: bucket.key, value: bucket.doc_count, code: appData.getCountryCode(bucket.key) }))))

    this.piechartData = new Subject()

    this.sunChartData = new Subject()
    this.journalsByLicenseChartData = new Subject()

    this.barChartData = new BehaviorSubject({ categoryNames: [], series: [] })

    this.crpBuckets = this.getBuckets(appData.variableLabels.CRP)
    this.funderBuckets = this.getBuckets(appData.variableLabels.Funder)
    this.authorBuckets = this.getBuckets('top_authors')

    this.isFiltering = new BehaviorSubject(false)
    this.sideFilters = this.filteredPublicationAggregations.pipe(delay(200), map(aggs =>
      R.toPairs(appData.variableLabels).map(pair => ({
        label: pair[0],
        variable: pair[1],
        options: aggs[pair[1]].buckets.map(b => b.key)
      }))))
    this.initSideFilters = new Subject()
    this.sideFilters.pipe(first()).subscribe(filters => this.initSideFilters.next(filters))

    this.queryDescription = new BehaviorSubject(null)
    combineLatest(this.sortByArray, this.globalBoolQuery, this.boolFilterQuery, this.filtersBoolOperator).pipe(map(q => {
      const [sortArr, _, filters] = q
      const variableMap = R.invertObj(appData.variableLabels)
      const sortLabel = sortArr[0] ? variableMap[Object.keys(sortArr[0])[0]] : undefined
      const filterLabels = filters.map(filter => {
        const queryOperator = this.filtersBoolOperator.getValue() === 'AND' ? 'must' : 'should'
        if (filter.bool && filter.bool[queryOperator]) return {
          key: variableMap[Object.keys(filter.bool[queryOperator][0].term)[0]],
          value: filter.bool[queryOperator].map(s => Object.values(s.term)[0]).join(', ')
        }
        else if (filter.match_phrase) return { key: 'Title contains', value: filter.match_phrase.dc_title }
        else if (filter.range) {
          const range = filter.range['year.keyword']
          return { key: 'Year range', value: range.gte + ' - ' + range.lte }
        }
        else return {}
      })
      return { sort: sortLabel, search: this.searchTerm, filters: filterLabels }
    })).subscribe(desc => {
      this.queryDescription.next(desc)
    })

    this.tourInitialize();
  }

  getBuckets(agg: string): Observable<Bucket[]> {
    return this.filteredPublicationAggregations.pipe(map(aggs => aggs[agg].buckets))
  }

  getCountBuckets(agg: string): Observable<number> {
    return this.getBuckets(agg).pipe(map(buckets => buckets.length))
  }

  // Sends data to bar chart upon request (by output event)
  onBarChartEvent(xy: [string, string]) {
    this.blocker.blockById('barChart')
    const [x, y] = xy
    const xyAreSpecified = !!x && !!y
    if (xyAreSpecified) {
      this.globalBoolQuery.pipe(delay(200), flatMap(boolObject => this.dataService.search({
        size: 0,
        query: {
          bool: {
            filter: {
              bool: boolObject
            }
          }
        },
        aggs: {
          y: {
            terms: {
              field: y,
              size: 9999999,
              order: { _term: 'desc' }
            },
            aggs: {
              x: {
                terms: {
                  field: x,
                  size: 9999999,
                  order: { _count: 'desc' }
                }
              }
            }
          },
          x_types: {
            terms: {
              field: x,
              size: 9999999,
              order: { _count: 'desc' }
            }
          }
        }
      })),
        map(data => { // Convert the data to highcharts format
          const series = data.aggregations.y.buckets.map(yBucket => ({
            name: yBucket.key,
            value: yBucket.doc_count,
            data: yBucket.x.buckets.map(xBucket => ({ name: xBucket.key, y: xBucket.doc_count }))
          }))
          const categoryNames = R.pluck('key', data.aggregations.x_types.buckets)
          return { series, categoryNames }
        }))
        .subscribe(chartData => {
          this.barChartData.next(<any>chartData)
          this.blocker.unblockById('barChart')
        })
    }
  }

  mapSunburstData(esResponse) {
    let year_buckets = esResponse.aggregations.year.buckets;
    let final_data = [];
    let childs_count = 0;
    for (let year_key = 0; year_key < year_buckets.length; year_key++) {
      let year_bucket = year_buckets[year_key];
      let crp_buckets = year_bucket.crp.buckets;
      if (crp_buckets.length > 0) {
        final_data.push({
          id: '0.' + year_key,
          name: year_bucket.key
        });
        if (crp_buckets.length > 0 && crp_buckets[0]['mentions']) {
          for (let crp_key = 0; crp_key < crp_buckets.length; crp_key++) {
            let crp_bucket = crp_buckets[crp_key];
            final_data.push({
              'id': '1.' + childs_count,
              'parent': '0.' + year_key,
              'name': crp_bucket.key,
              'value': crp_bucket.mentions.value
            });
            childs_count++;
          }
        } else {
          for (let isi = 0; isi < crp_buckets.length; isi++) {
            final_data.push({
              id: '1.' + childs_count,
              parent: '0.' + year_key,
              name: crp_buckets[isi].key,
              value: crp_buckets[isi].doc_count
            })
            childs_count++
          }
        }
      }
    }
    return final_data
  }

  onMentionsByCrpSunEvent() {
    this.blocker.blockById('sunChart')
    this.globalBoolQuery.pipe(flatMap(boolObject => this.dataService.search({
      size: 0,
      query: {
        bool: R.merge(boolObject, {
          must: R.append({
            script: {
              script: {
                source: "doc['altmetric.mentions'].value > 0",
                lang: "painless"
              }
            }
          }, boolObject.must ? boolObject.must : [])
        })
      },
      aggs: {
        year: {
          terms: {
            field: "year.keyword",
            size: 99999
          },
          aggs: {
            crp: {
              terms: {
                field: "cg_contributor_crp.keyword",
                size: 99999
              },
              aggs: {
                mentions: {
                  sum: {
                    field: "altmetric.mentions"
                  }
                }
              }
            }
          }
        }
      }
    })),
      map(res => this.mapSunburstData(res)))
      .subscribe(data => {
        this.sunChartData.next(data)
        this.blocker.unblockById('sunChart')
      })
  }

  onJournalByLicenseSunEvent() {
    this.blocker.blockById('sunChart')
    this.globalBoolQuery.pipe(flatMap(boolObject => this.dataService.search({
      size: 0,
      query: { bool: boolObject },
      aggs: {
        year: {
          terms: {
            field: appData.variableLabels.Status,
            size: 99999
          },
          aggs: {
            crp: {
              terms: {
                field: appData.variableLabels["ISI Status"],
                size: 99999
              }
            }
          }
        }
      }
    })),
      map(res => this.mapSunburstData(res)))
      .subscribe(data => {
        this.journalsByLicenseChartData.next(data)
        this.blocker.unblockById('journalsByLicense')
      })
  }

  // when the filtering sidebar is opened/closed
  onFilterButtonClick() {
    this.isFiltering.next(!this.isFiltering.getValue())
    // To resize charts to container size.
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0)
  }

  onKeyupSearch(event) {
    if (event.key === "Backspace" && this.searchTerm == '')
      this.onSearchButtonClick();
  }

  onKeydownSearch(event) {
    if (event.key === "Enter")
      this.onSearchButtonClick();
  }

  onSearchButtonClick() {
    if (this.searchTerm && this.searchTerm !== '') {
      const blocked = ['pieChart', 'geoMap', 'publicationsList', 'barChart', 'crpsList', 'fundersList', 'authorsList', 'sunChart', 'journalsByLicense']
      blocked.forEach(c => this.blocker.blockById(c))
      this.matchQuery.next({
        match: {
          '_all': {
            query: this.searchTerm,
            fuzziness: "AUTO",
            operator: "and"
          }
        }
      })
      this.sortByArray.next([])
    } else
      this.matchQuery.next(undefined)
  }

  // When new filters are selected in side filters.
  onNewFilters(filterValues) {
    ['pieChart', 'geoMap', 'publicationsList', 'barChart', 'crpsList', 'fundersList', 'authorsList', 'sunChart', 'filters', 'journalsByLicense']
      .forEach(container => this.blocker.blockById(container))
    const boolTerms = filterValues.map(filter => {
      if (filter.variable === 'dc_title')
        return { match: { 'dc_title': filter.values[0] } }
      else if (filter.variable === 'year.keyword')
        return { range: { 'year.keyword': { gte: filter.values[0], lte: filter.values[1] } } }
      else
        return { bool: R.objOf(this.filtersBoolOperator.getValue() === 'AND' ? 'must' : 'should', filter.values.map(val => ({ term: R.objOf(filter.variable, val) }))) }
    })
    this.boolFilterQuery.next(boolTerms)
  }

  // When pie chart variable changes.
  onPieChartRequest(variable) {
    this.getBuckets(variable).pipe(delay(230), map(buckets =>
      buckets.map(b =>
        ({ name: b.key, y: b.doc_count }))))
      .subscribe(this.piechartData)
  }

  // When an "export" button is clicked
  onExport(event) {
    this.exportsDownloadModal.show(event, this.globalBoolQuery.getValue(), this.sortByArray.getValue())
  }

  onNewSortBy(sort) {
    this.sortByArray.next(sort)
  }

  onNewPresetSelect(presetIndex: number) {
    const sortByVariable = this.presetOptionsService.presets[presetIndex].sortBy
    this.sortByArray.next([R.objOf(sortByVariable, { order: 'desc' })])
  }

  onBoolOperatorButtonClick() {
    ['pieChart', 'geoMap', 'publicationsList', 'barChart', 'crpsList', 'fundersList', 'authorsList', 'sunChart', 'filters', 'journalsByLicense']
      .forEach(container => this.blocker.blockById(container))
    if (this.filtersBoolOperator.getValue() === 'AND') this.filtersBoolOperator.next('OR')
    else this.filtersBoolOperator.next('AND')
  }

  scroll(event) {
    if (document.getElementsByClassName('current').length > 0)
      document.getElementsByClassName('current')[0].classList.remove('current');
    let target = event.target;
    if (event.target.nodeName === 'BUTTON') {
      target.classList.add('current');
    } else if (event.target.parentElement.nodeName === 'BUTTON') {
      target = event.target.parentElement;
      target.classList.add('current');
    } else {
      target = event.target.parentElement.parentElement;
      target.classList.add('current');
    }
    const el = document.getElementById(target.getAttribute('data-target'));
    window.scroll({
      top: el.offsetTop,
      left: 0,
      behavior: 'smooth'
    });
  }

  tourInitialize() {
    let tour_started = this.cookieService.get('tour_started') === 'true';
    this.show_welcome_message = !tour_started;
    if (!tour_started) {
      this.tourStart();
    }
  }

  tourStart() {
    this.tour.initialize(<any>[
      {
        title: 'Welcome to AReS',
        anchorId: 'welcome',
        content: '',
        route: 'dashboard',
        placement: 'bottom',
        preventScrolling: true
      }, {
        title: 'Search',
        anchorId: 'search',
        content: 'Need something on the spot? Enter keywords in the quick search, it will provide you with a list of Info Products containing the terms you looked up in their archiving data.',
        route: 'dashboard',
        placement: 'bottom',
        preventScrolling: true
      }, {
        title: 'Filters',
        content: 'Click here to reveal the filters to refine your search',
        anchorId: 'filters',
        route: 'dashboard',
        placement: 'right',
        preventScrolling: true
      }, {
        title: 'Excel Export',
        content: 'Click here to export the list of publication into Excel format.',
        anchorId: 'excel_export',
        route: 'dashboard',
        placement: 'right',
        preventScrolling: true
      }, {
        title: 'Word Export',
        content: 'Click here to export the list of publication into Word format.',
        anchorId: 'word_export',
        route: 'dashboard',
        placement: 'right',
        preventScrolling: true
      }, {
        title: 'PDF Export',
        content: 'Click here to export the list of publication into .pdf format.',
        anchorId: 'pdf_export',
        route: 'dashboard',
        placement: 'right',
        preventScrolling: true
      }, {
        title: 'Reset',
        content: 'Click here to reset the filters e start a new search.',
        anchorId: 'reset',
        route: 'dashboard',
        placement: 'right',
        preventScrolling: true
      }, {
        title: 'Figures',
        content: 'Find here overall information on the Info Products found, such as Access Status, Altmetric info and more.',
        anchorId: 'count_cards',
        route: 'dashboard',
        placement: 'bottom',
        preventScrolling: true
      }, {
        title: 'Info Products by Type',
        template: this.pieChartPopoverContent,
        anchorId: 'pie_chart',
        route: 'dashboard',
        placement: 'right',
        preventScrolling: true
      }, {
        title: 'Altmetric: Mentions by CRP',
        template: this.mentionsChartPopoverContent,
        anchorId: 'sunburst_chart',
        route: 'dashboard',
        placement: 'left',
        preventScrolling: true
      }, {
        title: 'Info Products Overview',
        template: this.mapChartPopoverContent,
        anchorId: 'map_chart',
        route: 'dashboard',
        placement: 'top',
        preventScrolling: true
      }, {
        title: 'Info Products Analytics',
        template: this.barChartPopoverContent,
        anchorId: 'bar_chart',
        route: 'dashboard',
        placement: 'top',
        preventScrolling: true
      }, {
        title: 'Journal Articles Disaggregator',
        template: this.journalsByLicensePopoverContent,
        anchorId: 'journalsByLicense',
        route: 'dashboard',
        placement: 'right',
        preventScrolling: true
      }, {
        title: 'Top authors',
        template: this.authorsListPopoverContent,
        anchorId: 'authorsList',
        route: 'dashboard',
        placement: 'left',
        preventScrolling: true
      }, {
        title: 'CRPs (Tag)',
        template: this.crpTagsPopoverContent,
        anchorId: 'crp_tag',
        route: 'dashboard',
        placement: 'right',
        preventScrolling: true
      }, {
        title: 'Funders (Tag)',
        template: this.funderTagsPopoverContent,
        anchorId: 'funder_tag',
        route: 'dashboard',
        placement: 'left',
        preventScrolling: true
      }, {
        title: 'Info Products List of Results',
        template: this.publicationsListPopoverContent,
        anchorId: 'publications_list',
        route: 'dashboard',
        placement: 'top',
        preventScrolling: true
      }
    ]);

    this.tour.start$.subscribe(() => {
      this.renderer.addClass(document.body, 'tour-active');
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    });

    this.tour.stepShow$.subscribe(() => {
      const tour_popover = document.getElementsByTagName('ngb-popover-window')[0];
      window.scroll({
        top: tour_popover['offsetTop'] - 300,
        left: 0,
        behavior: 'smooth'
      });
    });

    this.tour.end$.subscribe(() => {
      this.cookieService.set('tour_started', 'true', 365);
      this.renderer.removeClass(document.body, 'tour-active');
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    });
    this.tour.start();
    this.show_welcome_message = true;
  }

}
