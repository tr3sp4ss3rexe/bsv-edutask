const API = 'http://localhost:5000'

/* ---------- API bootstrap helpers (used by todo.cy.js) ---------------- */

/** POST /users/create  → returns { uid, user } */
Cypress.Commands.add('apiCreateUser', (fixtureName = 'user.json') => {
  return cy.fixture(fixtureName).then((user) => {
    return cy.request({
      method: 'POST',
      url:    `${API}/users/create`,
      form:   true,
      body:   user,
    }).its('body').then(body => {
      return { uid: body._id.$oid, user }
    })
  })
})

/** POST /tasks/create  → returns taskId */
Cypress.Commands.add('apiCreateTask', (uid) => {
  const body = {
    title:       'GUI-test task',
    description: 'Task created by Cypress',
    userid:      uid,
    url:         'watch?v=HKGjCPBSG38',
    todos:       'initial todo',
  }
  return cy.request({
    method: 'POST',
    url:    `${API}/tasks/create`,
    form:   true,
    body,
  }).its('body.0._id.$oid')
})
