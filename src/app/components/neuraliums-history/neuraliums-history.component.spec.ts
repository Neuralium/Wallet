import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NeuraliumsHistoryComponent } from './neuraliums-history.component';

describe('NeuraliumsHistoryComponent', () => {
  let component: NeuraliumsHistoryComponent;
  let fixture: ComponentFixture<NeuraliumsHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NeuraliumsHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NeuraliumsHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
