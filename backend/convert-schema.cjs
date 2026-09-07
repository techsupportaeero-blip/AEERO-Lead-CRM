const fs = require('fs');

let schema = fs.readFileSync('./prisma/schema.prisma', 'utf-8');

// Change provider
schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
// Remove directUrl
schema = schema.replace(/directUrl\s*=\s*env\("DIRECT_URL"\)/, '');

// Remove @db.Text
schema = schema.replace(/@db\.Text/g, '');

// Remove @db.Decimal(10, 2)
schema = schema.replace(/@db\.Decimal\(10,\s*2\)/g, '');

fs.writeFileSync('./prisma/schema.prisma', schema);
console.log("Schema updated for SQLite");
