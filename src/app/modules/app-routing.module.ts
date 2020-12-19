import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent, SendComponent, ReceiveComponent, HistoryComponent, ToolsComponent, SettingsComponent, ServerComponent, ContactsComponent, NeuraliumsComponent } from '../pages';
import { TestPageComponent } from '../pages/test-page/test-page.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path:'dashboard', component: DashboardComponent }, //TestPageComponent
  { path:'send', component: SendComponent},
  { path:'neuraliums', component: NeuraliumsComponent},
  { path:'receive', component: ReceiveComponent},
  { path:'history', component: HistoryComponent},
  { path:'settings', component: SettingsComponent},
  { path:'tools', component: ToolsComponent},
  { path:'server', component: ServerComponent},
  { path:'contacts', component: ContactsComponent},
  { path:'test', component: TestPageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
