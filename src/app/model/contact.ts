export class Contact {
    id:string;
    friendlyName:string;
    isNew:boolean;
}

export const NO_CONTACT = <Contact>{
    id:"",
    friendlyName:"",
    isNew:true
}