// src/types/declarations.d.ts

// Declare node modules
declare module 'express' {
    export * from 'express';

    export function Router() {
        throw new Error('Function not implemented.');
    }
  }
  
  declare module 'mongoose' {
    export * from 'mongoose';
  }
  
  declare module 'cors' {
    const cors: any;
    export default cors;
  }
  
  declare module 'helmet' {
    const helmet: any;
    export default helmet;
  }
  
  declare module 'morgan' {
    const morgan: any;
    export default morgan;
  }
  
  declare module 'compression' {
    const compression: any;
    export default compression;
  }