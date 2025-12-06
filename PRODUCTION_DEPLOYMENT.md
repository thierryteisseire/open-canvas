# Production Deployment Guide

## Overview

Open Canvas consists of two services that need to be deployed:
1. **LangGraph Server** (backend agents)
2. **Next.js Frontend** (web application)

## Deployment Options

### Option 1: LangGraph Cloud + Vercel (Recommended)

This is the easiest production setup with managed services.

#### Step 1: Deploy LangGraph Server to LangGraph Cloud

1. **Install LangGraph CLI:**
   ```bash
   pip install langgraph-cli
   ```

2. **Login to LangGraph Cloud:**
   ```bash
   langgraph login
   ```

3. **Deploy from root directory:**
   ```bash
   langgraph deploy --config langgraph.json
   ```

4. **Note the deployment URL** (e.g., `https://your-deployment.langgraph.app`)

#### Step 2: Deploy Next.js to Vercel

1. **Push your code to GitHub**

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `apps/web`

3. **Configure Environment Variables in Vercel:**
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # LangGraph Cloud URL (from Step 1)
   LANGGRAPH_API_URL=https://your-deployment.langgraph.app
   
   # Optional: Groq for transcription
   GROQ_API_KEY=your_groq_key
   
   # Optional: FireCrawl for web scraping
   FIRECRAWL_API_KEY=your_firecrawl_key
   
   # Optional: Exa for web search
   EXA_API_KEY=your_exa_key
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically

---

### Option 2: Self-Hosted (Docker)

For full control, deploy both services yourself.

#### Prerequisites
- Docker & Docker Compose
- Server with public IP or domain
- Reverse proxy (nginx/Caddy) for HTTPS

#### Step 1: Create Production Docker Setup

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  langgraph:
    build:
      context: .
      dockerfile: Dockerfile.langgraph
    ports:
      - "54367:54367"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - LANGSMITH_API_KEY=${LANGSMITH_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - FIREWORKS_API_KEY=${FIREWORKS_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
      - EXA_API_KEY=${EXA_API_KEY}
    restart: unless-stopped
    volumes:
      - langgraph-data:/data

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - LANGGRAPH_API_URL=http://langgraph:54367
      - GROQ_API_KEY=${GROQ_API_KEY}
      - FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
      - EXA_API_KEY=${EXA_API_KEY}
    depends_on:
      - langgraph
    restart: unless-stopped

volumes:
  langgraph-data:
```

#### Step 2: Create Dockerfiles

**Dockerfile.langgraph:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY apps/agents/package.json ./apps/agents/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN yarn build

# Expose port
EXPOSE 54367

# Start LangGraph server
WORKDIR /app/apps/agents
CMD ["yarn", "langgraphjs", "dev", "--port", "54367", "--config", "../../langgraph.json", "--no-browser"]
```

**Dockerfile.web:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN yarn build
RUN cd apps/web && yarn build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy built files
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3000

WORKDIR /app/apps/web
CMD ["yarn", "start"]
```

#### Step 3: Deploy

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

#### Step 4: Setup Reverse Proxy (nginx example)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Option 3: VPS with PM2

For a simple VPS deployment without Docker.

#### Step 1: Setup Server

```bash
# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
npm install -g yarn

# Install PM2
npm install -g pm2
```

#### Step 2: Deploy Code

```bash
# Clone repository
git clone https://github.com/your-username/open-canvas.git
cd open-canvas

# Install dependencies
yarn install

# Build
yarn build
```

#### Step 3: Create PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'langgraph',
      cwd: './apps/agents',
      script: 'yarn',
      args: 'langgraphjs dev --port 54367 --config ../../langgraph.json --no-browser',
      env: {
        NODE_ENV: 'production',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
      },
    },
    {
      name: 'web',
      cwd: './apps/web',
      script: 'yarn',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        LANGGRAPH_API_URL: 'http://localhost:54367',
      },
    },
  ],
};
```

#### Step 4: Start with PM2

```bash
# Start services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Monitor
pm2 monit

# View logs
pm2 logs
```

---

## Environment Variables Checklist

### Required for LangGraph Server (Root .env)
- ✅ `OPENAI_API_KEY`
- ✅ `ANTHROPIC_API_KEY`
- ✅ `LANGSMITH_API_KEY`

### Required for Next.js (apps/web/.env)
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `LANGGRAPH_API_URL`

### Optional
- `GOOGLE_API_KEY` - For Gemini models
- `FIREWORKS_API_KEY` - For Fireworks models
- `GROQ_API_KEY` - For audio transcription
- `FIRECRAWL_API_KEY` - For web scraping
- `EXA_API_KEY` - For web search

---

## Health Checks

### LangGraph Server
```bash
curl http://localhost:54367/health
```

### Next.js
```bash
curl http://localhost:3000/api/health
```

---

## Monitoring & Logs

### LangGraph Cloud
- View logs in LangGraph Cloud dashboard
- Monitor traces in LangSmith

### Self-Hosted
- Use PM2 logs: `pm2 logs`
- Use Docker logs: `docker-compose logs -f`
- Setup log aggregation (e.g., Loki, CloudWatch)

---

## Scaling Considerations

1. **LangGraph Server**: Can be scaled horizontally behind a load balancer
2. **Next.js**: Vercel handles this automatically, or use multiple instances with PM2
3. **Database**: Supabase handles scaling automatically
4. **Caching**: Consider Redis for session/memory caching

---

## Security Checklist

- [ ] Use HTTPS (Let's Encrypt with Certbot)
- [ ] Set secure environment variables
- [ ] Enable Supabase RLS (Row Level Security)
- [ ] Rate limit API endpoints
- [ ] Keep dependencies updated
- [ ] Monitor for security vulnerabilities
- [ ] Backup Supabase database regularly

---

## Troubleshooting

**Issue: LangGraph server not connecting**
- Check `LANGGRAPH_API_URL` is correct
- Verify firewall allows port 54367
- Check LangGraph server logs

**Issue: Authentication failing**
- Verify Supabase credentials
- Check Supabase project is active
- Verify callback URLs in Supabase settings

**Issue: Models not working**
- Verify API keys are set correctly
- Check API key quotas/limits
- Review LangSmith traces for errors
