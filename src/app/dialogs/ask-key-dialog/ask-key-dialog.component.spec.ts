import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AskKeyDialogComponent } from './ask-key-dialog.component';

describe('AskKeyDialogComponent', () => {
  let component: AskKeyDialogComponent;
  let fixture: ComponentFixture<AskKeyDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AskKeyDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AskKeyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
