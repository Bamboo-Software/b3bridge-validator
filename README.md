# B3Bridge Validator

A blockchain bridge validator service built with NestJS for validating cross-chain transactions between Ethereum and Sei networks.

## Description

B3Bridge Validator is a Node.js application that serves as a validator service for cross-chain bridge operations. It monitors and validates transactions between Ethereum and Sei blockchains, ensuring the integrity and security of cross-chain transfers.

## Features

- **Multi-chain Support**: Validates transactions on both Ethereum and Sei networks
- **Smart Contract Integration**: Interacts with bridge contracts on both chains
- **Scheduled Validation**: Automated validation processes
- **RESTful API**: Provides endpoints for bridge operations
- **Docker Support**: Containerized deployment
- **TypeScript**: Full TypeScript support with strict typing

## Requirements

### System Requirements
- **Node.js**: Version 22 or higher
- **Yarn**: Package manager
- **Docker**: For containerized deployment (optional)

### Blockchain Requirements
- **Ethereum Network**: Access to Ethereum RPC endpoint
- **Sei Network**: Access to Sei RPC endpoint
- **Private Keys**: Validator private keys for both networks
- **Contract Addresses**: Bridge contract addresses on both chains

## Project Structure

```
b3bridge-validator/
├── data/                          # Static data files
│   └── json/                      # Contract ABIs
│       ├── ethChainContractABI.json
│       ├── ethMainnetABI.json
│       ├── seiChainContractABI.json
│       └── seiMainnetABI.json
├── src/
│   ├── config/                    # Configuration files
│   │   ├── app.ts                 # Application configuration
│   │   ├── chain.ts               # Blockchain configurations
│   │   ├── log.ts                 # Logging configuration
│   │   ├── schedule.ts            # Scheduling configuration
│   │   └── validator.ts           # Validator configurations
│   ├── decorators/                # Custom decorators
│   ├── exceptions/                # Custom exceptions
│   ├── filters/                   # Exception filters
│   ├── interceptors/              # Request/response interceptors
│   ├── modules/                   # Feature modules
│   │   ├── core/                  # Core functionality
│   │   ├── eth/                   # Ethereum-specific logic
│   │   └── sei/                   # Sei-specific logic
│   └── utils/                     # Utility functions
├── test/                          # Test files
├── docker-compose.yml             # Docker Compose configuration
├── Dockerfile                     # Docker configuration
└── package.json                   # Dependencies and scripts
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Application Configuration
```env
# Application
HOST=127.0.0.1
PORT=3000
APP_URL=http://localhost:3000
NODE_ENV=development
APP_PREFIX_PATH=/api

# Logging
LOG_LEVEL=debug
```

### Ethereum Configuration
```env
# Ethereum Chain
ETH_CHAIN_ID=1
ETH_CHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETH_CHAIN_WS_URL=wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID
ETH_CHAIN_PRIVATE_KEY=your_ethereum_private_key
ETH_CHAIN_CONTRACT_ADDRESS=your_ethereum_bridge_contract_address

# Ethereum Token Addresses
ETH_TOKEN_ADDRESS_ETH=0x0000000000000000000000000000000000000000
ETH_TOKEN_ADDRESS_USDC=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# Ethereum Validator
ETH_VALIDATOR_PRIVATE_KEY=your_ethereum_validator_private_key
```

### Sei Configuration
```env
# Sei Chain
SEI_CHAIN_ID=your_sei_chain_id
SEI_CHAIN_RPC_URL=https://your_sei_rpc_endpoint
SEI_CHAIN_WS_URL=wss://your_sei_ws_endpoint
SEI_CHAIN_PRIVATE_KEY=your_sei_private_key
SEI_CHAIN_CONTRACT_ADDRESS=your_sei_bridge_contract_address

# Sei Token Addresses
SEI_TOKEN_ADDRESS_W_ETH=0xe7Fd15568E498c7e62E8397597c23fA6e008189C
SEI_TOKEN_ADDRESS_W_USDC=0x12CD8503ECBd48B4c3F920c48565a56c328207E4

# Sei Validator
SEI_VALIDATOR_PRIVATE_KEY=your_sei_validator_private_key
```

## Installation

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd b3bridge-validator
```

### Step 2: Install Dependencies
```bash
yarn install
```

### Step 3: Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

### Step 4: Build the Project
```bash
yarn build
```

### Step 5: Run the Application

#### Development Mode
```bash
yarn start:dev
```

#### Production Mode
```bash
yarn start:prod
```

#### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

## Available Scripts

```bash
# Development
yarn start:dev          # Start in development mode with hot reload
yarn dev                # Alias for start:dev

# Production
yarn build              # Build the application
yarn start              # Start the application
yarn start:prod         # Start in production mode

# Testing
yarn test               # Run unit tests
yarn test:watch         # Run tests in watch mode
yarn test:cov           # Run tests with coverage
yarn test:e2e           # Run end-to-end tests

# Code Quality
yarn lint               # Run ESLint
yarn lint:fix           # Fix ESLint issues
yarn format             # Format code with Prettier
```

## API Documentation

Once the application is running, you can access the API documentation at:
- **Swagger UI**: `http://localhost:3000/api/docs`
- **API Base URL**: `http://localhost:3000/api`

## Testing

### Unit Tests
```bash
yarn test
```

### End-to-End Tests
```bash
yarn test:e2e
```

### Test Coverage
```bash
yarn test:cov
```

## Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# Stop services
docker-compose down
```

### Using Docker directly
```bash
# Build the image
docker build -t b3bridge-validator .

# Run the container
docker run -p 3000:3000 --env-file .env b3bridge-validator
```

## Development

### Code Style
This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks
- **Commitlint** for commit message validation

### Git Hooks
The project includes pre-commit hooks that automatically:
- Run ESLint on staged files
- Format code with Prettier
- Validate commit messages

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Kill the process or change PORT in .env
   ```

2. **Environment variables not loaded**
   - Ensure `.env` file exists in the root directory
   - Check that all required variables are set

3. **Docker build fails**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api/docs`
