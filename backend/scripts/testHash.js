import bcrypt from 'bcryptjs';

const password = 'password123';
const hash = '$2a$10$iCsqOyw6AQhmnuhBkcuFoeJvTWjl.vTVOVDu845klfjtZywXgZSqS';

const isMatch = await bcrypt.compare(password, hash);

console.log('Testing password:', password);
console.log('Against hash:', hash);
console.log('Match result:', isMatch);

if (isMatch) {
  console.log('\n✓ SUCCESS: Password matches the hash!');
  console.log('Login should work with these credentials.');
} else {
  console.log('\n✗ FAILED: Password does not match the hash.');
}
