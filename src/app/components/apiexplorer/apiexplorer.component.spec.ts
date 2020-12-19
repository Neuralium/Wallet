import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SendNeuraliumsComponent } from './send-neuraliums.component';

describe('SendNeuraliumsComponent', () => {
  let component: SendNeuraliumsComponent;
  let fixture: ComponentFixture<SendNeuraliumsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendNeuraliumsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendNeuraliumsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
