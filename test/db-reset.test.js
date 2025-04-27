import { reset } from '../lib/db';

describe('Database Reset Function', () => {
  it('should reset reservations and availability data', async () => {
    // Run the reset function
    const result = await reset();
    
    // Check that the reset was successful
    expect(result.error).toBeNull();
    expect(result.data.success).toBe(true);
  }, 30000); // Increase timeout to 30 seconds as this operation might take time
}); 