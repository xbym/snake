## 6.2 API Integration

This section provides comprehensive documentation for integrating with the Neural Snake AI system's APIs, including endpoints, authentication, and usage examples.

### 6.2.1 API Overview

1. **Base Configuration**
   ```javascript
   // api-config.js
   const apiConfig = {
       baseUrl: 'https://api.neuralsnake.ai/v1',
       version: '1.0.0',
       timeout: 30000,
       rateLimit: {
           window: 60000,
           max: 100
       }
   };
   ```

2. **Authentication**
   ```javascript
   // auth-example.js
   const authenticate = async (apiKey) => {
       const response = await fetch(`${apiConfig.baseUrl}/auth`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'X-API-Key': apiKey
           },
           body: JSON.stringify({
               grant_type: 'client_credentials'
           })
       });
       
       return response.json();
   };
   ```

### 6.2.2 Game API Endpoints

1. **Game Session Management**
   ```javascript
   class GameAPI {
       // Create new game session
       async createSession(config) {
           return await this.post('/sessions', {
               mode: config.mode,
               difficulty: config.difficulty,
               neuralNetwork: config.networkId
           });
       }

       // Update game state
       async updateState(sessionId, state) {
           return await this.put(`/sessions/${sessionId}`, {
               score: state.score,
               position: state.position,
               direction: state.direction
           });
       }

       // End game session
       async endSession(sessionId, results) {
           return await this.post(`/sessions/${sessionId}/end`, {
               finalScore: results.score,
               duration: results.duration,
               performance: results.metrics
           });
       }
   }
   ```

2. **Neural Network API**
   ```javascript
   class NeuralNetworkAPI {
       // Train network
       async trainNetwork(networkId, trainingData) {
           return await this.post(`/networks/${networkId}/train`, {
               data: trainingData,
               epochs: 100,
               batchSize: 32
           });
       }

       // Get network state
       async getNetworkState(networkId) {
           return await this.get(`/networks/${networkId}/state`);
       }

       // Update network weights
       async updateWeights(networkId, weights) {
           return await this.put(`/networks/${networkId}/weights`, {
               weights: weights,
               timestamp: Date.now()
           });
       }
   }
   ```

### 6.2.3 Data Models

1. **Request/Response Models**
   ```typescript
   // models.ts
   interface GameSession {
       id: string;
       userId: string;
       startTime: number;
       mode: GameMode;
       status: SessionStatus;
       score: number;
       moves: Move[];
   }

   interface NeuralNetwork {
       id: string;
       userId: string;
       architecture: NetworkArchitecture;
       weights: WeightMatrix[];
       performance: PerformanceMetrics;
   }

   interface APIResponse<T> {
       success: boolean;
       data?: T;
       error?: APIError;
       timestamp: number;
   }
   ```

2. **Validation Schemas**
   ```javascript
   // validation-schemas.js
   const schemas = {
       session: {
           type: 'object',
           required: ['mode', 'difficulty'],
           properties: {
               mode: {
                   type: 'string',
                   enum: ['training', 'competition']
               },
               difficulty: {
                   type: 'number',
                   minimum: 1,
                   maximum: 10
               }
           }
       },
       network: {
           type: 'object',
           required: ['architecture', 'weights'],
           properties: {
               architecture: {
                   type: 'object',
                   required: ['layers']
               },
               weights: {
                   type: 'array',
                   items: {
                       type: 'array'
                   }
               }
           }
       }
   };
   ```

### 6.2.4 WebSocket Integration

1. **Real-time Updates**
   ```javascript
   class WebSocketClient {
       // Initialize connection
       connect(sessionId) {
           this.ws = new WebSocket(`${apiConfig.wsUrl}/game/${sessionId}`);
           
           this.ws.onmessage = (event) => {
               const update = JSON.parse(event.data);
               this.handleUpdate(update);
           };
       }

       // Send game update
       sendUpdate(data) {
           if (this.ws.readyState === WebSocket.OPEN) {
               this.ws.send(JSON.stringify({
                   type: 'GAME_UPDATE',
                   data: data,
                   timestamp: Date.now()
               }));
           }
       }

       // Handle incoming updates
       handleUpdate(update) {
           switch (update.type) {
               case 'STATE_UPDATE':
                   this.updateGameState(update.data);
                   break;
               case 'NEURAL_UPDATE':
                   this.updateNeuralNetwork(update.data);
                   break;
           }
       }
   }
   ```

### 6.2.5 Error Handling

1. **Error Types**
   ```javascript
   // error-types.js
   class APIError extends Error {
       constructor(code, message, details) {
           super(message);
           this.code = code;
           this.details = details;
       }

       static fromResponse(response) {
           return new APIError(
               response.status,
               response.statusText,
               response.data
           );
       }
   }

   const ErrorCodes = {
       INVALID_REQUEST: 400,
       UNAUTHORIZED: 401,
       FORBIDDEN: 403,
       NOT_FOUND: 404,
       RATE_LIMITED: 429,
       SERVER_ERROR: 500
   };
   ```

2. **Error Handling Middleware**
   ```javascript
   // error-middleware.js
   const errorHandler = async (error, request, response, next) => {
       console.error('API Error:', error);

       if (error instanceof APIError) {
           return response.status(error.code).json({
               success: false,
               error: {
                   code: error.code,
                   message: error.message,
                   details: error.details
               }
           });
       }

       return response.status(500).json({
           success: false,
           error: {
               code: 500,
               message: 'Internal Server Error'
           }
       });
   };
   ```

### 6.2.6 Rate Limiting

```javascript
// rate-limiter.js
class RateLimiter {
    constructor(config) {
        this.windowMs = config.window;
        this.max = config.max;
        this.store = new Map();
    }

    // Check rate limit
    async checkLimit(key) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        // Clean old records
        this.store.forEach((value, k) => {
            if (value.timestamp < windowStart) {
                this.store.delete(k);
            }
        });
        
        // Check current usage
        const current = this.store.get(key) || { count: 0, timestamp: now };
        if (current.count >= this.max) {
            throw new APIError(429, 'Rate limit exceeded');
        }
        
        // Update usage
        this.store.set(key, {
            count: current.count + 1,
            timestamp: now
        });
    }
}
```

These API integration guidelines provide a comprehensive framework for interacting with the Neural Snake AI system programmatically. 