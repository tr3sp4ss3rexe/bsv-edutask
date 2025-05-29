// commands.js
const API = 'http://localhost:5000';

// Expose API to specs
Cypress.env('API', API);

/* ---------- API bootstrap helpers (used by todo.cy.js) ---------------- */

/** POST /users/create  → returns { uid, user } */
Cypress.Commands.add('apiCreateUser', (fixtureName = 'user.json') => {
  return cy.fixture(fixtureName).then((user) => {
    const timestamp = Date.now();
    const [local, domain] = user.email.split('@');
    user.email = `${local}+${timestamp}@${domain}`;
    return cy.request({
      method: 'POST',
      url:    `${API}/users/create`,
      form:   true,
      body:   user,
    }).its('body').then(body => ({ uid: body._id.$oid, user }));
  });
});

/** POST /tasks/create  → returns taskId */
Cypress.Commands.add('apiCreateTask', (uid) => {
  const body = {
    title:       'GUI-test task',
    description: 'Task created by Cypress',
    userid:      uid,
    url:         'watch?v=HKGjCPBSG38',
    todos:       'initial todo',
  };
  return cy.request({
    method: 'POST',
    url:    `${API}/tasks/create`,
    form:   true,
    body,
  }).its('body.0._id.$oid');
});

/** DELETE /tasks/byid/:id */
Cypress.Commands.add('apiDeleteTask', (taskId) => {
  return cy.request({
    method: 'DELETE',
    url:    `${API}/tasks/byid/${taskId}`,
    failOnStatusCode: false,
  });
});

/** DELETE /users/:id */
Cypress.Commands.add('apiDeleteUser', (uid) => {
  return cy.request({
    method: 'DELETE',
    url:    `${API}/users/${uid}`,
    failOnStatusCode: false,
  });
});

/**
 * POST /todos/create → returns the created todo object
 * @param {string} taskId
 * @param {string} description
 * @returns Cypress.Chainable<Object>
 */
Cypress.Commands.add('apiCreateTodo', (taskId, description) => {
  return cy.request({
    method: 'POST',
    url:    `${API}/todos/create`,
    form:   true,
    body:   { description, taskid: taskId },
  }).its('body');
});

/**
 * PUT /todos/byid/:id → updates a todo (e.g. toggling done)
 * @param {string} todoId
 * @param {Object} updateData  // e.g. { $set: { done: true } }
 * @returns Cypress.Chainable<unknown>
 */
Cypress.Commands.add('apiUpdateTodo', (todoId, updateData) => {
  return cy.request({
    method: 'PUT',
    url:    `${API}/todos/byid/${todoId}`,
    form:   true,
    body:   { data: JSON.stringify(updateData) },
  });
});