import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationTypesPiechartComponent } from './publication-types-piechart.component';

describe('PublicationTypesPiechartComponent', () => {
  let component: PublicationTypesPiechartComponent;
  let fixture: ComponentFixture<PublicationTypesPiechartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublicationTypesPiechartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicationTypesPiechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
