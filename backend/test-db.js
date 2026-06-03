import pg from 'pg';
const { Client } = pg;

const users = ['app_user', 'postgres', 'postgress'];
const passwords = ['Admin@123', 'admin@123', 'Admin123', 'admin123', '_Vanpire1031!'];
// The user screenshot shows "postgres" and "study_abroad" or "StduyAbroad" might be the database.
// Actually, let's just try to connect to the 'postgres' database first to test credentials.
// Or try 'study_abroad' directly.

async function testConnection(user, password, db) {
  const client = new Client({
    user,
    password,
    host: 'localhost',
    port: 5432,
    database: db
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS: postgresql://${user}:${password}@localhost:5432/${db}`);
    await client.end();
    return true;
  } catch (err) {
    // console.log(`❌ FAILED: ${user}:${password} on ${db} - ${err.message}`);
    return false;
  }
}

async function main() {
  for (const user of users) {
    for (const password of passwords) {
      // test on study_abroad
      if (await testConnection(user, password, 'study_abroad')) {
        return;
      }
      // test on postgres
      if (await testConnection(user, password, 'postgres')) {
        return;
      }
    }
  }
  console.log("No valid combination found.");
}

main();
