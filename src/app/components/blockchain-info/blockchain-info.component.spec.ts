import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockchainInfoComponent } from './blockchain-info.component';

describe('BlockchainInfoComponent', () => {
  let component: BlockchainInfoComponent;
  let fixture: ComponentFixture<BlockchainInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BlockchainInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockchainInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
