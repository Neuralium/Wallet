import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionDetailsDialogComponent } from './transaction-details-dialog.component';

describe('TransactionDetailsDialogComponent', () => {
  let component: TransactionDetailsDialogComponent;
  let fixture: ComponentFixture<TransactionDetailsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransactionDetailsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
