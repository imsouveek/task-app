const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Task = require('../src/models/tasks');

/* Setting up user and db for testing */
const {
  userOneObj,
  userTwoObj,
  taskOneObj,
  taskTwoObj,
  setupDb
} = require('./fixtures/setup');

/*
  Script to run before each test case execution. Here we are resetting the database to
  have a single user, especially to ensure that tests e.g., create to pass each time
*/
beforeEach(setupDb);

/* Verify create task */
test('Create Task', async () => {
  /* Post request for creating task */
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send({
      description: "Task Four",
      completed: false
    })
    .expect(201);

  /* Verify task actually created in db */
  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();

  /* Verify response format */
  expect(response.body).toMatchObject({
    completed: task.completed,
    _id: task._id.toString(),
    description: task.description,
    owner: task.owner.toString()
  });
});

/* Verify create task fails without auth */
test('Create Task fails without auth', async () => {
  /* Post request for creating task */
  const response = await request(app)
    .post('/tasks')
    .send({
      description: "Task Four",
      completed: false
    })
    .expect(401);
});

/* Verify get all tasks */
test('Get All Tasks', async() => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
});

/* Verify create task fails without auth */
test('Get all Tasks fails without auth', async () => {
  /* Post request for creating task */
  const response = await request(app)
    .get('/tasks')
    .send()
    .expect(401);
});

/* Verify route filters for get all tasks - completed */
test('Get All Tasks with completed filter', async() => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .query({
      completed: 'true'
    })
    .expect(200);

  expect(response.body.length).toBe(1);
  expect(response.body[0]._id).toBe(taskTwoObj._id.toString());
});

/* Verify route filters for get all tasks - limit */
test('Get All Tasks with limit filter', async() => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .query({
      limit: '1'
    })
    .expect(200);

  expect(response.body.length).toBe(1);
});

/* Verify route filters for get all tasks - sort and skip */
test('Get All Tasks with sort and skip filter', async() => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .query({
      sortBy: 'completed_desc',
      skip: 1
    })
    .send()
    .expect(200);

  expect(response.body.length).toBe(1);
  expect(response.body[0]._id).toBe(taskOneObj._id.toString());

});

/* Verify get one task */
test('Get one task by id', async() => {
  const response = await request(app)
    .get(`/tasks/${taskOneObj._id.toString()}`)
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send()
    .expect(200);

  /* Match response against task object */
  expect(response.body).toMatchObject({
    _id: taskOneObj._id.toString(),
    description: taskOneObj.description,
    completed: taskOneObj.completed
  });

});

/* Verify can't get tasks of other users by id */
test('Cannot get task of other by id', async() => {
  await request(app)
    .get(`/tasks/${taskOneObj._id.toString()}`)
    .set('Authorization', `Bearer ${userTwoObj.tokens[0].token}`)
    .send()
    .expect(404);

});

/* Verify get task by id fails without auth */
test('Get One Task by Id fails without auth', async () => {
  /* Post request for creating task */
  const response = await request(app)
  .get(`/tasks/${taskOneObj._id.toString()}`)
  .send()
    .expect(401);
});

/* Verify update tasks */
test('Update task', async () => {
  await request(app)
    .patch(`/tasks/${taskOneObj._id.toString()}`)
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send({
      completed: 'true'
    })
    .expect(200);

  /* Check update saved in db */
  const task = await Task.findById(taskOneObj._id.toString());
  expect(task.completed).toBe(true);

});

/* Verify update task fails without auth */
test('Update Task by Id fails without auth', async () => {
  /* Post request for creating task */
  const response = await request(app)
    .patch(`/tasks/${taskOneObj._id.toString()}`)
    .send({
      completed: 'true'
    })
    .expect(401);
});

/* Verify can't update restricted fields */
test('Should not be able to update task id', async () => {
  await request(app)
    .patch(`/tasks/${taskOneObj._id.toString()}`)
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send({
      _id: new mongoose.Types.ObjectId()
    })
    .expect(400);
});

/* Verify can't update fields for other user */
test('Should not be able to update task for other user', async () => {
  await request(app)
    .patch(`/tasks/${taskOneObj._id.toString()}`)
    .set('Authorization', `Bearer ${userTwoObj.tokens[0].token}`)
    .send({
      completed: 'true'
    })
    .expect(404);
});

/* Verify delete */
test('Test delete task', async () => {
  await request(app)
    .delete(`/tasks/${taskOneObj._id.toString()}`)
    .set('Authorization', `Bearer ${userOneObj.tokens[0].token}`)
    .send()
    .expect(200);

  /* Check that task does not exist */
  const task = await Task.findById(taskOneObj._id.toString());
  expect(task).toBeNull()
});

/* Verify delete task fails without auth */
test('Delete Task by Id fails without auth', async () => {
  /* Post request for creating task */
  const response = await request(app)
    .delete(`/tasks/${taskOneObj._id.toString()}`)
    .send()
    .expect(401);
});

/* Verify delete */
test('Test delete task should fail for other user', async () => {
  await request(app)
    .delete(`/tasks/${taskOneObj._id.toString()}`)
    .set('Authorization', `Bearer ${userTwoObj.tokens[0].token}`)
    .send()
    .expect(404);

});