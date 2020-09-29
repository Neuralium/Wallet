import { Injectable, OnDestroy } from '@angular/core';
import { Contact, NO_CONTACT } from '../model/contact';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as Store from 'electron-store';


@Injectable({
  providedIn: 'root'
})
export class ContactsService implements OnDestroy {
  store = new Store.default();
  contacts: Array<Contact> = [];
  observableContacts: BehaviorSubject<Array<Contact>> = new BehaviorSubject<Array<Contact>>(this.contacts);

  constructor(private translateService: TranslateService) {
    this.loadContacts();
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  private loadContacts() {
    if (this.store.has('contacts')) {
      this.contacts = <Array<Contact>>this.store.get('contacts');
      this.observableContacts.next(this.contacts);
    }
    else {
      this.contacts = new Array<Contact>();
      this.saveContacts();
    }
  }

  saveContacts() {
    this.store.set('contacts', this.contacts);
    this.loadContacts();
  }

  getContacts(): Observable<Contact[]> {
    return this.observableContacts;
  }

  getContact(id:string):Contact{
    return this.contacts.find(contact => {return contact.id === id});
  }

  createNew() {
    return Object.assign(<Contact>{}, NO_CONTACT);
  }

  contactExists(id: string): boolean {
    return this.contacts.find(item => { return item.id === id }) !== undefined;
  }

  saveContact(contact: Contact): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      var contactToSave = this.contacts.find(item => { return item.id === contact.id });

      if (contact.isNew && contactToSave !== undefined) {
        this.translateService.get("contact.AlreadyExists", { id: contactToSave.id, name: contactToSave.friendlyName }).subscribe(message => {
          reject(message);
        })
      }
      else{
        if (contactToSave === undefined) {
          contact.isNew = false;
          this.contacts.push(contact);
        }
        else {
          contactToSave.id = contact.id;
          contactToSave.friendlyName = contact.friendlyName;
          contactToSave.isNew = false;
        }
  
        this.observableContacts.next(this.contacts);
        this.saveContacts();
        resolve();
      }
    });
  }

  deleteContact(contact: Contact) {
    this.contacts = this.contacts.filter(item => item.id !== contact.id);
    this.observableContacts.next(this.contacts);
    this.saveContacts();
  }
}
