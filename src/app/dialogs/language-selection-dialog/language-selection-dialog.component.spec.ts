import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSelectionDialogComponent } from './language-selection-dialog.component';

describe('LanguageSelectionDialogComponent', () => {
  let component: LanguageSelectionDialogComponent;
  let fixture: ComponentFixture<LanguageSelectionDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LanguageSelectionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguageSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
