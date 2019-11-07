const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/users');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Setup reference object
const userId = new mongoose.Types.ObjectId();
const userObj = {
  _id: userId,
  name: 'Samragni',
  email: 'samragnir@gmail.com',
  password: 'TEST123!',
  age: 30,
  tokens: [{
    token: jwt.sign({ _id: userId}, process.env.TOKEN_SALT)
  }]
};

/*
  Script to run before each test case execution. Here we are resetting the database to
  have a single user, especially to ensure that tests e.g., create to pass each time
*/
beforeEach( async ()=> {
  await User.deleteMany();
  await new User(userObj).save();
});

/*
  Verify environment variables before test start
*/
test('Test setup', () => {
  expect(process.env.DB_NAME).toBe('task-api-test');
});

/*
  Test create new user. Need to test
  1. Response status is 201
  2. User is actually created in database
  3. Password is not plain text
  4. Response object structure
*/
test('Create New User', async () => {
  /* 1. Response status is 201 */
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Souveek',
      email: 'imsouveek@gmail.com',
      password: 'taest123'
    })
    .expect(201);

  /* 2. User is actually created in teh database */
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  /* 3. Password should not be plain text */
  expect(user.password).not.toBe('taest123');

  /* 4. Response object structure */
  expect(response.body).toMatchObject({
    user: {
      name: 'Souveek',
      email: 'imsouveek@gmail.com'
    },
    token: user.tokens[0].token
  });

});

/* Test fail of duplicate user creation */
test('User should have unique email', async() => {
  await request(app)
    .post('/users')
    .send({
      name: 'Samragni',
      email: 'samragnir@gmail.com',
      password: 'TEST123!'
    })
    .expect(400);
});

/*
  Test login user. Need to verify
  1. Response status
  2. We get user and token in response
  3. Token is added to user in db
*/
test('Login existing user', async () => {
  /* 1. Response status */
  const response = await request(app)
    .post('/users/login')
    .send({
      email: userObj.email,
      password: userObj.password
    })
    .expect(200);

    /* 2. Verify that we have user and token in response */
    expect(response.body.token).not.toBeUndefined();
    expect(response.body).toMatchObject({
      user: {
        name: userObj.name,
        email: userObj.email,
      }
    });

    /* 3. Toekn is added to user in db */
    const user = await User.findById(userId);
    expect(user.tokens[1].token).toBe(response.body.token);
});

/* Test failure to login non-existing user */
test('Donot login non-existing user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: 'asdfg@pq.rst',
      password: userObj.password
    })
    .expect(400);
});

/* Test failure to login without exact password */
test('Donot login without correct password', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: userObj.email,
      password: "Puchu@12"
    })
    .expect(400);
});

/* Test getting my user profile */
test('Get my user detail', async () => {
  await request(app)
    .get('/users')
    .set('Authorization', `Bearer ${userObj.tokens[0].token}`)
    .send()
    .expect(200);
});

/* Verify that getting user profile requires authentication */
test('Cannot get my user details without authentication', async () => {
  await request(app)
    .get('/users')
    .send()
    .expect(401);
});

/* Delete my user */
test('Delete my user', async() => {
  await request(app)
    .delete('/users')
    .set('Authorization', `Bearer ${userObj.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userId);
  expect(user).toBeNull();
});

/* Verify that delete requires authentication */
test('Cannot delete my user without authentication', async() => {
  await request(app)
    .delete('/users')
    .send()
    .expect(401);
});