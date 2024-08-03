
const express = require("express");
const bcrypt = require('bcryptjs');
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register/", async (request, response) => {
    const { id, username,password } = request.body;
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `SELECT * FROM users WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
        INSERT INTO 
            users (id,username, password) 
        VALUES 
            (
            '${id}', 
            '${username}',
            '${hashedPassword}'
            )`;
        const dbResponse = await db.run(createUserQuery);
        const newUserId = dbResponse.lastID;
        response.send(`Created new user with ${newUserId}`);
    } else {
        response.status = 400;
        response.send("User already exists");
    }
  });


app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

app.post("/todos/", async (request, response) => {
  const { id, user_id, description, status } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, user_id, description, status)
  VALUES
    (${id}, '${user_id}', '${description}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.get("/todos/", async (request, response) => {
  const {user_id} = request.body;
  getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        user_id=${user_id}`;
  data = await database.all(getTodosQuery);
  response.send(data);
});

app.put("/todos/:todoId", async (request, response) => {
  const {todoId} = request.params;
  const {newDescription} = request.body;

  updateTodo = `
      UPDATE todo
      SET description = '${newDescription}'
      WHERE
        id=${todoId}`;
  await database.run(updateTodo);
  response.send("Updated Successfully");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

app.get("/allusers/:user_id", async (request, response) => {
  const {user_id} = request.params;
  getTodosQuery = `
      SELECT
        *
      FROM
        users`;
  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/alltodos/", async (request, response) => {
  getTodosQuery = `
      SELECT
        *
      FROM
        todo`;
  data = await database.all(getTodosQuery);
  response.send(data);
});

/*const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };
  
  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };
  
  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };
  
  app.get("/todos/", async (request, response) => {
    let data = null;
    let getTodosQuery = "";
    const { search_q = "", priority, status } = request.query;
  
    switch (true) {
      case hasPriorityAndStatusProperties(request.query):
        getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}';`;
        break;
      case hasPriorityProperty(request.query):
        getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`;
        break;
      case hasStatusProperty(request.query):
        getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
        break;
      default:
        getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%';`;
    }
  
    data = await database.all(getTodosQuery);
    response.send(data);
  });
  
  app.get("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
  
    const getTodoQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        id = ${todoId};`;
    const todo = await database.get(getTodoQuery);
    response.send(todo);
  });
  
  app.post("/todos/", async (request, response) => {
    const { id, todo, priority, status } = request.body;
    const postTodoQuery = `
    INSERT INTO
      todo (id, todo, priority, status)
    VALUES
      (${id}, '${todo}', '${priority}', '${status}');`;
    await database.run(postTodoQuery);
    response.send("Todo Successfully Added");
  });
  
  app.put("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    let updateColumn = "";
    const requestBody = request.body;
    switch (true) {
      case requestBody.status !== undefined:
        updateColumn = "Status";
        break;
      case requestBody.priority !== undefined:
        updateColumn = "Priority";
        break;
      case requestBody.todo !== undefined:
        updateColumn = "Todo";
        break;
    }
    const previousTodoQuery = `
      SELECT
        *
      FROM
        todo
      WHERE 
        id = ${todoId};`;
    const previousTodo = await database.get(previousTodoQuery);
  
    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
    } = request.body;
  
    const updateTodoQuery = `
      UPDATE
        todo
      SET
        todo='${todo}',
        priority='${priority}',
        status='${status}'
      WHERE
        id = ${todoId};`;
  
    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  });
  
  app.delete("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  
    await database.run(deleteTodoQuery);
    response.send("Todo Deleted");
  });


  app.get("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
  
    const getTodoQuery = `
      SELECT
        *
      FROM
        todos
      WHERE
        id = ${todoId};`;
    const todo = await database.get(getTodoQuery);
    response.send(todo);
  });*/
module.exports = app;