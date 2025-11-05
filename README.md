# ONDC Integration Backend

Complete ONDC (Open Network for Digital Commerce) integration backend implementation.

## Features

- ✅ Complete ONDC API implementation (search, select, init, confirm)
- ✅ Post-order APIs (status, cancel, update, track)
- ✅ Request signing with Ed25519 and Blake2b
- ✅ Request verification middleware
- ✅ Registry lookup with caching
- ✅ Callback handling
- ✅ MongoDB integration for order management
- ✅ Comprehensive logging
- ✅ Error handling

## Project Structure

```
├── app.js                      # Main application
├── config/
│   └── config.js              # Configuration management
├── utils/
│   ├── crypto.js              # Cryptographic utilities
│   ├── authorization.js       # Auth header management
│   └── logger.js              # Logging utility
├── services/
│   ├── ondcService.js         # ONDC API service
│   ├── registryService.js     # Registry lookup
│   └── orderService.js        # Order management
├── controllers/
│   └── callbackController.js  # Callback handlers
├── middleware/
│   └── verification.js        # Request verification
├── models/
│   ├── Order.js               # Order model
│   └── Transaction.js         # Transaction model
├── routes/
│   └── ondc.js                # ONDC routes
├── database/
│   └── connection.js          # Database connection
├── tests/
│   └── ondc.test.js           # Test cases
├── .env.example               # Environment variables template
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your ONDC credentials

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Environment Variables

See `.env.example` for all required environment variables.

## API Endpoints

### Registration
- `POST /on_subscribe` - Handle ONDC subscription challenge
- `GET /ondc-site-verification.html` - Site verification page

### Buyer APIs (Outgoing)
- `POST /ondc/buyer/search` - Search for products
- `POST /ondc/buyer/select` - Select items and get quote
- `POST /ondc/buyer/init` - Initialize order
- `POST /ondc/buyer/confirm` - Confirm order
- `POST /ondc/buyer/status` - Check order status
- `POST /ondc/buyer/cancel` - Cancel order
- `POST /ondc/buyer/update` - Update order
- `POST /ondc/buyer/track` - Track order

### Callback APIs (Incoming)
- `POST /ondc/on_search` - Receive catalog
- `POST /ondc/on_select` - Receive quote
- `POST /ondc/on_init` - Receive payment terms
- `POST /ondc/on_confirm` - Receive confirmed order
- `POST /ondc/on_status` - Receive status update
- `POST /ondc/on_cancel` - Receive cancellation confirmation
- `POST /ondc/on_update` - Receive update confirmation
- `POST /ondc/on_track` - Receive tracking info

## Testing

Run tests:
```bash
npm test
```

## Deployment

1. Set `NODE_ENV=production` in environment
2. Update all production URLs in `.env`
3. Ensure HTTPS is enabled
4. Set up proper logging and monitoring
5. Configure database for production

## Security Notes

- Never commit `.env` file
- Store private keys securely
- Use HTTPS in production
- Implement rate limiting
- Monitor for suspicious activity

## Support

For issues and questions:
- Check ONDC documentation
- Review logs in `./logs` directory
- Contact ONDC support

## License

MIT