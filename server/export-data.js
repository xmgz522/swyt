const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(path.join(__dirname, 'data.db'));
  const db = new SQL.Database(buf);

  // Get all tables
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  if (!tables.length) { console.log('No tables found'); return; }

  let output = '-- SQLite to MySQL data export\nSET FOREIGN_KEY_CHECKS = 0;\n\n';
  
  // Skip the 'user' table since server auto-creates admin/teacher on startup
  const skipTables = ['user'];
  
  for (const row of tables[0].values) {
    const tableName = row[0];
    if (skipTables.includes(tableName)) {
      console.log(`Skipping table: ${tableName} (auto-created by server)`);
      continue;
    }
    
    const data = db.exec(`SELECT * FROM "${tableName}"`);
    if (!data.length || !data[0].values.length) {
      console.log(`${tableName}: 0 rows, skipping`);
      continue;
    }
    
    const columns = data[0].columns;
    const rows = data[0].values;
    console.log(`${tableName}: ${rows.length} rows`);
    
    output += `-- Table: ${tableName} (${rows.length} rows)\n`;
    
    for (const row of rows) {
      const vals = row.map(v => {
        if (v === null) return 'NULL';
        if (typeof v === 'number') return v;
        // Escape single quotes and backslashes
        const escaped = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `'${escaped}'`;
      });
      output += `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${vals.join(', ')});\n`;
    }
    output += '\n';
  }
  
  output += 'SET FOREIGN_KEY_CHECKS = 1;\n';
  
  const outFile = path.join(__dirname, 'data-export.sql');
  fs.writeFileSync(outFile, output, 'utf8');
  console.log(`\nExported to: ${outFile}`);
}

main().catch(e => console.error(e));
