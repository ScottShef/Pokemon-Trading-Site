// Database initialization script
import { createClient } from '@libsql/client';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initializeDatabase() {
  try {
    console.log('Reading schema file...');
    let schema = fs.readFileSync('frontend/database/schema.sql', 'utf8');
    
    // Remove line comments but preserve line breaks for proper parsing
    schema = schema.replace(/--[^\n]*/g, '');
    
    // Remove block comments
    schema = schema.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split by semicolon but be careful with triggers that contain semicolons
    const statements = [];
    let currentStatement = '';
    let insideTrigger = false;
    
    const lines = schema.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      currentStatement += line + '\n';
      
      // Check if we're starting a trigger
      if (trimmedLine.toUpperCase().includes('CREATE TRIGGER')) {
        insideTrigger = true;
      }
      
      // Check if we're ending a trigger
      if (insideTrigger && trimmedLine === 'END;') {
        insideTrigger = false;
        statements.push(currentStatement.trim());
        currentStatement = '';
        continue;
      }
      
      // If we hit a semicolon and we're not inside a trigger, end the statement
      if (trimmedLine.endsWith(';') && !insideTrigger) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Filter out empty statements
    const validStatements = statements.filter(stmt => stmt.length > 0);
    
    // Separate CREATE TABLE statements from other statements
    const createTableStatements = validStatements.filter(stmt => 
      stmt.toUpperCase().includes('CREATE TABLE')
    );
    
    const otherStatements = validStatements.filter(stmt => 
      !stmt.toUpperCase().includes('CREATE TABLE')
    );
    
    console.log(`Found ${createTableStatements.length} CREATE TABLE statements`);
    console.log(`Found ${otherStatements.length} other statements`);
    
    // Execute CREATE TABLE statements first
    for (const statement of createTableStatements) {
      const tableName = statement.match(/CREATE TABLE\s+(\w+)/i)?.[1] || 'unknown';
      console.log(`Creating table: ${tableName}`);
      await client.execute(statement);
    }
    
    console.log('All tables created successfully!');
    
    // Then execute other statements (indexes, triggers, etc.)
    for (const statement of otherStatements) {
      if (statement.trim()) {
        const statementType = statement.trim().split(/\s+/)[1] || 'unknown';
        console.log(`Executing ${statementType}: ${statement.split('\n')[0].substring(0, 50)}...`);
        try {
          await client.execute(statement);
        } catch (error) {
          console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
          console.error('Error:', error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('Database schema initialized successfully!');
    
    // Test the connection by checking tables
    const result = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `);
    
    console.log('Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name}`);
    });
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.close();
  }
}

initializeDatabase();
