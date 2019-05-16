import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AggregationCountCardsComponent } from './aggregation-count-cards.component';

describe('AggregationCountCardsComponent', () => {
  let component: AggregationCountCardsComponent;
  let fixture: ComponentFixture<AggregationCountCardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AggregationCountCardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AggregationCountCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
