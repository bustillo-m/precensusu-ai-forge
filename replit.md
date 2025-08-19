# Replit.md

## Overview

This is a full-stack AI automation platform called "Precensusu AI" that enables users to create and manage automated workflows using conversational AI. The application consists of a React frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and multiple AI services for workflow generation. The platform offers both standard chat functionality and specialized business consultation features for creating automation workflows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript running on Vite for development
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system variables
- **State Management**: TanStack React Query for server state management
- **Routing**: React Router for client-side navigation
- **Authentication**: Supabase Auth integration with JWT tokens

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **API Design**: RESTful endpoints with middleware for request logging and error handling
- **Development**: Hot module replacement via Vite integration

### Database Design
- **Provider**: Neon Database (PostgreSQL)
- **Schema**: User management (users, profiles), chat system (chat_sessions, messages), and workflow management (workflows, automations, templates)
- **Relationships**: Foreign key constraints with cascade deletions for data integrity
- **Migration**: Drizzle Kit for schema management

### AI Integration Pipeline
- **Multi-Stage Processing**: Four-stage AI workflow generation using different AI providers
  1. ChatGPT Planner: Initial workflow planning and structure
  2. Claude Refiner: Optimization and error handling enhancement
  3. DeepSeek Optimizer: Performance and scalability improvements
  4. N8N Assistant: Final JSON generation for workflow execution
- **Orchestration**: Central orchestration service coordinates the multi-AI pipeline
- **Validation**: Dry-run execution and workflow validation before deployment

### Chat System
- **Dual Chat Modes**: Standard automation chat and specialized business consultation
- **Real-time Messaging**: Session-based chat with persistent message history
- **AI Response Types**: Support for multiple AI providers (ChatGPT, Claude, DeepSeek, N8N)
- **Workflow Integration**: Direct workflow generation from chat conversations

## External Dependencies

### Core Infrastructure
- **Database**: Neon Database (PostgreSQL) for data persistence
- **Authentication**: Supabase for user authentication and session management
- **Deployment**: Replit platform integration with custom Vite plugins

### AI Services
- **OpenAI API**: ChatGPT for initial workflow planning and general chat responses
- **Anthropic API**: Claude for workflow refinement and optimization
- **DeepSeek API**: Advanced optimization and performance tuning
- **N8N Integration**: Workflow execution platform for automation deployment

### Communication Services
- **Email**: Resend API for transactional emails and lead notifications
- **Notifications**: Custom credential request system for missing API configurations

### Frontend Libraries
- **UI Components**: Extensive Radix UI component library for accessible interfaces
- **Form Handling**: React Hook Form with Zod validation
- **Markdown**: React Markdown with GitHub Flavored Markdown support
- **Icons**: Lucide React for consistent iconography

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: ESBuild for production bundling
- **Error Handling**: Replit error overlay for development debugging
- **Hot Reload**: Custom Vite middleware for seamless development experience