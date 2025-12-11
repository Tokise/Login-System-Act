import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('Admin@12', 10);
console.log(hash);
