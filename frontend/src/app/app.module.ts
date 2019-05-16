import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'angular2-highcharts';
import { HighchartsStatic } from 'angular2-highcharts/dist/HighchartsService';
import { NouisliderModule } from 'ng2-nouislider';
import { AngularFontAwesomeModule } from 'angular-font-awesome';

import { SideFiltersComponent } from './side-filters/side-filters.component';
import { PublicationTypesPiechartComponent } from './publication-types-piechart/publication-types-piechart.component';
import { AggregationCountCardsComponent } from './aggregation-count-cards/aggregation-count-cards.component';
import { PublicationsMapComponent } from './publications-map/publications-map.component';
import { PublicationsListComponent } from './publications-list/publications-list.component';
import { BucketDisplayListComponent } from './bucket-display-list/bucket-display-list.component';
import { PublicationsBarChartComponent } from './publications-bar-chart/publications-bar-chart.component';
import { Routes, RouterModule } from '@angular/router'
import { AdminPageComponent } from './admin-page/admin-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PublicationSunComponent } from './publication-sun/publication-sun.component'
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ExportsDownloadModalComponent } from './exports-download-modal/exports-download-modal.component';
import { AdvancedSearchModalComponent } from './advanced-search-modal/advanced-modal-search.component';
import { CardContainerComponent } from './card-container/card-container.component';
import { TourNgBootstrapModule } from 'ngx-tour-ng-bootstrap'
import { CookieService } from 'ngx-cookie-service';

export declare let require: any

export function highchartsFactory() {
  const hc = require('highcharts')
  const map = require('highcharts/modules/map')
  const sunburst = require('highcharts/modules/sunburst')
  const pie = require('highcharts/modules/variable-pie')
  const exporting = require('highcharts/modules/exporting')
  const offline_exporting = require('highcharts/modules/offline-exporting')
  pie(hc)
  map(hc)
  sunburst(hc)
  exporting(hc)
  offline_exporting(hc)
  return hc
}

const routes: Routes = [
  { path: 'admin', component: AdminPageComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', component: DashboardComponent }
]

@NgModule({
  declarations: [
    AppComponent,
    SideFiltersComponent,
    PublicationTypesPiechartComponent,
    PublicationSunComponent,
    AggregationCountCardsComponent,
    PublicationsMapComponent,
    PublicationsBarChartComponent,
    PublicationsListComponent,
    BucketDisplayListComponent,
    AdminPageComponent,
    DashboardComponent,
    ExportsDownloadModalComponent,
    AdvancedSearchModalComponent,
    CardContainerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    NgSelectModule,
    ChartModule,//.forRoot(require('highcharts'), require('highcharts/modules/map')),
    HttpClientModule,
    AngularFontAwesomeModule,
    NouisliderModule,
    NgbModule.forRoot(),
    RouterModule.forRoot(routes),
    NgxDatatableModule,
    TourNgBootstrapModule.forRoot()
  ],
  providers: [
    {
      provide: HighchartsStatic,
      useFactory: highchartsFactory
    },
    HttpClient,
    CookieService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
