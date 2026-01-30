import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormationPage } from './formation.page';

describe('FormationPage', () => {
  let component: FormationPage;
  let fixture: ComponentFixture<FormationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
