export class MenuConfig {
    showDashboard:boolean = true;
    showSend:boolean = true;
    showReceive:boolean = true;
    showHistory:boolean = true;
    showTools:boolean = true;
    showContacts:boolean = true;
    showSettings:boolean = true;
}

export const Pages = {
    Dashboard : { label : "Dashboard", icon : "fas fa-wallet"  },
    Settings : { label : "Settings", icon : "fas fa-cog"  },
    Send : { label : "Send", icon : "fas fa-sign-out-alt"  },
    Receive : { label : "Receive", icon : "fas fa-sign-in-alt"  },
    History : { label : "History", icon : "fas fa-list-ul"  },
    Contacts : { label : "Contacts", icon : "fas fa-user-circle"  },
    Tools : { label : "Tools", icon : "fas fa-user-circle"  }
}

export function TRANSLATE(str: string) {
    return str;
}
