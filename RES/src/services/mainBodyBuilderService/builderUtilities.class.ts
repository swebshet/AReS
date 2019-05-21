import {
  SortOption,
  GeneralConfigs,
  ComponentCounterConfigs
} from 'src/configs/generalConfig.interface';
import { Subject } from 'rxjs';
import {
  QuerySearchAttribute,
  QueryYearAttribute,
  QueryFilterAttribute,
  QueryBlock
} from 'src/app/filters/services/interfaces';
import { SourceSchema, ListSchema } from 'src/configs/schema';
import { countersConfig } from 'src/configs/counters';

export class BuilderUtilities {
  private querySourceBucketsFilter: QueryBlock[];
  private openLimitedAcc: string[];
  protected aggAttributes:
    | QueryYearAttribute
    | QuerySearchAttribute
    | QueryFilterAttribute;
  protected hitsAttributes: SortOption;
  protected orOperator: Subject<boolean>;
  protected or: boolean;
  protected readonly titleSource: string;

  constructor() {
    this.openLimitedAcc = this.extractOpenLimitedAccessFilter();
    this.querySourceBucketsFilter = this.convertEnumToQueryBlock();
    this.aggAttributes = Object.create(null);
    this.hitsAttributes = Object.create(null) as SortOption;
    this.orOperator = new Subject();
    this.or = false;
    this.titleSource = ListSchema.title || 'dc_title';
  }

  protected addCounterAgg(b: bodybuilder.Bodybuilder): void {
    this.querySourceBucketsFilter.forEach((qb: QueryBlock) =>
      this.addCounterAttrToMainQuery(qb, b)
    );
  }

  protected addSpecificfield(key: string, b: bodybuilder.Bodybuilder): void {
    if (key === 'year.keyword') {
      const years = {
        gte: this.aggAttributes[key].gte,
        lte: this.aggAttributes[key].lte
      };
      // this.or ? b.orQuery('range', key, years) : b.query('range', key, years);
      b.query('range', key, years);
    } else if (key === '_all' || key === this.titleSource) {
      this.or
        ? b.orFilter('match', { [key]: this.aggAttributes[key] })
        : b.filter('match', { [key]: this.aggAttributes[key] });
    } else {
      this.aggAttributes[key].forEach((s: string) =>
        this.or ? b.orFilter('term', key, s) : b.filter('term', key, s)
      );
    }
  }

  private extractOpenLimitedAccessFilter(): string[] {
    return countersConfig
      .filter((cg: GeneralConfigs) => {
        const { filter } = cg.componentConfigs as ComponentCounterConfigs;
        return !!filter;
      })
      .map((cg: GeneralConfigs) => {
        const { filter } = cg.componentConfigs as ComponentCounterConfigs;
        return filter;
      });
  }

  private convertEnumToQueryBlock(): QueryBlock[] {
    const arr: QueryBlock[] = [];
    Object.keys(SourceSchema).map((key: string) =>
      SourceSchema[key] === SourceSchema.status
        ? arr.push(
            {
              source: `${SourceSchema[key]}.keyword`,
              buckets: SourceSchema[key],
              filter: this.openLimitedAcc[0]
            },
            {
              source: `${SourceSchema[key]}.keyword`,
              buckets: SourceSchema[key],
              filter: this.openLimitedAcc[1]
            }
          )
        : arr.push({
            source: `${SourceSchema[key]}.keyword`,
            buckets: SourceSchema[key]
          })
    );
    return arr;
  }

  private addCounterAttrToMainQuery(
    qb: QueryBlock,
    b: bodybuilder.Bodybuilder
  ): void {
    const { filter, source } = qb; // filter comes from this.convertEnumToQueryBlock
    if (!filter) {
      b.aggregation(
        'cardinality',
        {
          field: source,
          precision_threshold: 40000
        },
        source
      );
    } else {
      const obj = Object.create(null);
      obj[source] = filter;
      b.aggregation(
        'filter',
        {
          term: obj
        },
        `${source}_${filter}`
      );
    }
    this.addAggregationsForCharts(b);
  }

  private addAggregationsForCharts(b: bodybuilder.Bodybuilder): void {
    this.querySourceBucketsFilter.forEach((qb: QueryBlock) => {
      const { buckets, source } = qb;
      const size = this.getSize(buckets);
      b.aggregation('terms', this.buildTermRules(size, source), `${buckets}`);
    });
  }

  private getSize(buckets: string): number {
    const { affiliation, author } = SourceSchema;
    return buckets === affiliation || buckets === author
      ? 20
      : this.checkWordcloud(buckets);
  }

  private checkWordcloud(buckets: string): number {
    return buckets === SourceSchema.subject ? 50 : 1000;
  }

  private buildTermRules(size: number, source: string): object {
    return {
      field: source,
      size
    };
  }
}
