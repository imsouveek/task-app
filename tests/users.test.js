const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/users');

/* Setting up user and db for testing */
const {
  userOneId,
  userOneObj,
  setupDb
} = require('./fixtures/setup');

/*
  Script to run before each test case execution. Here we are resetting the database to
  have a single user, especially to ensure that tests e.g., create to pass each time
*/
beforeEach(setupDb);

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
      email: userOneObj.email,
      password: userOneObj.password
    })
    .expect(200);

    /* 2. Verify that we have user and token in response */
    expect(response.body.token).not.toBeUndefined();
    expect(response.body).toMatchObject({
      user: {
        name: userOneObj.name,
        email: userOneObj.email,
      }
    });

    /* 3. Token is added to user in db */
    const user = await User.findById(userOneId);
    expect(user.tokens[2].token).toBe(response.body.token);
});

/* Test failure to login non-existing user */
test('Donot login non-existing user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: 'asdfg@pq.rst',
      password: userOneObj.password
    })
    .expect(400);

  /* Verify no new tokens added */
  const user = await User.findById(userOneId);
  expect(user.tokens.length).toBe(2);
});

/* Test failure to login without exact password */
test('Donot login without correct password', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: userOneObj.email,
      password: "Puchu@12"
    })
    .expect(400);

  /* Verify no new tokens added */
  const user = await User.findById(userOneId);
  expect(user.tokens.length).toBe(2);
});

/* Test getting my user profile */
test('Get my user detail', async () => {
  await request(app)
    .get('/users')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
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
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send()
    .expect(200);

  /* Should not be able to find user in database */
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

/* Verify that delete requires authentication */
test('Cannot delete my user without authentication', async() => {
  await request(app)
    .delete('/users')
    .send()
    .expect(401);

  /* Should be able to find user in database */
  const user = await User.findById(userOneId);
  expect(user).not.toBeNull();
});

/* Verify file upload */
test('Should be able to upload images', async() => {
  await request(app)
    .post('/users/avatar')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .attach('upload', 'tests/fixtures/IMG_2821.JPG')
    .expect(200);

  /* Verify that Buffer type is associated to avatar */
  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer))
});

/* Verify avatar upload requires authentication */
test('Should be able to upload images only with authentication', async() => {
  await request(app)
    .post('/users/avatar')
    .attach('upload', 'tests/fixtures/IMG_2821.JPG')
    .expect(401);

  /* Verify no avatar in db */
  const user = await User.findById(userOneId);
  expect(user.avatar).toBeUndefined();
});

/*
  Verify get avatar
  1. Should get 404 if no avatar
  2. Should get buffer with Content-Type image/png if avatar is present
*/
test('Check download avatars', async () => {
  /* Check for 404 if no avatar */
  await request(app)
    .get('/users/avatar')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send()
    .expect(404);

  /* Upload avatar from fixtures */
  await request(app)
    .post('/users/avatar')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .attach('upload', 'tests/fixtures/IMG_2821.JPG');

  /* Check success response for download when avatar is present */
  const response = await request(app)
    .get('/users/avatar')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send()
    .expect(200);

  /*
    Now we expect
    1. Content Type in finale to be 'image/png'
    2. Response should be of Buffer type
  */
  expect(response.header['content-type']).toBe('image/png');
  expect(response.body).toEqual(expect.any(Buffer));
});

/* Verify get avatar requires authentication */
test('Should be able to download images only with authentication', async() => {
  await request(app)
    .get('/users/avatar')
    .send()
    .expect(401);

});

/*
  Verify delete avatar
  1. Should get 400 if no avatar
  2. Should get buffer with Content-Type image/png if avatar is present
*/
test('Check delete avatars', async () => {
  /* Upload avatar from fixtures */
  await request(app)
    .post('/users/avatar')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .attach('upload', 'tests/fixtures/IMG_2821.JPG');

  /* Check success response for download when avatar is present */
  await request(app)
    .delete('/users/avatar')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send()
    .expect(200);

  /* Verify no avatar in db */
  const user = await User.findById(userOneId);
  expect(user.avatar).toBeUndefined();

});

/* Verify avatar delete requires authentication */
test('Should be able to delete images only with authentication', async() => {
  /* Upload avatar from fixtures */
  await request(app)
    .post('/users/avatar')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .attach('upload', 'tests/fixtures/IMG_2821.JPG');

  await request(app)
    .delete('/users/avatar')
    .send()
    .expect(401);

  /* Verify that Buffer type is associated to avatar */
  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer))

});

/* Verify update user */
test('Should update user', async() => {
  await request(app)
    .patch('/users')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send({
      "name": "Samragni Raychaudhuri"
    })
    .expect(200);

  /* Check name update */
  const user = await User.findById(userOneId);
  expect(user.name).toBe("Samragni Raychaudhuri");
});

/* Verify password is encrypted during update */
test('Should encrypt password during update', async() => {
  /* Save original password */
  const userPre = await User.findById(userOneId);
  const passwordPre = userPre.password;

  /* Send patch with updated password */
  await request(app)
    .patch('/users')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send({
      "password": "123!Test"
    })
    .expect(200);

  /* Check that password is changed and not plainText */
  const userPost = await User.findById(userOneId);
  expect(userPost.password).not.toBe(passwordPre);
  expect(userPost.password).not.toBe("123!Test")
});

/* Verify that _id cannot be updated */
test('Should not allow update to restricted fields', async () => {
  /* Get new mongoose object id */
  const newId = new mongoose.Types.ObjectId();

  await request(app)
    .patch('/users')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send({
      "_id": newId
    })
    .expect(400);

  /* Check no changes in Db */
  const user = await User.findById(userOneId);
  expect(user._id.toString()).toBe(userOneId.toString());
});

/* Verify that updating user profile requires authentication */
test('Cannot update my user details without authentication', async () => {
  await request(app)
    .patch('/users')
    .send({
      "password": "123!Test"
    })
    .expect(401);

});

/* Verify logout */
test('Logout should remove one token', async () => {
  await request(app)
  .get('/users/logout')
  .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
  .send()
  .expect(200);

  /* Verify second token is intact but is first token */
  const user = await User.findById(userOneId);
  expect(userOneObj.tokens[1].token).toBe(user.tokens[0].token);
});

/* Verify logout requires auth */
test('Logout requires authentication', async () => {
  await request(app)
  .get('/users/logout')
  .send()
  .expect(401);

  /* Verify all tokens are intact */
  const user = await User.findById(userOneId);
  expect(user.tokens.length).toBe(2);
});

/* Verify logoutAll */
test('LogoutAll should remove all token', async () => {
  await request(app)
  .get('/users/logoutAll')
  .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
  .send()
  .expect(200);

  /* Verify second token is intact but is first token */
  const user = await User.findById(userOneId);
  expect(user.tokens.length).toBe(0);
});

/* Verify logoutAll requires auth */
test('LogoutAll requires authentication', async () => {
  await request(app)
    .get('/users/logoutAll')
    .send()
    .expect(401);

  /* Verify all tokens are intact */
  const user = await User.findById(userOneId);
  expect(user.tokens.length).toBe(2);
});