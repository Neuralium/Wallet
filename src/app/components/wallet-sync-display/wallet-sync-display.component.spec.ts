import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletSyncDisplayComponent } from './wallet-sync-display.component';

describe('WalletSyncDisplayComponent', () => {
  let component: WalletSyncDisplayComponent;
  let fixture: ComponentFixture<WalletSyncDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WalletSyncDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletSyncDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
