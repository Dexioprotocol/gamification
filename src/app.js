const fs = require('fs');
const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
//const logger = require('winston');
const logger = require('./middleware/logger');

const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');
const mongoose = require('./mongoose');

const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));
// Host Swagger docs
const swaggerDocument = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '..', 'docs', 'swagger.yml'), 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Set up Plugins and providers
app.configure(express.rest());


app.configure(mongoose);

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

app.set('rules', require('./rule-parser')(path.join(__dirname, '..', 'config', 'dexi-dragons-minimal.yml')));

module.exports = app;
