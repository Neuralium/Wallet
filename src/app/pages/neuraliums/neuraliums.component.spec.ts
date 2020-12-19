import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NeuraliumsComponent } from './neuraliums.component';

describe('NeuraliumsComponent', () => {
  let component: NeuraliumsComponent;
  let fixture: ComponentFixture<NeuraliumsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NeuraliumsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NeuraliumsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
