import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ContactsService } from '../..//service/contacts.service';
import { Contact } from '../..//model/contact';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogParameter } from '../..//dialogs/confirm-dialog/confirm-dialog.component';
import { DialogResult } from '../..//config/dialog-result';
import { EditContactDialogComponent } from '../..//dialogs/edit-contact-dialog/edit-contact-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { WalletService } from '../..//service/wallet.service';
import { Router } from '@angular/router';
import { NotificationService } from '../..//service/notification.service';
import { NO_WALLET_ACCOUNT } from '../..//model/walletAccount';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { CONNECTED } from '../..//model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent implements OnInit, OnDestroy {
  title = this.translateService.instant("contact.Title");
  icon = "fas fa-user-circle";

  contacts: Contact[];
  filteredContacts: Contact[];

  contactToEdit: Contact;
  displayContactDialog: boolean = false;

  constructor(
    private translateService: TranslateService,
    private contactService: ContactsService,
    private _ngZone: NgZone,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private router: Router,
    public dialog: MatDialog,
    private serverConnectionService: ServerConnectionService) { }

  ngOnInit() {
    this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
      this._ngZone.run(() => {
        if (connected !== CONNECTED) {
          this.router.navigate(['/dashboard']);
        }
        else {
          this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
            this._ngZone.run(() => {
              if (!account || account === NO_WALLET_ACCOUNT) {
                this.router.navigate(["/"]);
              }
              else {
                this.contactService.getContacts().pipe(takeUntil(this.unsubscribe$)).subscribe(contacts => {
                  this._ngZone.run(() => {
                    this.contacts = contacts.sort((a, b) => {
                      if (a.friendlyName < b.friendlyName) { return -1; }
                      if (a.friendlyName > b.friendlyName) { return 1; }
                      return 0;
                    });
      
                    this.filteredContacts = this.contacts;
                  });
      
                });
              }
            });
          });
        }
      });
    });
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onFilter(filter: string) {
    this.filteredContacts = this.contacts.filter((value) => {
      return value.friendlyName.toLowerCase().includes(filter.toLocaleLowerCase());
    })
  }

  confirmDeleteContact(contact: Contact) {
    setTimeout(() => {

      const dialogParameters = new ConfirmDialogParameter();
      dialogParameters.message = this.translateService.instant("contact.PleaseConfirmDeletionOfContact") + " " + contact.friendlyName;

      let dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '250px',
        data: dialogParameters
      });

      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult === DialogResult.Yes) {
          this.contactService.deleteContact(contact);
        }
      })
    });
  }

  showEditContactDialog(contact: Contact) {
    setTimeout(() => {
      let dialogRef = this.dialog.open(EditContactDialogComponent, {
        width: '450px',
        data: Object.assign(<Contact>{}, contact)
      });

      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult !== DialogResult.Cancel) {
          this.contactService.saveContact(dialogResult)
          .then(()=>{
            this.translateService.get('contact.Success').subscribe(message =>{
              this.notificationService.showSuccess(message);
            });
          })
          .catch(err =>{
            this.notificationService.showError(err);
          });
        }
      })
    });
  }

  addContact() {
    var newContact = this.contactService.createNew();
    this.showEditContactDialog(newContact);
  }

}
