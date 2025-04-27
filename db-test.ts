import { reset, getAvailabilityByDate } from './lib/db';

async function testDatabaseFunctions() {
  try {
    console.log('Testing reset function...');
    const resetResult = await reset();
    console.log('Reset result:', resetResult);
    
    const today = new Date().toISOString().slice(0, 10);
    console.log(`Testing getAvailabilityByDate for ${today}...`);
    const availabilityResult = await getAvailabilityByDate(today);
    console.log('Availability result:', availabilityResult);
    
    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testDatabaseFunctions().catch(console.error); 