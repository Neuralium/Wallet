import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerConnectionTestComponent } from './server-connection-test.component';

describe('ServerConnectionTestComponent', () => {
  let component: ServerConnectionTestComponent;
  let fixture: ComponentFixture<ServerConnectionTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServerConnectionTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerConnectionTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
