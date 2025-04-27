// ES module style
import { execSync } from 'child_process';

console.log("Testing database functions using ts-node...");

try {
  // Run the ts-node script
  console.log("Running test with ts-node...");
  const result = execSync('npx ts-node --esm -e "import { reset, getAvailabilityByDate } from \'./lib/db\'; async function test() { console.log(\'Testing reset function...\'); const resetResult = await reset(); console.log(\'Reset result:\', resetResult); const today = new Date().toISOString().slice(0, 10); console.log(`Testing getAvailabilityByDate for ${today}...`); const availabilityResult = await getAvailabilityByDate(today); console.log(\'Availability result:\', availabilityResult); } test().catch(console.error);"', { encoding: 'utf-8' });
  
  console.log(result);
  console.log("All tests completed successfully!");
} catch (error) {
  console.error("Test failed:", error.message);
  if (error.stdout) console.error("stdout:", error.stdout);
  if (error.stderr) console.error("stderr:", error.stderr);
} 