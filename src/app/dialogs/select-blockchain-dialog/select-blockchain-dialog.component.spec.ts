import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectBlockchainDialogComponent } from './select-blockchain-dialog.component';

describe('SelectBlockchainDialogComponent', () => {
  let component: SelectBlockchainDialogComponent;
  let fixture: ComponentFixture<SelectBlockchainDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectBlockchainDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectBlockchainDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
