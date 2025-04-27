import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Database } from '../types/supabase';

/**
 * Interface for the retry configuration
 */
interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in ms between retries */
  retryDelay: number;
  /** Function to determine if an error should be retried based on error code */
  shouldRetry: (error: PostgrestError) => boolean;
}

/**
 * Default retry configuration
 */
const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  shouldRetry: (error: PostgrestError) => {
    // Retry on connection errors, timeouts, or rate limits
    const retriableErrorCodes = [
      '08000', // connection_exception
      '08003', // connection_does_not_exist
      '08006', // connection_failure
      '08001', // sqlclient_unable_to_establish_sqlconnection
      '08004', // sqlserver_rejected_establishment_of_sqlconnection
      '57014', // query_canceled
      '57P01', // admin_shutdown
      '57P02', // crash_shutdown
      '57P03', // cannot_connect_now
      '53300', // too_many_connections
      '53400', // configuration_limit_exceeded
      '55P03', // lock_not_available
      '55006', // object_in_use
      '40001', // serialization_failure
      '40P01', // deadlock_detected
      '42P04'  // duplicate_database
    ];
    
    return retriableErrorCodes.includes(error.code);
  }
};

/**
 * Utility to delay execution
 * 
 * @param ms Time to delay in milliseconds
 * @returns Promise that resolves after the delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Type definition for a Supabase query result
 */
export interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

/**
 * Type for a function that returns a Promise with Supabase query result
 */
export type QueryFunction<T> = () => Promise<QueryResult<T>>;

/**
 * Execute a Supabase query with retry logic
 * 
 * @param queryFn Function that returns a Promise with the query result
 * @param config Retry configuration (optional)
 * @returns Promise with the query result
 */
export async function withRetry<T>(
  queryFn: QueryFunction<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<QueryResult<T>> {
  let retries = 0;
  
  while (true) {
    try {
      const result = await queryFn();
      
      if (result.error) {
        if (retries < config.maxRetries && config.shouldRetry(result.error)) {
          // Calculate delay with exponential backoff: base * 2^retries
          const backoffDelay = config.retryDelay * Math.pow(2, retries);
          console.warn(`Retrying query after error: ${result.error.message} (Attempt ${retries + 1}/${config.maxRetries})`);
          await delay(backoffDelay);
          retries++;
          continue;
        }
        
        console.error(`Query failed after ${retries} retries:`, result.error);
      }
      
      return result;
    } catch (err) {
      const error = err as Error;
      console.error(`Unexpected error during query:`, error);
      
      return {
        data: null,
        error: {
          message: error.message,
          details: '',
          hint: '',
          code: 'unknown'
        } as PostgrestError
      };
    }
  }
}

/**
 * Execute a series of operations as a transaction
 * Note: This simulates a transaction since Supabase doesn't directly expose
 * transaction control in the JS client
 * 
 * @param operations Array of functions that perform database operations
 * @returns Promise with the results of all operations or error
 */
export async function transaction<T>(operations: Array<() => Promise<QueryResult<T>>>): Promise<{
  results: Array<QueryResult<T>>;
  success: boolean;
}> {
  const results: Array<QueryResult<T>> = [];
  let success = true;
  
  for (const operation of operations) {
    try {
      const result = await operation();
      results.push(result);
      
      if (result.error) {
        console.error(`Transaction operation failed:`, result.error);
        success = false;
        break;
      }
    } catch (err) {
      console.error(`Unexpected error in transaction:`, err);
      success = false;
      break;
    }
  }
  
  return { results, success };
}

/**
 * Checks if the database connection is working
 * 
 * @returns Promise that resolves to true if connected, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
  const result = await withRetry<{ id: number }[]>(() => {
    return new Promise<QueryResult<{ id: number }[]>>(resolve => {
      supabase.from('users').select('id').limit(1).then(({ data, error }) => {
        resolve({
          data,
          error
        });
      });
    });
  });
  
  return !result.error;
} 