import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestModeMessageComponent } from './test-mode-message.component';

describe('TestModeMessageComponent', () => {
  let component: TestModeMessageComponent;
  let fixture: ComponentFixture<TestModeMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestModeMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestModeMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
