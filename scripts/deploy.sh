#!/bin/bash

# Production Deployment Script
# Telegram Claude MCP TON Connector

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="telegram-claude-mcp"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found. Please create it from .env.example"
        exit 1
    fi
    
    log_success "All requirements met"
}

create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "./nginx/ssl"
    mkdir -p "./monitoring"
    
    log_success "Directories created"
}

backup_existing() {
    log_info "Creating backup of existing deployment..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_NAME="backup_${TIMESTAMP}"
    
    # Backup Redis data if container exists
    if docker ps -a | grep -q "telegram-claude-redis-prod"; then
        log_info "Backing up Redis data..."
        docker exec telegram-claude-redis-prod redis-cli save || log_warning "Redis backup failed"
        
        # Copy Redis data
        mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/redis"
        docker cp telegram-claude-redis-prod:/data/. "${BACKUP_DIR}/${BACKUP_NAME}/redis/" || log_warning "Redis data copy failed"
    fi
    
    # Backup logs
    if [ -d "$LOG_DIR" ] && [ "$(ls -A $LOG_DIR)" ]; then
        log_info "Backing up logs..."
        mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/logs"
        cp -r "$LOG_DIR"/* "${BACKUP_DIR}/${BACKUP_NAME}/logs/" || log_warning "Log backup failed"
    fi
    
    # Backup environment file
    if [ -f ".env" ]; then
        cp ".env" "${BACKUP_DIR}/${BACKUP_NAME}/.env" || log_warning "Environment backup failed"
    fi
    
    log_success "Backup created at ${BACKUP_DIR}/${BACKUP_NAME}"
}

pull_latest_images() {
    log_info "Pulling latest Docker images..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    log_success "Images pulled successfully"
}

stop_existing_services() {
    log_info "Stopping existing services..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30
    fi
    
    log_success "Existing services stopped"
}

start_services() {
    log_info "Starting production services..."
    
    # Start core services first
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d redis
    
    # Wait for Redis to be ready
    log_info "Waiting for Redis to be ready..."
    sleep 10
    
    # Start main application
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d app
    
    # Wait for app to be ready
    log_info "Waiting for application to start..."
    sleep 20
    
    # Start reverse proxy
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d nginx
    
    log_success "All services started"
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Wait a bit more for services to stabilize
    sleep 10
    
    # Check if containers are running
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        log_error "Some containers are not running properly"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=50
        exit 1
    fi
    
    # Run application health check
    if docker exec telegram-claude-mcp-prod node healthcheck.js; then
        log_success "Health checks passed"
    else
        log_error "Health checks failed"
        log_info "Application logs:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs app --tail=20
        exit 1
    fi
}

display_status() {
    log_info "Deployment Status:"
    echo ""
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    echo ""
    
    log_info "Application URLs:"
    echo "  🌐 Main Application: https://your-domain.com"
    echo "  🤖 Telegram Bot: Configured webhook"
    echo "  📊 Health Check: https://your-domain.com/health"
    echo "  🔧 MCP Server: stdio transport (port 8080)"
    echo ""
    
    log_info "Useful Commands:"
    echo "  View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "  Restart services: docker-compose -f $DOCKER_COMPOSE_FILE restart"
    echo "  Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "  Update: ./scripts/deploy.sh"
    echo ""
}

setup_monitoring() {
    if [[ "$1" == "--with-monitoring" ]]; then
        log_info "Setting up monitoring stack..."
        
        # Create Prometheus config if it doesn't exist
        if [ ! -f "./monitoring/prometheus.yml" ]; then
            cat > ./monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'telegram-claude-mcp'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
EOF
        fi
        
        # Start monitoring services
        docker-compose -f "$DOCKER_COMPOSE_FILE" --profile monitoring up -d
        
        log_success "Monitoring stack started"
        echo "  📊 Prometheus: http://localhost:9090"
        echo "  📈 Grafana: http://localhost:3001 (admin/admin)"
    fi
}

main() {
    log_info "Starting production deployment of $APP_NAME"
    echo ""
    
    # Parse arguments
    ENABLE_MONITORING=false
    if [[ "$1" == "--with-monitoring" ]]; then
        ENABLE_MONITORING=true
    fi
    
    # Run deployment steps
    check_requirements
    create_directories
    backup_existing
    pull_latest_images
    stop_existing_services
    start_services
    
    if $ENABLE_MONITORING; then
        setup_monitoring --with-monitoring
    fi
    
    run_health_checks
    display_status
    
    log_success "Deployment completed successfully!"
    log_info "Your Telegram Claude MCP Connector is now running in production mode."
    
    # Show next steps
    echo ""
    log_info "Next Steps:"
    echo "  1. Configure your domain SSL certificates in nginx/ssl/"
    echo "  2. Set up your Telegram bot webhook: https://your-domain.com/webhook"
    echo "  3. Configure Claude Desktop with the MCP server"
    echo "  4. Test all integrations (Telegram, TON, JIRA)"
    echo ""
    
    log_warning "Remember to:"
    echo "  - Keep your .env.production file secure"
    echo "  - Monitor application logs regularly"
    echo "  - Set up automated backups"
    echo "  - Update SSL certificates before expiry"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Show usage if --help is provided
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --with-monitoring    Enable Prometheus and Grafana monitoring"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "This script deploys the Telegram Claude MCP Connector in production mode."
    echo "Make sure to configure .env.production before running."
    exit 0
fi

# Run main deployment
main "$@"