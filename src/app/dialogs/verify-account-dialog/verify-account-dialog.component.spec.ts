import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWalletProcessDialogComponent } from './create-wallet-process-dialog.component';

describe('CreateWalletProcessDialogComponent', () => {
  let component: CreateWalletProcessDialogComponent;
  let fixture: ComponentFixture<CreateWalletProcessDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateWalletProcessDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWalletProcessDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
