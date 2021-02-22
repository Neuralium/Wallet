import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSettingsEditor } from './app-settings-editor.component';

describe('AppSettingsEditor', () => {
  let component: AppSettingsEditor;
  let fixture: ComponentFixture<AppSettingsEditor>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppSettingsEditor ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSettingsEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
