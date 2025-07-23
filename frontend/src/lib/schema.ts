import { pgTable, serial, text, boolean, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: text('title').notNull(),
  completed: boolean('completed').default(false).notNull(),
  hasBeenSplit: boolean('has_been_split').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  completedTasks: integer('completed_tasks').default(0).notNull(),
  totalTasks: integer('total_tasks').default(0).notNull(),
  allTimeCompleted: integer('all_time_completed').default(0).notNull(),
  mood: varchar('mood', { length: 50 }).default('overwhelmed').notNull(),
  dailyCompletedTasks: integer('daily_completed_tasks').default(0).notNull(),
  dailyMoodChecks: integer('daily_mood_checks').default(0).notNull(),
  dailyAISplits: integer('daily_ai_splits').default(0).notNull(),
  lastResetDate: timestamp('last_reset_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});