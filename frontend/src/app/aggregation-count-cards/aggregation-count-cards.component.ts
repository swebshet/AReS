import {Component, Input, OnChanges, OnInit} from '@angular/core';
import { DataService } from '../data.service';
import { first, map } from 'rxjs/operators';
import { variableLabels } from '../appData';
import {BehaviorSubject, Subject} from "rxjs/index";

@Component({
  selector: 'app-aggregation-count-cards',
  templateUrl: './aggregation-count-cards.component.html',
  styleUrls: ['./aggregation-count-cards.component.css']
})
export class AggregationCountCardsComponent implements OnChanges, OnInit {

  @Input() boolQuery: any[];
  @Input() windowWidth: number;

  counts: any = {}
  cards_total: BehaviorSubject<string>;
  cards_n_a_license: BehaviorSubject<string>;
  cards_n_a_license_percentage: BehaviorSubject<string>;
  cards_open_access: BehaviorSubject<string>;
  cards_open_access_percentage: BehaviorSubject<string>;
  cards_limited_access: BehaviorSubject<string>;
  cards_limited_access_percentage: BehaviorSubject<string>;
  cards_authors: BehaviorSubject<string>;
  cards_crps: BehaviorSubject<string>;
  cards_countries: BehaviorSubject<string>;
  cards_mentions: BehaviorSubject<string>;
  cards_readers: BehaviorSubject<string>;

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.cards_total = new BehaviorSubject('0');
    this.cards_n_a_license = new BehaviorSubject('0');
    this.cards_n_a_license_percentage = new BehaviorSubject(' / 0%');
    this.cards_open_access = new BehaviorSubject('0');
    this.cards_open_access_percentage = new BehaviorSubject(' / 0%');
    this.cards_limited_access = new BehaviorSubject('0');
    this.cards_limited_access_percentage = new BehaviorSubject(' / 0%');
    this.cards_authors = new BehaviorSubject('0');
    this.cards_crps = new BehaviorSubject('0');
    this.cards_countries = new BehaviorSubject('0');
    this.cards_mentions = new BehaviorSubject('0');
    this.cards_readers = new BehaviorSubject('0');
  }

  ngOnChanges() {
    this.dataService.search({
      size: 0,
      query: {
        bool: {
          filter: {
            bool: this.boolQuery
          }
        }
      },
      aggs: {
        open_access: {
          filter: {term: {'cg_identifier_status.keyword': 'Open Access'}}
        },
        limited_access: {
          filter: {term: {'cg_identifier_status.keyword': 'Limited Access'}}
        },
        author_count: {
          cardinality: { // Cardinality queries are approximate.
            field: variableLabels.Author,
            precision_threshold: 40000
          }
        },
        crp_count: {
          cardinality: {
            field: variableLabels.CRP,
            precision_threshold: 40000
          }
        },
        country_count: {
          cardinality: {
            field: variableLabels.Countries,
            precision_threshold: 40000
          }
        },
        subject_count: {
          cardinality: {
            field: variableLabels.Subject,
            precision_threshold: 40000
          }
        },
        mentions: {
          sum: {field: 'altmetric.mentions'}
        },
        reads: {
          sum: {field: 'altmetric.readers'}
        }
      }
    })
      .pipe(first(), map(res => ({
        cards_total: res.hits.total,
        cards_n_a_license: res.hits.total - (res.aggregations.open_access.doc_count + res.aggregations.limited_access.doc_count),
        cards_open_access: res.aggregations.open_access.doc_count,
        cards_limited_access: res.aggregations.limited_access.doc_count,
        cards_authors: res.aggregations.author_count.value,
        cards_crps: res.aggregations.crp_count.value,
        cards_countries: res.aggregations.country_count.value,
        cards_mentions: res.aggregations.mentions.value,
        cards_readers: res.aggregations.reads.value
      }))).subscribe(
      (response) => {
        let previous_counts = this.counts;
        for (let key in previous_counts) {
          if (previous_counts.hasOwnProperty(key)) {
            this[key].next(previous_counts[key]);
          }
        }
        this.counts = response
      },
      error => console.error(error),
      () => { // Animate the figures.
        let counts_object = this.counts;
        for (let key in counts_object) {
          if (counts_object.hasOwnProperty(key)) {
            let container = key;

            if (typeof container !== typeof undefined && container != null) {
              let new_value = parseInt(counts_object[key]) + 1;
              let old_value = parseInt(this[key]);
              old_value = isNaN(old_value) ? 0 : old_value;

              let step = (new_value - old_value) * 5 / 100;
              let increasing = step > 0;
              step = Math.abs(step);
              step = parseInt(step.toFixed(0));
              if (step === 0)
                step = step === 0 ? 1 : step;
              step = increasing ? step : -step;

              if (new_value < old_value) {
                this.DecreaseValue(old_value, new_value, step, container);
              } else if (new_value > old_value) {
                this.IncreaseValue(old_value, new_value, step, container);
              }
              if (key === 'cards_open_access') {
                let cards_open_access_percentage = (((counts_object.cards_open_access) / (counts_object.cards_total)) * 100);
                this.cards_open_access_percentage.next(isNaN(cards_open_access_percentage) ? ' / 0%' : (' / ' + cards_open_access_percentage.toFixed(2) + '%'));
              } else if (key === 'cards_limited_access') {
                let cards_limited_access_percentage = (((counts_object.cards_limited_access) / (counts_object.cards_total)) * 100);
                this.cards_limited_access_percentage.next(isNaN(cards_limited_access_percentage) ? ' / 0%' : (' / ' + cards_limited_access_percentage.toFixed(2) + '%'));
              } else if (key === 'cards_n_a_license') {
                let cards_n_a_license_percentage = (((counts_object.cards_n_a_license) / (counts_object.cards_total)) * 100);
                this.cards_n_a_license_percentage.next(isNaN(cards_n_a_license_percentage) ? ' / 0%' : (' / ' + cards_n_a_license_percentage.toFixed(2) + '%'));
              }
            }
          }
        }
      })
  }

  DecreaseValue (old_value, new_value, step, container) {
    setTimeout( () => {
      if (old_value > new_value) {
        old_value = old_value + step;
        this[container].next(old_value.toString());
        this.DecreaseValue(old_value, new_value, step, container);
      } else if ((old_value - step) > new_value) {
        this[container].next((new_value - 1).toString());
      }
    }, 1);
  };

  IncreaseValue (old_value, new_value, step, container) {
    setTimeout( () => {
      if (old_value < new_value) {
        old_value = old_value + step;
        this[container].next(old_value.toString());
        this.IncreaseValue(old_value, new_value, step, container);
      } else if ((old_value - step) < new_value) {
        this[container].next((new_value - 1).toString());
      }
    }, 1);
  }
}
