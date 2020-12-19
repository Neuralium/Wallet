import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashBoardSyncDisplayComponent } from './dash-board-sync-display.component';

describe('DashBoardSyncDisplayComponent', () => {
  let component: DashBoardSyncDisplayComponent;
  let fixture: ComponentFixture<DashBoardSyncDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashBoardSyncDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashBoardSyncDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
