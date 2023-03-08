const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
}, { versionKey: false });

const exerciseSchema = mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  userid: String,
}, { versionKey: false });

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/**
You can POST to /api/users with form data username to create a new user.
The returned response from POST /api/users with form data username will be an object with username and _id properties.
*/
app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  /** 
  Creates a new user if the username doesn't exist in the DB.
  If the username exists, the returns it
  */
  const foundUser = await User.findOne({ username: username });
  if (foundUser) {
    return res.json({
      username: foundUser.username,
      _id: foundUser._id,
    });
  }
  const user = await User.create({
    username: username,
  });
  return res.json(user);
});

/** 
You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date.
If no date is supplied, the current date will be used.
*/
app.post('/api/users/:_id/exercises', async (req, res) => {
  const _id = req.body[':_id'];
  const foundUser = await User.findOne({ _id: _id });
  if (!foundUser) {
    return res.json({ error: "This user doesn't exist!" });
  }
  const date = (req.body.date !== undefined ? new Date(req.body.date) : new Date());
  const exercise = await Exercise.create({
    userid: _id,
    username: foundUser.username,
    date: date.toDateString(),
    duration: req.body.duration,
    description: req.body.description,
  });
  res.send(exercise);
});

/** 
You can make a GET request to /api/users to get a list of all users.
The GET request to /api/users returns an array.
Waiting:Each element in the array returned from GET /api/users is an object literal containing a user's username and _id.
*/
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  const retdata = users.map((user) => {
    return {
      username: user.username,
      _id: user._id,
    };
  });
  res.send(retdata);
});

/** 
You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
A request to a user's log GET /api/users/:_id/logs returns a user object with a count property representing the number of exercises that belong to that user.
A GET request to /api/users/:_id/logs will return the user object with a log array of all the exercises added.
Each item in the log array that is returned from GET /api/users/:_id/logs is an object that should have a description, duration, and date properties.
The description property of any object in the log array that is returned from GET /api/users/:_id/logs should be a string.
The duration property of any object in the log array that is returned from GET /api/users/:_id/logs should be a number.
The date property of any object in the log array that is returned from GET /api/users/:_id/logs should be a string. Use the dateString format of the Date API.
You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.

{
  username: "fcc_test",
  count: 1,
  _id: "5fb5853f734231456ccb3b05",
  log: [{
    description: "test",
    duration: 60,
    date: "Mon Jan 01 1990",
  }]
}
 */
app.get('/api/users/:_id/logs', async (req, res) => {
  const user_id = req.params._id;
  const { from, to, limit } = req.query;
  const foundUser = await User.findOne({ _id: user_id });
  if (!foundUser) {
    return res.json({ error: "This user doesn't exist!" });
  }
  let exercises = await Exercise.find({ user_id })
  exercises = exercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    }
  });
  res.send({
    username: foundUser.username,
    count: exercises.length,
    _id: user_id,
    log: exercises,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
