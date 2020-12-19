import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AskOrCreateWalletDialogComponent } from './ask-or-create-wallet-dialog.component';

describe('AskOrCreateWalletDialogComponent', () => {
  let component: AskOrCreateWalletDialogComponent;
  let fixture: ComponentFixture<AskOrCreateWalletDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AskOrCreateWalletDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AskOrCreateWalletDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
