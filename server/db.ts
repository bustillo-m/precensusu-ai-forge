import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For development, use a mock database if DATABASE_URL is not set
let pool: any;
let db: any;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set. Using mock database for development.");
  
  // Create a simple but functional mock database
  pool = null;
  
  // Mock data storage
  const mockData: any = {
    users: [],
    profiles: [],
    chatSessions: [],
    messages: [],
    workflows: [],
    automations: [],
    templates: []
  };
  
  // Helper function to generate UUID
  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  db = {
    select: () => ({
      from: (table: string) => ({
        where: (condition: any) => {
          const records = mockData[table as keyof typeof mockData] || [];
          
          if (condition && condition.operator === 'eq') {
            const filtered = records.filter((record: any) => record[condition.field] === condition.value);
            return filtered[0] || undefined;
          }
          
          return records;
        },
        all: () => mockData[table as keyof typeof mockData] || [],
        limit: (count: number) => ({
          all: () => (mockData[table as keyof typeof mockData] || []).slice(0, count)
        })
      })
    }),
    insert: (table: string) => ({
      values: (data: any) => ({
        returning: (fields: string[]) => {
          const newId = generateId();
          const newRecord = { id: newId, ...data, createdAt: new Date(), updatedAt: new Date() };
          
          if (table === 'users') {
            mockData.users.push(newRecord);
          } else if (table === 'profiles') {
            mockData.profiles.push(newRecord);
          } else if (table === 'chatSessions') {
            mockData.chatSessions.push(newRecord);
          } else if (table === 'messages') {
            mockData.messages.push(newRecord);
          } else if (table === 'workflows') {
            mockData.workflows.push(newRecord);
          } else if (table === 'automations') {
            mockData.automations.push(newRecord);
          } else if (table === 'templates') {
            mockData.templates.push(newRecord);
          }
          
          console.log(`Mock: Created ${table} record:`, newRecord);
          
          return [newRecord];
        }
      })
    }),
    update: (table: string) => ({
      set: (data: any) => ({
        where: (condition: any) => ({
          returning: (fields: string[]) => {
            return [];
          }
        })
      })
    }),
    delete: (table: string) => ({
      where: (condition: any) => ({
        returning: (fields: string[]) => {
          return [];
        }
      })
    }),
    eq: (field: string, value: any) => ({ field, value, operator: 'eq' }),
    and: (...conditions: any[]) => ({ conditions, operator: 'and' }),
    or: (...conditions: any[]) => ({ conditions, operator: 'or' })
  };
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { pool, db };