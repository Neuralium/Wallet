import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublishAccountDialogComponent } from './publish-account-dialog.component';

describe('PublishAccountDialogComponent', () => {
  let component: PublishAccountDialogComponent;
  let fixture: ComponentFixture<PublishAccountDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublishAccountDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublishAccountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
