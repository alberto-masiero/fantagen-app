import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'select', pathMatch: 'full' },

  {
    path: 'select',
    loadComponent: () => import('./pages/select/select.page').then(m => m.SelectPage),
  },
  
  {
    path: 'formation',
    loadComponent: () => import('./pages/formation/formation.page').then(m => m.FormationPage),
  },
  
  { path: '**', redirectTo: 'select' },
  
 

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
