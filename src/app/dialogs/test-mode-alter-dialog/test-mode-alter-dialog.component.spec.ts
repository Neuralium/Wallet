import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestModeAlterDialogComponent } from './test-mode-alter-dialog.component';

describe('TestModeAlterDialogComponent', () => {
  let component: TestModeAlterDialogComponent;
  let fixture: ComponentFixture<TestModeAlterDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestModeAlterDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestModeAlterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
