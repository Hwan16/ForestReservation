/**
 * 서버 관련 타입 선언 파일
 */

/**
 * 유형 지정이 없는 패키지에 대한 선언
 */
declare module 'debug' {
  function debug(namespace: string): {
    (formatter: any, ...args: any[]): void;
    enabled: boolean;
    namespace: string;
    extend: (namespace: string) => debug.Debugger;
  };
  
  namespace debug {
    export interface Debugger {
      (formatter: any, ...args: any[]): void;
      enabled: boolean;
      namespace: string;
      extend: (namespace: string) => Debugger;
    }
    
    export function enable(namespaces: string): void;
    export function disable(): string;
    export function coerce(value: any): any;
  }
  
  export = debug;
}

declare module 'dotenv-expand' {
  import * as dotenv from 'dotenv';
  
  export function expand(config: dotenv.DotenvConfigOutput): dotenv.DotenvConfigOutput;
}

/**
 * 전역 테스트 데이터 (Jest 전용)
 */
interface TestData {
  validUser: {
    email: string;
    password: string;
    username: string;
  };
  validReservation: {
    date: string;
    timeSlot: string;
    name: string;
    instName: string;
    phone: string;
    participants: number;
    desiredActivity: string;
    parentParticipation: string;
  };
}

declare global {
  namespace NodeJS {
    interface Global {
      testData: TestData;
    }
  }
  
  var testData: TestData;
} 