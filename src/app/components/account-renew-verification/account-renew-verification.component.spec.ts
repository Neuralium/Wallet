import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountPublicationStatusComponent } from './account-publication-status.component';

describe('AccountPublicationStatusComponent', () => {
  let component: AccountPublicationStatusComponent;
  let fixture: ComponentFixture<AccountPublicationStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccountPublicationStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountPublicationStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
