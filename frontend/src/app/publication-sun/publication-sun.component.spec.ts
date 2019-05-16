import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationSunComponent } from './publication-types-sun.component';

describe('PublicationSunComponent', () => {
  let component: PublicationSunComponent;
  let fixture: ComponentFixture<PublicationSunComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublicationSunComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicationSunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
