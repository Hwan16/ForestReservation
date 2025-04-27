// ES module style
import { execSync } from 'child_process';

console.log("Testing database functions...");

try {
  // Dynamically import the compiled file
  const { reset, getAvailabilityByDate } = await import('./dist/lib/lib/db.js');
  
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