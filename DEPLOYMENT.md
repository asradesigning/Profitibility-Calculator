# Deployment Guide

This document outlines the steps required to deploy the Profitability Analysis Tool in a production environment.

## Prerequisites

- Node.js (v18+) installed on the server
- PostgreSQL database server
- Domain name (optional, for production deployment)
- SSL certificate (recommended for production)

## Deployment Options

There are several ways to deploy this application:

1. **Traditional Server Deployment**: Deploy to a VPS or dedicated server
2. **Cloud Platform Deployment**: Deploy to AWS, Azure, Google Cloud, etc.
3. **Platform-as-a-Service (PaaS)**: Deploy to Heroku, Railway, Render, etc.

This guide covers the traditional server deployment approach.

## Step-by-Step Deployment Process

### 1. Prepare the Server

```bash
# Update the server
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL (if not already installed)
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2
```

### 2. Set Up the Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create a database and user
CREATE DATABASE profitability_analysis;
CREATE USER appuser WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE profitability_analysis TO appuser;

# Exit PostgreSQL
\q
```

### 3. Clone and Set Up the Application

```bash
# Clone the repository
git clone [repository-url] /var/www/profitability-analysis
cd /var/www/profitability-analysis

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env
```

Update the `.env` file with your production settings:

```
DATABASE_URL=postgresql://appuser:secure_password@localhost:5432/profitability_analysis
APP_SECRET=your_very_secure_random_string_at_least_32_chars
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

### 4. Build the Application

```bash
# Build the application
npm run build
```

### 5. Initialize the Database

```bash
# Run database migrations
npm run db:push
```

### 6. Set Up Process Management with PM2

```bash
# Start the application with PM2
pm2 start npm --name "profitability-analysis" -- start

# Ensure PM2 starts on system reboot
pm2 startup
pm2 save
```

### 7. Set Up Reverse Proxy with Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/profitability-analysis
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/profitability-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Set Up SSL (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and configure SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 9. Monitoring and Maintenance

Monitor the application:

```bash
# View logs
pm2 logs profitability-analysis

# Monitor application
pm2 monit

# Restart application after updates
pm2 restart profitability-analysis
```

## Backup Strategy

### Database Backup

Set up automated PostgreSQL backups:

```bash
# Create a backup script
nano /var/www/profitability-analysis/backup.sh
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/profitability-analysis"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U appuser -h localhost profitability_analysis > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only the last 7 backups
ls -t $BACKUP_DIR/*.gz | tail -n +8 | xargs -r rm
```

Make the script executable and set up a cron job:

```bash
chmod +x /var/www/profitability-analysis/backup.sh

# Add to crontab to run daily at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/profitability-analysis/backup.sh") | crontab -
```

## Scaling Considerations

For high-traffic deployments, consider these scaling options:

1. **Vertical Scaling**: Increase server resources (CPU, RAM)
2. **Horizontal Scaling**: Deploy multiple application instances behind a load balancer
3. **Database Scaling**: Implement connection pooling, read replicas, or sharding
4. **Caching**: Implement Redis for session storage and application caching

## Troubleshooting

### Common Issues

**Application fails to start:**
- Check the logs: `pm2 logs profitability-analysis`
- Verify environment variables in `.env`
- Check if the database is accessible

**Database connection issues:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env`
- Ensure the database user has proper permissions

**Nginx configuration issues:**
- Test Nginx configuration: `sudo nginx -t`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

## Updating the Application

To update the application:

```bash
cd /var/www/profitability-analysis
git pull
npm install
npm run build
pm2 restart profitability-analysis
```

## Security Considerations

1. **Firewall Configuration**: Set up a firewall to restrict access
2. **Regular Updates**: Keep the server and application dependencies updated
3. **Environment Variables**: Never commit `.env` to version control
4. **Access Control**: Implement proper authentication and authorization
5. **Rate Limiting**: Consider implementing API rate limiting to prevent abuse
