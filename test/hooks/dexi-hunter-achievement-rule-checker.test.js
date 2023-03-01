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


describe('\'dexi achievement-rule-checker\' hook', () => {

  let app;
  const user_id = 'TestUser';

  beforeEach(async () => {
    app = feathers();

    app.set('rules', require('../../src/rule-parser')(path.join(__dirname, '..', 'config', 'dexi-hunter-minimal.yml')));
    app.configure(configuration());
    app.configure(require('../../src/mongoose.js'));

    await cleanDatabase(app);
    app.configure(services);

  });

  it('gives achievement after 1 KM Walked', async () => {
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');

    await utils.assertAchievement(app, user_id, 'KMWalked', 1);
  });
  it.only('gives no achievement after 1 KM Walked - not eligible', async () => {
    await utils.createEvent(app, user_id, 'KMWalkedCompleted', {eligible: 0});
    await utils.assertXP(app, user_id, 'walked', 0);
  });
  it('gives achievement after 3 KM Walked', async () => {
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');

    await utils.assertAchievement(app, user_id, '3KMWalked', 1);
  });
  it('gives achievement after 5 KM Walked', async () => {
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.assertAchievement(app, user_id, '3KMWalked', 1);
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');

    await utils.assertAchievement(app, user_id, '5KMWalked', 1);
  });
  it('gives status achievement after 10 KM Walked and Bounty collected', async () => {
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'BountyCollected');
    await utils.assertAchievement(app, user_id, 'CommonStatus', 1);

    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'BountyCollected');
    await utils.assertAchievement(app, user_id, 'UncommonStatus', 1);

    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'BountyCollected');
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'BountyCollected');

    await utils.assertAchievement(app, user_id, 'RareStatus', 1);

    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'BountyCollected');
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'BountyCollected');

    await utils.assertAchievement(app, user_id, 'EpicStatus', 1);
    /*

    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'BountyCollected');
    await utils.createEvent(app, user_id, 'KMWalkedCompleted');
    await utils.createEvent(app, user_id, 'BountyCollected');

    await utils.assertAchievement(app, user_id, 'LegendaryStatus', 1);
    */
  }).timeout(120000);
  /*it('gives an achievement after other achievement', async () => {
    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, 'AchievementRequiringOtherAchievement', 1);
  });

  it('gives achievement requiring 2 Types of XP', async () => {
    await utils.createEvent(app, user_id, 'EventGiving2XPTypes');

    await utils.assertAchievement(app, user_id, 'AchievementRequiring2XPTypes', 1);
  });

  it('gives achievement requiring event', async () => {
    await utils.createEvent(app, user_id, 'EventGrantingAchievement');

    await utils.assertAchievement(app, user_id, 'AchievementRequiringEvent', 1);
  });

  it('gives AnyOf Achievement', async () => {
    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, 'AnyOfAchievement', 1);
  });

  it('gives AnyOf Conditions Achievement', async () => {
    await utils.createEvent(app, user_id, 'ParameterEvent', {'x': 1, 'y': 3});

    await utils.assertAchievement(app, user_id, 'AnyOfConditionsAchievement', 1);
  });


  it('replaces an achievement', async () => {
    const achievement_name = 'AchievementBeingReplaced';

    await utils.createEvent(app, user_id, 'EventGrantingAchievement');
    await utils.createEvent(app, user_id, 'EventGrantingAchievement');

    await utils.assertAchievement(app, user_id, achievement_name, 2);

    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, 'AchievementReplacingOther', 1);

    await utils.assertAchievement(app, user_id, achievement_name, 0, 2);
  });

  [
    'MaxAwarded',
    'MaxAwardedTotal'
  ].forEach(awardedType => {
    it(`gives achievement ${awardedType} times`, async () => {
      const achievementName = `AchievementCanBe${awardedType}Twice`;

      await utils.createEvent(app, user_id, 'EventGiving10XP');

      await utils.assertAchievement(app, user_id, achievementName, 1);

      await utils.createEvent(app, user_id, 'EventGiving10XP');

      await utils.assertAchievement(app, user_id, achievementName, 2);

      await utils.createEvent(app, user_id, 'EventGiving10XP');

      await utils.assertAchievement(app, user_id, achievementName, 2);
    });

    it(`gives achievement ${awardedType} times at once`, async () => {
      const achievementName = `AchievementCanBe${awardedType}TwiceAtOnce`;

      await utils.createEvent(app, user_id, 'EventGiving10XP');

      await utils.assertAchievement(app, user_id, achievementName, 2);

      await utils.createEvent(app, user_id, 'EventGiving10XP');

      await utils.assertAchievement(app, user_id, achievementName, 2);
    });
  });

  it('gives chained achievements', async () => {
    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, '10XPAchievement', 1);
    await utils.assertAchievement(app, user_id, 'ChainedAchievement', 1);
  });

  it('Gives achievement with logical amount >', async () => {
    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, 'MoreAchievement', 0);
    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, 'MoreAchievement', 1);
  });

  it('Gives achievement with logical amount ==', async () => {
    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, 'EqualAchievementFailing', 0);
    await utils.assertAchievement(app, user_id, 'EqualAchievementSucceeding', 1);
  });

  it('Gives achievement with logical amount !=', async () => {
    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, 'NotEqualAchievement', 0);

    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, 'NotEqualAchievement', 1);
  });

  it('Gives achievement with logical amount </<=', async () => {
    await utils.createEvent(app, user_id, 'EventGiving10XP');

    await utils.assertAchievement(app, user_id, 'LessAchievement', 0);
    await utils.assertAchievement(app, user_id, 'UnderAchieverAchievement', 1);
  });*/
});
