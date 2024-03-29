import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { hits } from 'src/app/filters/services/interfaces';
import { PageEvent, MatPaginator } from '@angular/material';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../../../store';
import { MainBodyBuilderService } from 'src/services/mainBodyBuilderService/main-body-builder.service';
import { SortPaginationOptions } from './filter-paginated-list/types.interface';
import { QueryState } from 'src/store/reducers/query.reducer';
import {
  SortOption,
  PaginatedListConfigs
} from 'src/configs/generalConfig.interface';
import { skip } from 'rxjs/operators';

@Component({
  selector: 'app-paginated-list',
  templateUrl: './paginated-list.component.html',
  styleUrls: ['./paginated-list.component.scss']
})
export class PaginatedListComponent implements OnInit {
  @Input() hits: hits[];
  @Input() paginationAtt: PageEvent;
  @Input() loadingHits: boolean;
  @Input() content: PaginatedListConfigs;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  private sortOption: SortOption;
  /**
   * `flag` helps preventing the store action
   * from being fired twice, because when ever
   * the `paginationAtt` changes (by next/prev btns
   * or by changing the filters values) the `chagnePage`
   * method will run and dispatch another action which
   * will send 2 HTTP requests and missup the store loadingHits
   * value
   */
  private flag: boolean;
  constructor(
    private readonly store: Store<fromStore.AppState>,
    private readonly mainBodyBuilderService: MainBodyBuilderService
  ) {
    this.flag = true;
  }

  ngOnInit(): void {
    this.resetPaginationWhenQueryChanges();
  }

  changePage(e: PageEvent): void {
    /**
     * Math.abs(...) means the user went to the next/prev page
     */
    if (this.flag && Math.abs(e.previousPageIndex - e.pageIndex) === 1) {
      this.dispatchAction({
        reset: false,
        pageEvent: e,
        sortOption: this.sortOption
      });
    } else {
      this.flag = true;
    }
  }

  changeFilter(e: SortOption): void {
    this.sortOption = e;
    this.setHitsQuery(e);
    this.dispatchAction({
      reset: true,
      pageEvent: this.paginationAtt,
      sortOption: e
    });
  }

  private dispatchAction(spo: SortPaginationOptions): void {
    this.store.dispatch(
      new fromStore.SetQuery(
        this.mainBodyBuilderService
          .buildMainQuery(spo.reset ? 0 : spo.pageEvent.pageIndex * 10, false)
          .build()
      )
    );
  }

  private setHitsQuery(s: SortOption): void {
    this.mainBodyBuilderService.setHitsAttributes = s;
  }

  /**
   * when `from` is 0 this means the query has been reset.
   * `paginationAtt.pageIndex` means the user just went to
   * the first page, not reset.
   * which ~if true~ means we need to reset the pagination
   */
  private resetPaginationWhenQueryChanges(): void {
    // skipping the first time the query gets set
    this.store
      .select(fromStore.getQueryState)
      .pipe(skip(1))
      .subscribe(
        (b: QueryState) =>
          b.body.from === 0 &&
          this.paginationAtt.pageIndex !== 0 &&
          this.resetPagination()
      );
  }

  private resetPagination(): void {
    this.flag = false;
    this.paginator.firstPage();
  }
}
