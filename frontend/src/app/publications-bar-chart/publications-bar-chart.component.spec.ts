import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationsBarChartComponent } from './publications-bar-chart.component';

describe('PublicationsPerYearBarChartComponent', () => {
  let component: PublicationsBarChartComponent;
  let fixture: ComponentFixture<PublicationsBarChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublicationsBarChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicationsBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
