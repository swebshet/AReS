import { Injectable } from '@angular/core';
import { ViewState } from 'src/store/reducers/items.reducer';
import { InView } from 'src/store/actions/actions.interfaces';
import { GeneralConfigs } from 'src/configs/generalConfig.interface';
import { countersConfig } from 'src/configs/counters';
import { dashboardConfig } from 'src/configs/dashboard';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../../../store';

@Injectable()
export class ScrollHelperService {
  private viewState: ViewState;
  private expanded: boolean;
  private store: Store<fromStore.ItemsState>;
  dataIsReadyArrived: Subject<void>;
  loading: boolean;

  set storeVal(s: Store<fromStore.ItemsState>) {
    this.store = s;
  }

  set expandedVal(b: boolean) {
    this.expanded = b;
  }

  get expandedStatus(): boolean {
    return this.expanded;
  }

  get getViewState(): ViewState {
    return this.viewState;
  }

  get getLoading(): boolean {
    return this.loading;
  }

  constructor() {
    this.expanded = true;
    this.dataIsReadyArrived = new Subject();
  }

  changeViewState(id: string, collapsed: boolean): InView {
    this.changeCollapsed(collapsed);
    return {
      id,
      viewState: this.viewState
    };
  }

  getScrollToCompConf(): GeneralConfigs[] {
    return [countersConfig[0], ...dashboardConfig];
  }

  /**
   * countersConfig[0] is where we get the id of
   * the counters components
   */
  getNotSiblings(): GeneralConfigs[] {
    return [
      countersConfig[0],
      ...dashboardConfig.filter(
        (gc: GeneralConfigs) => gc.scroll.icon && gc.show
      )
    ];
  }

  seeIfThisCompInView(id: string): void {
    this.store
      .select(fromStore.getInViewById, id)
      .subscribe((viewState: ViewState) => {
        if (viewState.userSeesMe) {
          this.subToLoaders();
          this.viewState = viewState;
        }
      });
  }

  subToLoaders(): void {
    if (this.loading !== undefined) {
      // sub only one time
      return;
    }
    this.store.select(fromStore.getLoadingStatus).subscribe((b: boolean) => {
      this.loading = b;
      if (!b) {
        this.dataIsReadyArrived.next();
      }
    });
    return;
  }

  disPatchSetInView(id: string, collapsed: boolean): void {
    this.store.dispatch(
      new fromStore.SetInView(this.changeViewState(id, collapsed))
    );
  }

  private changeCollapsed(collapsed: boolean): void {
    this.viewState.collapsed = collapsed;
  }
}

export type componentIdWitSate = [string, ViewState];
