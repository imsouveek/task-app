const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;

const connectionURL = 'mongodb://127.0.0.1:27017';
const dbName = 'task-app';

mongoClient.connect(
  connectionURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  (error, client) => {
    if (error) {
      console.log('Connection Failed');
      return;
    }
    const db = client.db(dbName);
    // db.collection('users').insertOne({
    //   name: 'Souveek',
    //   age: 34
    // }, (err, result) => {
    //   if (err) {
    //     console.log('Unable to insert user');
    //     return;
    //   }
    //   console.log(result.ops);
    // })
    // db.collection('users').insertMany([{
    //   name: 'Test',
    //   age: 4
    // }, {
    //   name: 'John Doe',
    //   age: 40
    // }], (err, result) => {
    //   if (err) {
    //     console.log('Unable to insert many users');
    //     return;
    //   }
    //   console.log(result.ops);
    // })

    db.collection('tasks').insertMany([{
      description: 'Get phone',
      completed: false
    }, {
      description: 'Give clothes for ironing',
      completed: false
    }, {
      description: 'Have breakfast',
      completed: true
    }],(err, result) => {
      if (err) {
        console.log('Could not insert many tasks');
        return;
      }
      console.log(result.ops);
    })
  }
);