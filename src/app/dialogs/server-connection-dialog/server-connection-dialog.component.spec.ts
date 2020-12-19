import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerConnectionDialogComponent } from './server-connection-dialog.component';

describe('ServerConnectionComponent', () => {
  let component: ServerConnectionDialogComponent;
  let fixture: ComponentFixture<ServerConnectionDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServerConnectionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerConnectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
