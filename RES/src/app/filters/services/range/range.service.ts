import { Injectable } from '@angular/core';
import {
  ElasticsearchQuery,
  ElasticsearchResponse,
  Bucket,
  QueryYearAttribute,
  BuildQueryObj,
  ResetOptions,
  QuerySearchAttribute,
  QueryFilterAttribute
} from '../interfaces';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { BodyBuilderService } from '../bodyBuilder/body-builder.service';

@Injectable()
export class RangeService {
  private source: string;
  private readonly api_end_point: string = environment.endPoint;
  constructor(
    private readonly http: HttpClient,
    private readonly bodyBuilderService: BodyBuilderService
  ) {}

  set sourceVal(s: string) {
    this.source = s;
  }

  get shouldReset(): Subject<ResetOptions> {
    return this.bodyBuilderService.shouldReset;
  }

  get orOperator(): Subject<boolean> {
    return this.bodyBuilderService.orOperator;
  }

  get getAggAttributes():
    | string
    | QueryYearAttribute
    | QuerySearchAttribute
    | QueryFilterAttribute {
    return this.bodyBuilderService.getAggAttributes;
  }

  resetNotification(): void {
    this.bodyBuilderService.resetOtherComponent('range');
  }

  getYears(query: ElasticsearchQuery): Observable<number[]> {
    return this.http
      .post(this.api_end_point, query)
      .pipe(
        map((d: ElasticsearchResponse) =>
          d.aggregations[this.source].buckets.map((year: Bucket) => +year.key)
        )
      );
  }

  buildquery(bq: BuildQueryObj): bodybuilder.Bodybuilder {
    bq.size = bq.size ? bq.size : 10;
    bq.source = this.source;
    return this.bodyBuilderService.buildquery(bq);
  }

  addAttributeToMainQuery(range: QueryYearAttribute): bodybuilder.Bodybuilder {
    this.bodyBuilderService.setAggAttributes = range;
    return this.bodyBuilderService.buildMainQuery();
  }
}
