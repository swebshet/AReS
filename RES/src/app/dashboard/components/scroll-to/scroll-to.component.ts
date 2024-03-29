import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../../store';
import { InView } from 'src/store/actions/actions.interfaces';
import {
  GeneralConfigs,
  ComponentDashboardConfigs
} from 'src/configs/generalConfig.interface';
import { InViewState } from 'src/store/reducers/items.reducer';
import {
  ScrollHelperService,
  componentIdWitSate
} from '../services/scrollTo/scroll-helper.service';

@Component({
  selector: 'app-scroll-to',
  templateUrl: './scroll-to.component.html',
  styleUrls: ['./scroll-to.component.scss'],
  providers: [ScrollHelperService]
})
export class ScrollToComponent implements OnInit {
  dashboardConfig: GeneralConfigs[];
  btnStatus: Map<string, boolean>;
  id: string;
  private linking: Map<string, string[]>;
  private idsToHide: Set<string>;

  constructor(
    private readonly store: Store<fromStore.AppState>,
    private readonly scrollHelperService: ScrollHelperService
  ) {
    this.dashboardConfig = this.scrollHelperService.getNotSiblings();
    this.idsToHide = new Set();
    this.linking = new Map(); // <'pie' => ['pie', 'chart2', ...]>
    this.btnStatus = new Map(); // <'pie' => show me or hide me>
  }

  ngOnInit(): void {
    this.store
      .select(fromStore.getInViewFirstOne)
      .subscribe((inView: InView) =>
        inView.id ? (this.id = inView.id) : undefined
      );
    this.getViewState();
    this.buildLinkedComponentMap();
  }

  checkLinking(id: string, s: string[]): void {
    let show: boolean;
    const idsToHide = Array.from(this.idsToHide);
    for (let i = 0; i < s.length; i++) {
      if (idsToHide.includes(s[i])) {
        show = false;
      } else {
        show = true;
        break;
      }
    }
    if (this.btnStatus.get(id) !== show) {
      // ! because of `ExpressionChangedAfterItHasBeenCheckedError`
      Promise.resolve(null).then(() => this.btnStatus.set(id, show));
    }
  }

  private getViewState(): void {
    this.store.select(fromStore.getInView).subscribe((ivs: InViewState) => {
      const idWithState: Array<componentIdWitSate> = Object.entries(ivs);
      this.filterScrollToButtons(idWithState);
    });
  }

  private filterScrollToButtons(
    arrcomponentIdWitSate: Array<componentIdWitSate>
  ): void {
    arrcomponentIdWitSate.forEach((ciws: componentIdWitSate) => {
      const [id, inView] = ciws;
      if (inView.collapsed) {
        this.idsToHide.add(id);
      } else {
        this.idsToHide.delete(id);
      }

      if (inView.linkedWith) {
        this.checkLinkingInit(id, inView.linkedWith);
      }
    });
  }

  private checkLinkingInit(id: string, linkedWith: string): void {
    if (this.linking.has(id)) {
      this.checkLinking(id, this.linking.get(id));
    } else {
      this.checkLinking(linkedWith, this.linking.get(linkedWith));
    }
  }

  private buildLinkedComponentMap(): void {
    this.scrollHelperService
      .getScrollToCompConf()
      .forEach(
        ({ scroll: { linkedWith }, componentConfigs }: GeneralConfigs) => {
          const { id } = componentConfigs as ComponentDashboardConfigs;
          if (!linkedWith) {
            this.linking.set(id, [id]);
            this.btnStatus.set(id, true);
          } else {
            this.linking.set(linkedWith, [
              ...(this.linking.get(linkedWith) || []),
              id
            ]);
          }
        }
      );
  }
}
