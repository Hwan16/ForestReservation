declare module 'aligoapi' {
  const aligoapi: {
    send: (req: any, auth: any) => Promise<any>;
    sendMass: (req: any, auth: any) => Promise<any>;
    list: (req: any, auth: any) => Promise<any>;
    smsList: (req: any, auth: any) => Promise<any>;
    remain: (req: any, auth: any) => Promise<any>;
    cancel: (req: any, auth: any) => Promise<any>;
  };

  export default aligoapi;
} 