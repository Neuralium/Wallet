import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NeuraliumsTotalComponent } from './neuraliums-total.component';

describe('NeuraliumsTotalComponent', () => {
  let component: NeuraliumsTotalComponent;
  let fixture: ComponentFixture<NeuraliumsTotalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NeuraliumsTotalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NeuraliumsTotalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
