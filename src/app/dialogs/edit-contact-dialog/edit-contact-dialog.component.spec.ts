import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditContactDialogComponent } from './edit-contact-dialog.component';

describe('EditContactDialogComponent', () => {
  let component: EditContactDialogComponent;
  let fixture: ComponentFixture<EditContactDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditContactDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditContactDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
