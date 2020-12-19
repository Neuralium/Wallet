import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SoftwareLicenseAgreementComponent } from './software-license-agreement-dialog.component';

describe('SoftwareLicenseAgreementComponent', () => {
  let component: SoftwareLicenseAgreementComponent;
  let fixture: ComponentFixture<SoftwareLicenseAgreementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SoftwareLicenseAgreementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SoftwareLicenseAgreementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
