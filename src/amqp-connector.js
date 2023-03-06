//const logger = require('winston');
const logger = require('./middleware/logger');

const amqp = require('amqplib');

class AmqpConnector {
  constructor(host, app) {
    this.host = host;
    this.app = app;
  }

  async connect() {
    while (!this.connection) {
      try {
        this.connection = await amqp.connect('amqp://' + this.host);
        logger.info('RabbitMQ connected');
        process.once('SIGINT', () => {
          this.connection.close();
        });
        this.channel = await this.connection.createChannel();
        logger.info('RabbitMQ channel ready');
      } catch (error) {
        logger.warn(error);
        logger.log('RabbitMQ connection failed. Reconnecting in 1 second ...');
        var waitTill = new Date(new Date().getTime() + 1000);
        while (waitTill > new Date()) {
          // busy waiting
        }
      }
    }
  }

  async sendToQueue(queue, message) {
    try {
      await this.channel.assertQueue(queue, {
        durable: true
      });
      logger.info('sendToQueue: ', message);
      await this.channel.sendToQueue(queue, Buffer.from(message));
    } catch (error) {
      logger.warn(error);
    }
  }

  async sendToExchange(exchange, routingKey, message) {
    try {
      await this.channel.assertExchange(exchange, 'direct', {
        durable: true
      });
      logger.info('sendToExchange: ', message);
      await this.channel.publish(exchange, routingKey, Buffer.from(message));
    } catch (error) {
      logger.warn(error);
    }
  }

  async receiveFromQueue(queue) {
    try {
      await this.channel.assertQueue(queue, {
        durable: true
      });
      this.channel.consume(queue,
        (msg) => {
          const content = JSON.parse(msg.content);
          const data = JSON.parse(content.data);
          logger.info('JSON receiveFromQueue', {queue, data});

          const message = {
            'name': data.name,
            'user_id': data.user_id
          };
          console.log(message);
          this.app.service('events').create(message);
        }, {
          noAck: true
        }
      );
    } catch (error) {
      logger.warn(error);
    }
  }
}

module.exports = AmqpConnector;
