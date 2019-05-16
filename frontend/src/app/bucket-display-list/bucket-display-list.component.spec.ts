import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BucketDisplayListComponent } from './bucket-display-list.component';

describe('BucketDisplayListComponent', () => {
  let component: BucketDisplayListComponent;
  let fixture: ComponentFixture<BucketDisplayListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BucketDisplayListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BucketDisplayListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
