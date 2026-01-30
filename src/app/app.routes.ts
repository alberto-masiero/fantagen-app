import { Routes } from '@angular/router';
import { SelectPage } from './pages/select/select.page';
import { FormationPage } from './pages/formation/formation.page';

export const routes: Routes = [
  { path: '', redirectTo: 'select', pathMatch: 'full' },
  { path: 'select', component: SelectPage },
  { path: 'formation', component: FormationPage },
  
];
