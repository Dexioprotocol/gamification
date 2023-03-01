const path = require('path');
const feathers = require('@feathersjs/feathers');
const services = require('../../src/services');
const configuration = require('@feathersjs/configuration');
const utils = require('../test-utils');

async function cleanDatabase(app) {
  await require('../../src/models/achievement.model.js')(app).remove({});
  await require('../../src/models/event.model.js')(app).remove({});
  await require('../../src/models/xp.model.js')(app).remove({});
}

jest.setTimeout(10000);
describe.only('\'dexi achievement-rule-checker\' hook', () => {

  let app;
  const user_id = 'TestUser';

  beforeEach(async () => {
    app = feathers();

    app.set('rules', require('../../src/rule-parser')(path.join(__dirname, '..', 'config', 'dexi-dragons-minimal.yml')));
    app.configure(configuration());
    app.configure(require('../../src/mongoose.js'));

    await cleanDatabase(app);
    app.configure(services);

  });

  it('gives achievement after 1 match', async () => {
    await utils.createEvent(app, user_id, 'MatchCompleted');
    await utils.assertXP(app, user_id, 'matches', 1);

  });
  it('gives no achievement after 1 Match - not eligible', async () => {
    await utils.createEvent(app, user_id, 'MatchCompleted', {eligible: 0});
    await utils.assertXP(app, user_id, 'matches', 1);
  });
  it('gives achievement after 2 Matches', async () => {
    await utils.createEvent(app, user_id, 'MatchCompleted');
    await utils.createEvent(app, user_id, 'MatchCompleted');
    await utils.createEvent(app, user_id, 'MatchCompleted');

    await utils.assertAchievement(app, user_id, 'Played2Matches', 1);
  });
});
