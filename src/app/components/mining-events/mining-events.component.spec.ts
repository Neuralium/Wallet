import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiningEventsComponent } from './mining-events.component';

describe('MiningEventsComponent', () => {
  let component: MiningEventsComponent;
  let fixture: ComponentFixture<MiningEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MiningEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MiningEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
