import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SideFiltersComponent } from './side-filters.component';

describe('SideFiltersComponent', () => {
  let component: SideFiltersComponent;
  let fixture: ComponentFixture<SideFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SideFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
