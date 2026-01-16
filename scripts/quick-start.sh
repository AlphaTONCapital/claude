#!/bin/bash

# Quick Start Script for Telegram Claude MCP Connector
# Sets up development and production environments

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

print_banner() {
    echo ""
    echo "🚀 Telegram Claude MCP TON Connector"
    echo "   Quick Start Setup"
    echo ""
    echo "This script will help you set up the connector for:"
    echo "  • Telegram Bot integration"
    echo "  • Claude AI via MCP"
    echo "  • TON Blockchain operations"
    echo "  • JIRA project management"
    echo ""
}

check_dependencies() {
    log_info "Checking system dependencies..."
    
    local missing_deps=()
    
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("Node.js")
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        missing_deps+=("npm")
    fi
    
    if ! command -v git >/dev/null 2>&1; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_success "All dependencies found"
}

setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        log_success "Created .env.local from template"
        
        log_warning "IMPORTANT: You need to configure the following in .env.local:"
        echo ""
        echo "Required API Keys:"
        echo "  • TELEGRAM_BOT_TOKEN (get from @BotFather)"
        echo "  • ANTHROPIC_API_KEY (get from https://console.anthropic.com)"
        echo ""
        echo "Optional but recommended:"
        echo "  • TON_WALLET_MNEMONIC (24-word phrase for TON operations)"
        echo "  • JIRA_API_KEY (for project management integration)"
        echo ""
    else
        log_info ".env.local already exists"
    fi
}

install_dependencies() {
    log_info "Installing Node.js dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        log_success "Dependencies installed"
    else
        log_info "Dependencies already installed"
    fi
}

build_application() {
    log_info "Building application..."
    
    npm run build
    log_success "Application built successfully"
}

setup_claude_desktop() {
    log_info "Setting up Claude Desktop integration..."
    
    local config_path=""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        config_path="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        config_path="$HOME/.config/Claude/claude_desktop_config.json"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        config_path="$APPDATA/Claude/claude_desktop_config.json"
    fi
    
    if [ -n "$config_path" ]; then
        local config_dir=$(dirname "$config_path")
        mkdir -p "$config_dir"
        
        local current_dir=$(pwd)
        
        cat > "$config_path" << EOF
{
  "mcpServers": {
    "telegram-claude-mcp": {
      "command": "npm",
      "args": ["start"],
      "cwd": "$current_dir",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
EOF
        
        log_success "Claude Desktop configuration created at: $config_path"
        log_info "Restart Claude Desktop to load the MCP server"
    else
        log_warning "Could not detect Claude Desktop config path for your OS"
        log_info "Manual setup required - see docs/CLAUDE_DESKTOP_SETUP.md"
    fi
}

run_tests() {
    log_info "Running tests to verify setup..."
    
    if npm test; then
        log_success "All tests passed"
    else
        log_warning "Some tests failed - this is expected if APIs aren't configured yet"
    fi
}

start_development() {
    log_info "Starting development server..."
    
    echo ""
    log_info "Development server commands:"
    echo "  • npm run dev     - Start with hot reload"
    echo "  • npm start       - Start production build"
    echo "  • npm test        - Run test suite"
    echo "  • npm run lint    - Check code style"
    echo ""
    
    read -p "Start development server now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run dev
    fi
}

show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    log_info "Next steps:"
    echo ""
    echo "1. Configure API Keys:"
    echo "   Edit .env.local with your API keys"
    echo ""
    echo "2. Set up Telegram Bot:"
    echo "   • Create bot with @BotFather"
    echo "   • Add token to TELEGRAM_BOT_TOKEN"
    echo "   • Set webhook (for production)"
    echo ""
    echo "3. Configure Claude AI:"
    echo "   • Get API key from https://console.anthropic.com"
    echo "   • Add to ANTHROPIC_API_KEY"
    echo ""
    echo "4. Optional TON Blockchain:"
    echo "   • Generate or import TON wallet"
    echo "   • Add mnemonic to TON_WALLET_MNEMONIC"
    echo ""
    echo "5. Optional JIRA Integration:"
    echo "   • Get API token from Atlassian"
    echo "   • Configure JIRA_* variables"
    echo ""
    echo "6. Test the setup:"
    echo "   npm run dev"
    echo ""
    echo "📚 Documentation:"
    echo "   • README.md - Project overview"
    echo "   • docs/CLAUDE_DESKTOP_SETUP.md - MCP setup"
    echo "   • docs/DEPLOYMENT.md - Production deployment"
    echo "   • CLAUDE.md - Development guidelines"
    echo ""
}

main() {
    print_banner
    
    check_dependencies
    setup_environment
    install_dependencies
    build_application
    setup_claude_desktop
    run_tests
    
    show_next_steps
    
    # Ask if user wants to start development server
    start_development
}

# Handle interruption
trap 'log_error "Setup interrupted"; exit 1' INT TERM

# Show help
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Usage: $0 [options]"
    echo ""
    echo "Quick start setup for Telegram Claude MCP Connector"
    echo ""
    echo "This script will:"
    echo "  • Check system dependencies"
    echo "  • Install Node.js packages"
    echo "  • Create environment configuration"
    echo "  • Set up Claude Desktop integration"
    echo "  • Run initial tests"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo ""
    exit 0
fi

# Run main setup
main "$@"